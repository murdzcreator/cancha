import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createEspnProvider,normalizeEspnStandings,normalizeEspnRoster} from '../server/espn.mjs';
import {combineFixtures,teamAnalytics,createHistory} from '../server/history.mjs';
import {createPlayerIndex} from '../server/player-index.mjs';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8'),db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,'')),l=db.leagues[0],ids=JSON.parse(fs.readFileSync(new URL('../server/espn-teams.json',import.meta.url))).leagues;
const reverse=Object.fromEntries(Object.entries(ids.per).map(([a,b])=>[b,a]));
const fixture=(extra={})=>({id:'1',provider:'ESPN',home:'alianza-lima',away:'universitario',homeName:'Alianza Lima',awayName:'Universitario',date:'2026-10-25T18:00:00Z',status:'FINAL',hs:0,as:0,...extra});
function entry(team,rank,points=0){return {team:{id:reverse[team]},stats:Object.entries({rank,gamesPlayed:1,wins:1,ties:0,losses:0,pointsFor:2,pointsAgainst:1,points,deductions:3}).map(([name,value])=>({name,value}))}}
test('tablas ESPN conservan rango, fase y sanciones; admiten puntos negativos sin inventar orden',()=>{
 const data={season:{year:2026},children:[{name:'Clausura',standings:{entries:l.teams.map((t,i)=>entry(t,i+1,i===0?-3:3))}}]};const r=normalizeEspnStandings(data,l,db);assert.equal(r.quality.complete,true);assert.equal(r.groups[0].label,'Clausura');assert.equal(r.groups[0].rows[0].pts,-3);assert.equal(r.groups[0].rows[0].position,1);assert.equal(r.groups[0].rows[0].dg,1);
 data.season.year=2025;assert.throws(()=>normalizeEspnStandings(data,l,db));
});
test('grupos pequeños de una competición se conservan separados',()=>{
 const small={...l,teams:l.teams.slice(0,2)},d={season:{year:2026},children:small.teams.map((t,i)=>({name:'Grupo '+i,standings:{entries:[entry(t,1)]}}))};const r=normalizeEspnStandings(d,small,db);assert.equal(r.groups.length,2);assert.equal(r.quality.complete,true);
});
test('plantillas se validan por club y temporada; cero dorsal y datos ausentes se conservan',()=>{
 const data={team:{id:reverse['alianza-lima']},season:{year:2026},athletes:[{id:'99',displayName:'Nombre',jersey:'0',position:{abbreviation:'G'}}]};const r=normalizeEspnRoster(data,db.teams['alianza-lima'],l);assert.equal(r.players[0].number,0);assert.equal(r.players[0].birth,null);assert.equal(r.players[0].position,'Portero');data.team.id='3372';assert.throws(()=>normalizeEspnRoster(data,db.teams['alianza-lima'],l));
});
test('el marcador de ayer se vuelve a consultar si el partido sigue en juego después de medianoche',async()=>{
 let clock=new Date('2026-10-31T04:55Z'),score=0,count=0;
 const p=createEspnProvider({db,now:()=>clock,fetchFn:async url=>({ok:true,json:async()=>{if(String(url).endsWith('20261030'))count++;return {leagues:[{slug:'per.1'}],events:String(url).endsWith('20261030')?[{id:'1',season:{year:2026},competitions:[{date:'2026-10-31T04:00Z',status:{type:{state:'in'}},competitors:[{homeAway:'home',team:{id:reverse['alianza-lima']},score:String(score)},{homeAway:'away',team:{id:reverse.universitario},score:'0'}]}]}]:[]}}})});
 await p.fixtures('per','2026-10-30');score=1;clock=new Date('2026-10-31T05:15Z');const after=await p.fixtures('per','2026-10-30');assert.equal(after.events[0].hs,1);assert.equal(count,2);
});
test('OpenFootball y ESPN se unen por clubes y fecha de Perú, conservando identidad y marcador actualizado',()=>{
 const local=fixture({id:'700',provider:'SoccerData',date:'2026-10-25',status:'PROGRAMADO',hs:null,as:null}),live=fixture({id:'900',hs:2,as:0});const r=combineFixtures([local],[live]);assert.equal(r.length,1);assert.equal(r[0].id,'900');assert.equal(r[0].hs,2);assert.equal(r[0].origins.length,2);assert.equal(local.id,'700');
 const distinct=combineFixtures([local,fixture({id:'701',provider:'SoccerData',date:'2026-11-01'})],[live]);assert.equal(distinct.length,2);
});
test('las estadísticas de resultado respetan localía, ceros y no incluyen programados',()=>{
 const r=teamAnalytics([fixture(),fixture({id:'2',home:'universitario',away:'alianza-lima',hs:1,as:3}),fixture({id:'3',status:'PROGRAMADO',hs:null,as:null})],'alianza-lima');assert.equal(r.total.played,2);assert.equal(r.total.gf,3);assert.equal(r.total.wins,1);assert.equal(r.home.draws,1);assert.equal(r.away.wins,1);assert.equal(r.total.cleanSheets,1);assert.equal(teamAnalytics([],'alianza-lima').total.goalsAverage,null);
});
test('historial persiste sin duplicar actas; suplentes sin participación no engrosan rankings',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-history-'));
 try{const h=createHistory(root,db),d={...fixture(),league:'per',season:'2026',updatedAt:'2026-10-25T22:00Z',lineups:[{team:'Alianza Lima',starting:[{id:'9',name:'Goleador',starter:true,statistics:[{goals:{total:0,assists:1},games:{minutes:null}}]}],substitutes:[{id:'10',name:'Sin ingreso',starter:false,subbedIn:false}]}]};h.detail('per',d);h.detail('per',d);const again=createHistory(root,db),a=again.analytics('per',null);assert.equal(a.coverage.details,1);assert.equal(a.players.length,1);assert.equal(a.players[0].played,1);assert.equal(a.players[0].goals,0);assert.equal(a.players[0].minutes,null);assert.equal(a.players[0].assists,1);
 h.detail('per',{...d,id:'bad',season:'2025'});assert.equal(h.analytics('per',null).coverage.details,1);
 h.detail('per',{...d,id:'empty',lineups:[]});assert.deepEqual(h.analytics('per',null).analysedMatches.sort(),['1','empty']);
 const index=createPlayerIndex(path.join(root,'index'),{db,snapshots:{}});index.addMatch(d);assert.ok(index.one('alianza-lima','9'));assert.ok(index.one('alianza-lima','10'));assert.equal(index.listing({q:'Goleador'}).players.length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
