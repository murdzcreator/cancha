import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEspnProvider,normalizeEspnEvent,normalizeEspnSummary,espnStatus,peruDay} from '../server/espn.mjs';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8');
const db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const league=db.leagues.find(l=>l.id==='per');
const ids=JSON.parse(fs.readFileSync(new URL('../server/espn-teams.json',import.meta.url))).leagues;
const final={type:{name:'STATUS_FULL_TIME',state:'post',completed:true}};
function event(overrides={}){return {id:'401886158',season:{year:2026},competitions:[{date:'2026-10-25T16:00Z',status:final,competitors:[{homeAway:'away',team:{id:'3372'},score:'0'},{homeAway:'home',team:{id:'18153'},score:'3'}]}],...overrides}}
function summary(){return {header:{...event(),league:{slug:'per.1'}},boxscore:{teams:[{team:{id:'3372'},statistics:[{name:'totalShots',displayValue:'0'}]},{team:{id:'18153'},statistics:[{name:'totalShots',displayValue:'15'}]}]},rosters:[{team:{id:'18153'},formation:'4-2-3-1',roster:[{athlete:{id:'123',displayName:'Jugador'},starter:true,jersey:'9',stats:[{name:'totalGoals',value:0},{name:'goalAssists',value:1}]},{athlete:{id:'124',displayName:'Suplente'},starter:false,subbedIn:true}]}],keyEvents:[]};}
const response=data=>({ok:true,json:async()=>data});
test('identidades ESPN cubren exactamente los participantes de las nueve competiciones',()=>{
 for(const l of db.leagues)assert.deepEqual(Object.values(ids[l.id]).sort(),[...l.teams].sort());
});
test('marcador y localía se asignan por homeAway, conservando el cero',()=>{
 const m=normalizeEspnEvent(event(),league,db);assert.equal(m.home,'comerciantes-unidos');assert.equal(m.away,'cienciano');assert.equal(m.hs,3);assert.equal(m.as,0);assert.equal(m.provider,'ESPN');
});
test('rechaza temporadas ajenas y equipos desconocidos, no inventa hora TBD',()=>{
 assert.equal(normalizeEspnEvent(event({season:{year:2025}}),league,db),null);
 const e=event();e.competitions[0].competitors[0].team.id='999999';assert.equal(normalizeEspnEvent(e,league,db),null);
 const noHour=event();noHour.competitions[0].timeValid=false;assert.equal(normalizeEspnEvent(noHour,league,db).date,'2026-10-25');
});
test('programados ocultan ceros del proveedor y un aplazado no es un final',()=>{
 const e=event();e.competitions[0].status={type:{state:'pre',name:'STATUS_SCHEDULED'}};
 const m=normalizeEspnEvent(e,league,db);assert.equal(m.hs,null);assert.equal(m.as,null);
 assert.equal(espnStatus({type:{name:'STATUS_POSTPONED',state:'post',completed:true}}),'APLAZADO');
 e.competitions[0].status={type:{state:'in'},displayClock:"45'+2'"};assert.equal(normalizeEspnEvent(e,league,db).minute,"45'+2'");
});
test('acta separa titulares y suplentes, ordena estadísticas por ID y deja ausentes los minutos',()=>{
 const d=normalizeEspnSummary(summary(),league,db,'401886158');
 assert.deepEqual(d.stats.find(x=>x.name==='Remates'),{name:'Remates',home:15,away:0});
 assert.equal(d.lineups[0].starting.length,1);assert.equal(d.lineups[0].substitutes.length,1);
 const s=d.lineups[0].starting[0].statistics[0];assert.equal(s.goals.total,0);assert.equal(s.goals.assists,1);assert.equal(s.games.minutes,null);assert.equal(s.games.rating,null);
});
test('no acepta actas de otra liga, temporada o identificador',()=>{
 const d=summary();d.header.league.slug='eng.1';assert.throws(()=>normalizeEspnSummary(d,league,db,'401886158'));
 assert.throws(()=>normalizeEspnSummary(summary(),league,db,'1'));
 const old=summary();old.header.season.year=2025;assert.throws(()=>normalizeEspnSummary(old,league,db,'401886158'));
});
test('el día de Perú incluye madrugada UTC del día siguiente y excluye el siguiente día peruano',async()=>{
 const late=event({id:'2'});late.competitions[0].date='2026-10-26T03:00Z';
 const outside=event({id:'3'});outside.competitions[0].date='2026-10-26T06:00Z';
 const requests=[];
 const p=createEspnProvider({db,now:()=>new Date('2026-10-25T17:00Z'),fetchFn:async url=>{requests.push(url);return response({leagues:[{slug:'per.1'}],events:url.endsWith('20261025')?[event()]:[late,outside]})}});
 const d=await p.fixtures('per','2026-10-25');assert.deepEqual(d.events.map(x=>x.id),['401886158','2']);assert.equal(requests.length,2);assert.equal(peruDay('2026-10-26T03:00Z'),'2026-10-25');
});
test('las consultas simultáneas comparten respuesta, caducan y conservan fecha al fallar la fuente',async()=>{
 let clock=new Date('2026-10-25T17:00Z'),calls=0,fail=false;
 const p=createEspnProvider({db,now:()=>clock,fetchFn:async()=>{calls++;await Promise.resolve();if(fail)throw Error('sin red');return response(summary())}});
 const [a,b]=await Promise.all([p.summary('per','401886158'),p.summary('per','401886158')]);assert.equal(calls,1);assert.equal(a.updatedAt,b.updatedAt);
 clock=new Date(+clock+46000);fail=true;const stale=await p.summary('per','401886158');assert.equal(calls,2);assert.equal(stale.stale,true);assert.equal(stale.updatedAt,a.updatedAt);
 await p.summary('per','401886158');assert.equal(calls,2);
});
test('errores en frío tienen espera de reintento y una respuesta inválida no se guarda como éxito',async()=>{
 let calls=0;const p=createEspnProvider({db,fetchFn:async()=>{calls++;return response({header:{id:'otro'}})}});
 await assert.rejects(()=>p.summary('per','401886158'));await assert.rejects(()=>p.summary('per','401886158'));assert.equal(calls,1);assert.equal(p.status().lastSuccess,null);
});
test('calendario por fases no se interpreta como días y una fecha sin hora conserva su día civil',async()=>{
 const e=event();e.competitions[0].timeValid=false;
 const p=createEspnProvider({db,now:()=>new Date('2026-10-25T17:00Z'),fetchFn:async()=>response({leagues:[{slug:'per.1',calendar:[{label:'Fase',entries:[]}]}],events:[e]})});
 const d=await p.fixtures('per','2026-10-25');assert.equal(d.events.length,1);assert.equal(d.events[0].date,'2026-10-25');
});
