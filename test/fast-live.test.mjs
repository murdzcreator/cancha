import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import '../live-policy.js';
import {createLiveChannel,serveMatchStream} from '../server/live-channel.mjs';
import {createFootballService} from '../server/football-service.mjs';
import {createEspnProvider} from '../server/espn.mjs';
import {createHistory} from '../server/history.mjs';
import {createPlayerIndex} from '../server/player-index.mjs';
import {cacheLayer} from '../server/cache.mjs';
const P=globalThis.CANCHA_LIVE_POLICY,settle=()=>new Promise(r=>setImmediate(r));
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8'),db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
function clock(){let at=Date.parse('2026-11-03T20:00:00Z'),id=0;const tasks=new Map();return {now:()=>at,setTimer:(fn,ms)=>{tasks.set(++id,{fn,ms});return id},clearTimer:id=>tasks.delete(id),tasks,advance:async()=>{const [id,t]=tasks.entries().next().value;tasks.delete(id);at+=t.ms;await t.fn();await settle()}};}
const fixture=(time,extra={})=>({id:'901',status:'EN VIVO',hs:0,as:0,minute:'12',updatedAt:new Date(time).toISOString(),sync:{checkedAt:new Date(time).toISOString(),intervalSeconds:10,stale:false},...extra});
test('el modo rápido consulta en 10 s, usa caché de 5 s y reduce actividad antes/después',()=>{
 const now=Date.parse('2026-11-03T20:00:00Z');assert.equal(P.interval({status:'EN VIVO'}),10000);assert.equal(P.ttl({status:'EN VIVO'}),5000);assert.equal(P.interval({status:'PROGRAMADO',date:'2026-11-03T20:10:00Z'},now),30000);assert.equal(P.interval({status:'PROGRAMADO',date:'2026-11-04T20:00:00Z'},now),60000);assert.equal(P.interval({status:'FINAL'}),0);assert.ok(P.interval({status:'FINAL',stale:true})>0);assert.equal(P.ttl({status:'FINAL',stale:true}),5000);
});
test('dos espectadores comparten una consulta y reciben cambios sin descargar fichas idénticas',async()=>{
 const c=clock(),a=[],b=[];let calls=0,score=0;const channel=createLiveChannel({...c,load:async()=>{calls++;return fixture(c.now(),{hs:score})}});
 const offA=channel.subscribe('ucl:901',p=>a.push(p)),offB=channel.subscribe('ucl:901',p=>b.push(p));await settle();assert.equal(calls,1);assert.equal(a[0].type,'match');assert.equal(b[0].data.hs,0);assert.equal([...c.tasks.values()][0].ms,10000);
 await c.advance();assert.equal(calls,2);assert.equal(a.at(-1).type,'sync');score=1;await c.advance();assert.equal(a.at(-1).type,'match');assert.equal(b.at(-1).data.hs,1);
 offA();assert.equal(channel.status().listeners,1);offB();assert.deepEqual(channel.status(),{rooms:0,listeners:0});assert.equal(c.tasks.size,0);
});
test('el resultado final se entrega a todos y detiene la consulta compartida',async()=>{
 const c=clock(),packets=[];let final=false;const channel=createLiveChannel({...c,load:async()=>fixture(c.now(),final?{status:'FINAL',sync:{stale:false,intervalSeconds:0}}:{})});const off=channel.subscribe('ucl:901',p=>packets.push(p));await settle();final=true;await c.advance();assert.equal(packets.at(-2).data.status,'FINAL');assert.equal(packets.at(-1).type,'complete');assert.equal(c.tasks.size,0);off();
});
test('la desconexión del último espectador descarta la respuesta pendiente y libera su consulta',async()=>{
 const c=clock(),packets=[];let resolve;const channel=createLiveChannel({...c,load:()=>new Promise(r=>resolve=r)});const off=channel.subscribe('ucl:901',p=>packets.push(p));off();resolve(fixture(c.now()));await settle();assert.equal(packets.length,0);assert.equal(c.tasks.size,0);assert.equal(channel.status().rooms,0);
});
test('los fallos avisan, conservan el último dato y espacian los reintentos',async()=>{
 const c=clock(),packets=[];let fail=false;const channel=createLiveChannel({...c,load:async()=>{if(fail)throw Error('fuente caída');return fixture(c.now())}});const off=channel.subscribe('ucl:901',p=>packets.push(p));await settle();fail=true;await c.advance();assert.equal(packets.at(-1).type,'warning');assert.equal([...c.tasks.values()][0].ms,10000);await c.advance();assert.equal([...c.tasks.values()][0].ms,20000);fail=false;await c.advance();assert.equal(packets.at(-1).type,'sync');assert.equal([...c.tasks.values()][0].ms,10000);off();
});
test('el seguimiento tiene un límite y el cierre libera todos los espectadores',async()=>{
 const c=clock(),channel=createLiveChannel({...c,maxRooms:1,maxListeners:2,load:async()=>fixture(c.now())});let off;const a=channel.subscribe('ucl:901',p=>{if(p.type==='shutdown')off()});off=channel.subscribe('ucl:901',()=>{});assert.throws(()=>channel.subscribe('ucl:902',()=>{}));await settle();channel.close();a();off();assert.deepEqual(channel.status(),{rooms:0,listeners:0});assert.equal(c.tasks.size,0);
});
test('el transporte SSE evita caché/buffering y libera el seguimiento al cerrar la respuesta',async()=>{
 const c=clock(),channel=createLiveChannel({...c,load:async()=>fixture(c.now())}),req=new EventEmitter();
 class Response extends EventEmitter{writableLength=0;chunks=[];writeHead(code,headers){this.code=code;this.headers=headers}flushHeaders(){}write(s){this.chunks.push(s)}end(){this.emit('close')}}
 const res=new Response();serveMatchStream(req,res,channel,'ucl:901');await settle();assert.equal(res.headers['Content-Type'],'text/event-stream; charset=utf-8');assert.equal(res.headers['X-Accel-Buffering'],'no');assert.ok(res.headers['Cache-Control'].includes('no-transform'));assert.ok(res.chunks.join('').includes('event: match'));res.end();assert.equal(channel.status().rooms,0);assert.equal(c.tasks.size,0);
});
test('las dos cachés permiten datos nuevos en cada ciclo de 10 s y mantienen el aviso de copia antigua',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-fast-'));let at=Date.parse('2026-11-03T20:00:00Z'),calls=0,score=0,fail=false;
 const espn=createEspnProvider({db,now:()=>new Date(at),fetchFn:async()=>{calls++;if(fail)throw Error('sin fuente');return {ok:true,json:async()=>({header:{id:'901',league:{slug:'per.1'},season:{year:2026},competitions:[{date:'2026-11-03T20:00:00Z',status:{type:{state:'in'},displayClock:"12'"},competitors:[{homeAway:'home',team:{id:'18153'},score:String(score)},{homeAway:'away',team:{id:'3372'},score:'0'}]}]},boxscore:{teams:[]},rosters:[],keyEvents:[]})}}});
 const history=createHistory(root,db),index=createPlayerIndex(path.join(root,'data-cache'),{db:{...db,matchPlayers:{}},snapshots:{}}),service=createFootballService({db,espn,soccerdata:{fixtures:()=>null},history,playerIndex:index,cache:cacheLayer(path.join(root,'cache'),{now:()=>at})});
 try{await Promise.all([service.detail('per','901'),service.detail('per','901')]);assert.equal(calls,1);at+=10000;score=1;const next=await service.detail('per','901');assert.equal(calls,2);assert.equal(next.hs,1);at+=10000;fail=true;const stale=await service.detail('per','901');assert.equal(calls,3);assert.equal(stale.hs,1);assert.equal(stale.stale,true);assert.equal(stale.sync.stale,true);assert.equal(stale.updatedAt,next.updatedAt);
 }finally{await history.flush();await index.flush();fs.rmSync(root,{recursive:true,force:true})}
});
