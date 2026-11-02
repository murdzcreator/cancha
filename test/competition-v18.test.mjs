import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {qualification,recentForm} from '../server/competition.mjs';
import {createEspnProvider,normalizeEspnStandings} from '../server/espn.mjs';
import {createPlayerIndex} from '../server/player-index.mjs';
import {createHistory} from '../server/history.mjs';
import '../dates.js';
import '../view-utils.js';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8'),db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const league={...db.leagues.find(l=>l.id==='per'),teams:['comerciantes-unidos','cienciano']},small={...db,leagues:[league]},V=globalThis.CANCHA_VIEW;
const game=(id,extra={})=>({id,provider:'ESPN',home:'comerciantes-unidos',away:'cienciano',homeName:'Comerciantes Unidos',awayName:'Cienciano',date:'2026-10-25T20:00:00Z',status:'FINAL',hs:1,as:0,...extra});
const rawEvent=()=>({id:'100',league:{slug:'per.1'},season:{year:2026},competitions:[{date:'2026-10-25T20:00Z',status:{type:{state:'post',completed:true}},competitors:[{homeAway:'home',team:{id:'18153'},score:{value:2}},{homeAway:'away',team:{id:'3372'},score:{value:0}}]}]});
const response=data=>({ok:true,json:async()=>structuredClone(data)});

test('V18: las zonas proceden de notas reconocidas, incluyendo previas y permanencia',()=>{
 for(const [description,key] of [['Champions League','champions'],['Champions League Qualifying','champions-qualifier'],['Europa League','europa'],['Conference League','conference'],['Relegation','relegation'],['Relegation Playoffs','relegation-playoff'],['Copa Libertadores','libertadores'],['Copa Sudamericana','sudamericana'],['Promotion Playoff','promotion-playoff']]){
  const z=qualification({description});assert.equal(z.key,key);assert.equal(z.source,'ESPN');assert.equal(z.publishedLabel,description);
 }
 assert.equal(qualification({description:'Club con partido pendiente'}),null);assert.equal(qualification(null),null);
});
test('V18: la clasificación conserva notas por club sin asignar zonas por posición genérica',()=>{
 const entries=['18153','3372'].map((id,i)=>({team:{id},note:i?undefined:{description:'Relegation'},stats:Object.entries({rank:i+1,gamesPlayed:1,wins:0,ties:1,losses:0,pointsFor:0,pointsAgainst:0,points:1}).map(([name,value])=>({name,value}))}));
 const d=normalizeEspnStandings({season:{year:2026},standings:{entries}},league,db);assert.equal(d.groups[0].rows[0].zone.key,'relegation');assert.equal(d.groups[0].rows[1].zone,null);
});
test('V18: forma de cinco partidos de antiguo a reciente, con localía y empate a cero',()=>{
 const rows=Array.from({length:7},(_,i)=>game(String(i),{date:`2026-10-${20+i}T20:00:00Z`,hs:i===6?0:1,as:i===6?0:0}));
 rows[5]={...rows[5],home:'cienciano',away:'comerciantes-unidos'};
 const before=rows.map(m=>m.id),form=recentForm([...rows,rows[6]],'comerciantes-unidos');
 assert.deepEqual(form.map(m=>m.id),['2','3','4','5','6']);assert.deepEqual(form.map(m=>m.result),['V','V','V','D','E']);assert.deepEqual(rows.map(m=>m.id),before);
});
test('V18: la forma excluye marcadores ausentes, estados no finales, fechas y cifras inválidas',()=>{
 const rows=[game('valid'),game('no-score',{hs:null}),game('live',{status:'EN VIVO'}),game('bad-date',{date:'2026-02-30'}),game('negative',{hs:-1}),game('huge',{as:100}),game('other',{home:'a',away:'b'})];
 assert.deepEqual(recentForm(rows,'comerciantes-unidos').map(m=>m.id),['valid']);assert.deepEqual(recentForm(rows,'desconocido'),[]);
});
test('V18: resultados fixture=false y futuros fixture=true usan cachés independientes',async()=>{
 const calls=[];const p=createEspnProvider({db:small,now:()=>new Date('2026-11-01T15:00Z'),fetchFn:async url=>{
  const u=new URL(url);calls.push(u);if(!u.pathname.endsWith('/schedule'))return response({leagues:[{slug:'per.1'}],events:[]});
  const past=u.searchParams.get('fixture')==='false';return response({team:{id:u.pathname.split('/').at(-2)},season:{year:2026},events:past?[rawEvent()]:[]});
 }});
 const [a,b]=await Promise.all([p.results('per'),p.results('per')]);assert.equal(a.events.length,1);assert.equal(b.events[0].hs,2);assert.equal(a.coverage.clubs,2);
 assert.equal(calls.length,2);assert.ok(calls.every(u=>u.searchParams.get('fixture')==='false'));
 await p.fixtures('per');assert.equal(calls.filter(u=>u.searchParams.get('fixture')==='true').length,2);assert.equal(calls.filter(u=>u.searchParams.get('fixture')==='false').length,2);
});
test('V18: fallos parciales de resultados conservan clubes válidos sin mezclar copas',async()=>{
 const p=createEspnProvider({db:small,fetchFn:async url=>{if(url.includes('/3372/'))throw Error('Sin red');const wrong=rawEvent();wrong.id='101';wrong.league.slug='eng.1';return response({team:{id:'18153'},season:{year:2026},events:[rawEvent(),wrong]})}});
 const d=await p.results('per');assert.deepEqual(d.events.map(m=>m.id),['100']);assert.equal(d.coverage.failedClubs,1);assert.equal(d.coverage.rejected,1);
});
test('V18: Hoy/Mañana/siete días usan el día de Perú y cruzan mes y año',()=>{
 const now=new Date('2027-01-01T02:00:00Z');assert.deepEqual(V.range('today','',now),{from:'2026-12-31',to:'2026-12-31'});assert.deepEqual(V.range('tomorrow','',now),{from:'2027-01-01',to:'2027-01-01'});assert.deepEqual(V.range('week','',now),{from:'2026-12-31',to:'2027-01-06'});
 assert.deepEqual(V.range('custom','2026-02-30',now),V.range('today','',now));assert.deepEqual(V.range('custom','2026-11-03',now),{from:'2026-11-03',to:'2026-11-03'});
});
test('V18: paginación permite recorrer los 183 clubes y ajusta índices tras filtrar',()=>{
 const rows=Array.from({length:183},(_,i)=>i),seen=[];for(let i=0;i<8;i++)seen.push(...V.page(rows,i,24).items);assert.deepEqual(seen,rows);assert.equal(V.page([1,2],7,25).index,0);assert.equal(V.page([],4).start,0);assert.equal(V.page(rows,-1,24).index,0);assert.equal(V.normalize('  Atlético  '),'atletico');
});
test('V18: el filtro de jugadores por liga intersecta club y nombre sin perder clubes compartidos',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-directory-'));
 try{const index=createPlayerIndex(root,{db:{...db,matchPlayers:{}},snapshots:{}});index.addRoster({team:'arsenal',players:[{id:'1',name:'Jugador Inglés'}]});index.addRoster({team:'alianza-lima',players:[{id:'2',name:'Jugador Perú'}]});
  assert.deepEqual(index.listing({league:'eng'}).players.map(p=>p.team),['arsenal']);assert.equal(index.listing({league:'eng',team:'alianza-lima'}).total,0);assert.equal(index.listing({league:'eng',q:'ingles'}).total,1);assert.equal(index.listing({league:'ucl'}).total,Number(db.teams.arsenal.leagues.includes('ucl')));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('V18: la cobertura de club y jugador no reutiliza el total de la competición',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-coverage-'));
 try{const h=createHistory(root,db);h.observe('per',{season:'2026',events:[game('1'),game('2',{home:'alianza-lima',away:'universitario'})]});const d={...game('1'),league:'per',season:'2026',lineups:[{team:'Cienciano',starting:[{id:'9',name:'Jugador',starter:true,statistics:[{goals:{total:0}}]}],substitutes:[]}]};h.detail('per',d);
  const a=h.analytics('per',null);assert.equal(a.coverage.results,2);assert.deepEqual(a.teamCoverage.cienciano,{results:1,details:1});assert.deepEqual(a.teamCoverage['alianza-lima'],{results:1,details:0});assert.deepEqual(a.teamCoverage['sporting-cristal'],{results:0,details:0});
  assert.equal(V.coverage(a,'team','cienciano').label,'1 resultado del club · 1 acta');assert.equal(V.coverage(a,'player','cienciano','9').label,'1 partido · goles publicados en 1');assert.equal(a.players[0].goals,0);assert.equal(a.players[0].assists,null);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
