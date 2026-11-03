import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHistory,combineFixtures} from '../server/history.mjs';
import {createPlayerIndex} from '../server/player-index.mjs';
import {cacheLayer} from '../server/cache.mjs';
import {createFootballService} from '../server/football-service.mjs';
import {createEspnProvider} from '../server/espn.mjs';
import {analyticsView,miniAnalytics} from '../server/presenters.mjs';
import {respond,serveFile} from '../server/http-response.mjs';
import {build} from '../scripts/build.mjs';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8'),db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const game=(extra={})=>({id:'901',league:'eng',season:'2026/27',provider:'ESPN',home:'arsenal',away:'chelsea',homeName:'Arsenal',awayName:'Chelsea',date:'2026-11-02T20:00:00Z',status:'FINAL',hs:2,as:0,updatedAt:'2026-11-02T22:00:00Z',...extra});
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-v19-')),h=createHistory(root,db),index=createPlayerIndex(path.join(root,'data-cache'),{db:{...db,matchPlayers:{}},snapshots:{}});t.after(async()=>{await h.flush();await index.flush();fs.rmSync(root,{recursive:true,force:true})});return {root,h,index};}
test('una agenda anterior no sustituye un final ni una corrección más reciente',t=>{
 const {h}=setup(t);h.observe('eng',{events:[game()]});
 h.observe('eng',{events:[game({status:'EN VIVO',hs:1,updatedAt:'2026-11-02T21:00:00Z'})]});
 assert.equal(h.fixtures('eng')[0].status,'FINAL');assert.equal(h.fixtures('eng')[0].hs,2);
 h.observe('eng',{events:[game({hs:3,updatedAt:'2026-11-02T23:00:00Z'})]});assert.equal(h.fixtures('eng')[0].hs,3);
 h.observe('eng',{events:[game({updatedAt:'2026-11-02T22:30:00Z'})]});assert.equal(h.fixtures('eng')[0].hs,3);
 h.observe('eng',{events:[game({status:'PROGRAMADO',hs:null,as:null,updatedAt:'2026-11-03T01:00:00Z'})]});assert.equal(h.fixtures('eng')[0].status,'FINAL');
});
test('combinar archivos conserva la observación más reciente del mismo encuentro',()=>{
 const a=game({observedAt:'2026-11-02T22:00:00Z'}),b=game({status:'EN VIVO',hs:1,observedAt:'2026-11-02T21:00:00Z'});assert.equal(combineFixtures([a],[b])[0].hs,2);
});
test('consultas idénticas no reescriben el historial y las correcciones invalidan analytics',async t=>{
 const {root,h}=setup(t);h.observe('eng',{events:[game()]});await h.flush();const a=h.analytics('eng');
 for(let i=0;i<3;i++)h.observe('eng',{events:[game({updatedAt:'2026-11-03T00:00:00Z'})]});await h.flush();assert.equal(h.storageStats.writes,1);assert.equal(h.analytics('eng'),a);
 h.observe('eng',{events:[game({hs:3,updatedAt:'2026-11-03T01:00:00Z'})]});await h.flush();assert.notEqual(h.analytics('eng'),a);assert.equal(h.storageStats.writes,2);assert.equal(createHistory(root,db).fixtures('eng')[0].hs,3);
});
test('un acta recibida fuera de orden conserva el resultado y los detalles anteriores',t=>{
 const {h}=setup(t);h.detail('eng',game({stats:[{name:'Remates',home:10,away:4}]}));
 assert.equal(h.detail('eng',game({status:'EN VIVO',hs:1,updatedAt:'2026-11-02T21:00:00Z',stats:[]})),false);assert.equal(h.match('eng','901').stats.length,1);assert.equal(h.analytics('eng').coverage.details,1);
});
test('la caché se recupera de una excepción síncrona tras su plazo de reintento',async t=>{
 const {root}=setup(t);let now=0,n=0;const c=cacheLayer(path.join(root,'cache'),{now:()=>now,cooldownMs:90});
 await assert.rejects(c.retrieve('test',10,()=>{n++;throw Error('primero')}));await assert.rejects(c.retrieve('test',10,()=>{n++;return {ok:true}}));assert.equal(n,1);
 now=91;const d=await c.retrieve('test',10,()=>{n++;return {ok:true}});assert.equal(d.ok,true);assert.equal(n,2);
});
test('consultas concurrentes comparten un único trabajo y devuelven su fecha original',async t=>{
 const {root}=setup(t),c=cacheLayer(path.join(root,'cache'));let n=0;const work=async()=>{n++;return {updatedAt:'2026-11-01',events:[]}};
 const rows=await Promise.all(Array.from({length:8},()=>c.retrieve('same',60000,work)));assert.equal(n,1);assert.ok(rows.every(r=>r.updatedAt==='2026-11-01'));
});
test('el índice migra temporadas antiguas sin mezclarlas con las plantillas actuales',async t=>{
 const {root}=setup(t),dir=path.join(root,'old');fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'players-index.json'),JSON.stringify({arsenal:{team:'arsenal',season:'2025/26',source:'ESPN',players:[{id:'1',name:'Antiguo'}]}}));
 const index=createPlayerIndex(dir,{db:{...db,matchPlayers:{}},snapshots:{}});assert.equal(index.listing({team:'arsenal'}).total,0);assert.equal(index.listing({team:'arsenal',season:'2025/26'}).total,1);
 index.addRoster({team:'arsenal',season:'2026/27',source:'ESPN',players:[{id:'2',name:'Actual'}]});assert.equal(index.listing({team:'arsenal'}).players[0].name,'Actual');await index.flush();
});
test('la consulta de plantilla y la observación de cada jugador tienen fechas distintas',t=>{
 const {index}=setup(t);index.addRoster({team:'arsenal',season:'2026/27',source:'ESPN',updatedAt:'2026-11-01T12:00:00Z',players:[{id:'9',name:'Titular'},{id:'10',name:'No observado'}]});
 index.addMatch(game({lineups:[{team:'Arsenal',starting:[{id:'9',name:'Titular'},{id:'11',name:'Acta'}]}]}));
 const p=index.one('arsenal','9');assert.equal(p.rosterFetchedAt,'2026-11-01T12:00:00Z');assert.equal(p.lastSeenAt,'2026-11-02T22:00:00Z');assert.equal(index.one('arsenal','10').lastSeenAt,null);assert.equal(index.one('arsenal','11').scope,'match-observation');
 assert.equal(index.coverage()[0].rosterFetchedAt,'2026-11-01T12:00:00Z');
});
function service(t){const s=setup(t),calls=[];const espn={fixtures:async(l,d)=>{calls.push(['day',l,d]);return {league:l,season:'2026/27',updatedAt:'2026-11-03T00:00:00Z',source:'ESPN',events:[]}},schedule:async(l,team,o)=>{calls.push(['club',team,!!o?.results]);return {league:l,season:'2026/27',events:[game()]}},results:async l=>{calls.push(['results',l]);return {season:'2026/27',events:[game()]}},summary:async()=>{calls.push(['detail']);return game({stats:[],lineups:[]})}};
 const api=createFootballService({db,espn,soccerdata:{fixtures:()=>null},history:s.h,cache:cacheLayer(path.join(s.root,'cache')),playerIndex:s.index});return {...s,api,calls};}
test('la primera vista de competición solo consulta el día, sin descargar temporadas ni actas',async t=>{const {api,calls}=service(t);const d=await api.overview('eng');assert.equal(calls.length,1);assert.equal(calls[0][0],'day');assert.equal(d.resultsReady,false);assert.equal(d.analytics.coverage.details,0);});
test('la agenda de un club consulta solo ese club y el día actual',async t=>{const {api,calls}=service(t);const d=await api.fixtures('eng',null,'arsenal');assert.equal(d.events.length,1);assert.deepEqual(calls.filter(x=>x[0]==='club'),[['club','arsenal',false],['club','arsenal',true]]);assert.equal(calls.filter(x=>x[0]==='day').length,1);});
test('resultados y ampliación simultáneos comparten consultas y el mismo acta',async t=>{const {api,calls}=service(t);await Promise.all([api.enrich('eng'),api.enrich('eng')]);assert.equal(calls.filter(x=>x[0]==='results').length,1);assert.equal(calls.filter(x=>x[0]==='detail').length,1);});
test('las respuestas por jugador y club excluyen el archivo de toda la liga',t=>{const {h}=setup(t);h.detail('eng',game({lineups:[{team:'Arsenal',starting:[{id:'9',name:'Jugador',starter:true,statistics:[{goals:{total:2}}]}]}]}));const all=h.analytics('eng'),p=analyticsView(all,{view:'player',team:'arsenal',player:'9'}),club=analyticsView(all,{view:'team',team:'arsenal'});assert.equal(p.players.length,1);assert.equal(p.players[0].matches.length,1);assert.equal(p.events,undefined);assert.equal(club.rows.length,1);assert.equal(club.players.length,0);assert.ok(JSON.stringify(p).length<JSON.stringify(all).length/2);assert.equal(miniAnalytics(all).players[0].matches,undefined);});
test('la cola ESPN prioriza el día en vivo sobre las agendas pendientes y limita a cuatro',async()=>{
 const league=db.leagues.find(l=>l.id==='eng'),small={...db,leagues:[{...league,teams:league.teams.slice(0,6)}]},calls=[],release=[];let active=0,max=0;
 const p=createEspnProvider({db:small,fetchFn:async url=>{calls.push(url);active++;max=Math.max(max,active);if(calls.length<=4)await new Promise(r=>release.push(r));active--;const u=new URL(url);return {ok:true,json:async()=>u.pathname.endsWith('/schedule')?{team:{id:u.pathname.split('/').at(-2)},season:{year:2026},events:[]}:{leagues:[{slug:league.espn}],events:[]}}}});
 const results=p.results('eng');await new Promise(r=>setImmediate(r));const live=p.fixtures('eng','2026-11-02');release.shift()();await new Promise(r=>setImmediate(r));assert.ok(calls[4].includes('/scoreboard?'));release.forEach(r=>r());await Promise.all([results,live]);assert.ok(max<=4);
});
const response=()=>({headers:null,code:0,body:null,writeHead(code,h){this.code=code;this.headers=h},end(body){this.body=body}});
test('las respuestas comprimen texto, respetan q=0 y validan estáticos con ETag',async t=>{const {root}=setup(t),payload=JSON.stringify({value:'x'.repeat(8000)}),res=response();await respond({headers:{'accept-encoding':'gzip'}},res,200,payload,{'Content-Type':'application/json'});assert.equal(gunzipSync(res.body).toString(),payload);assert.ok(res.body.length<200);const plain=response();await respond({headers:{'accept-encoding':'gzip;q=0'}},plain,200,payload,{'Content-Type':'application/json'});assert.equal(plain.headers['Content-Encoding'],undefined);const file=path.join(root,'test.js');fs.writeFileSync(file,payload);const first=response();await serveFile({headers:{}},first,file,'text/javascript');const next=response();await serveFile({headers:{'if-none-match':first.headers.ETag}},next,file,'text/javascript');assert.equal(next.code,304);});
test('los paquetes y la hoja única corresponden a sus fuentes',async()=>{const graph=await build({check:true});assert.ok(graph.bundles.universal.includes('club-facts.js'));assert.ok(graph.css.includes('v19.css'));});
test('un acta en vivo y un marcador corregido siguen pendientes de análisis final',t=>{
 const {h}=setup(t);h.detail('eng',game({status:'EN VIVO',updatedAt:'2026-11-02T21:00:00Z'}));h.observe('eng',{events:[game()]});assert.deepEqual(h.analytics('eng').analysedMatches,[]);
 h.detail('eng',game());assert.deepEqual(h.analytics('eng').analysedMatches,['901']);h.observe('eng',{events:[game({hs:3,updatedAt:'2026-11-02T23:00:00Z'})]});assert.deepEqual(h.analytics('eng').analysedMatches,[]);assert.equal(h.analytics('eng').coverage.details,0);
});
test('reiniciar conserva la fecha de verificación sin reescribir todo el historial idéntico',async t=>{
 const {root,h}=setup(t);h.observe('eng',{events:[game({updatedAt:undefined})]});await h.flush();h.observe('eng',{events:[game({updatedAt:'2026-11-03T00:00:00Z'})]});await h.flush();assert.equal(h.storageStats.writes,1);
 const restarted=createHistory(root,db);restarted.observe('eng',{events:[game({hs:1,updatedAt:'2026-11-02T23:00:00Z'})]});assert.equal(restarted.fixtures('eng')[0].hs,2);await restarted.flush();
});
