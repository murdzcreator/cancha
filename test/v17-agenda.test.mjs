import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEspnProvider,normalizeEspnSchedule} from '../server/espn.mjs';
import {combineFixtures} from '../server/history.mjs';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8');
const db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const league={...db.leagues.find(l=>l.id==='per'),teams:['comerciantes-unidos','cienciano']};
const smallDb={...db,leagues:[league]};
const now=()=>new Date('2026-11-01T16:00:00Z');
const match=(extra={})=>({id:'777',date:'2026-12-10T21:00Z',league:{slug:'per.1'},season:{year:2026},competitions:[{date:'2026-12-10T21:00Z',timeValid:true,status:{type:{name:'STATUS_SCHEDULED',state:'pre'}},competitors:[{homeAway:'home',team:{id:'18153'},score:'0'},{homeAway:'away',team:{id:'3372'},score:'0'}]}],...extra});
const schedule=(club,events=[match()])=>({team:{id:club},season:{year:2026},events});
const response=data=>({ok:true,json:async()=>structuredClone(data)});
test('agenda valida club, temporada y liga; no incorpora encuentros de otras copas',()=>{
 const result=normalizeEspnSchedule(schedule('18153',[match(),match({id:'778',league:{slug:'conmebol.libertadores'}}),match({id:'779',season:{year:2025}})]),league,db,'18153');
 assert.equal(result.events.length,1);assert.equal(result.rejected,2);assert.equal(result.events[0].hs,null);
 assert.throws(()=>normalizeEspnSchedule(schedule('3372'),league,db,'18153'));
 assert.throws(()=>normalizeEspnSchedule({...schedule('18153'),season:{year:2025}},league,db,'18153'));
 assert.throws(()=>normalizeEspnSchedule({...schedule('18153'),requestedSeason:{year:2025}},league,db,'18153'));
 const unrelated=match();unrelated.competitions[0].competitors[1].team.id='2686';
 assert.equal(normalizeEspnSchedule(schedule('3372',[unrelated]),league,db,'3372').events.length,0);
});
test('fixture=true recupera un próximo fuera de la ventana diaria y deduplica las dos agendas',async()=>{
 const urls=[];const p=createEspnProvider({db:smallDb,now,fetchFn:async url=>{const u=new URL(url);urls.push(u);return response(u.pathname.endsWith('/schedule')?schedule(u.pathname.split('/').at(-2)):{leagues:[{slug:'per.1',calendar:[]}],events:[]})}});
 const data=await p.fixtures('per');
 assert.equal(data.events.length,1);assert.equal(data.events[0].id,'777');assert.equal(data.coverage.clubs,2);
 const calls=urls.filter(u=>u.pathname.endsWith('/schedule'));
 assert.equal(calls.length,2);assert.ok(calls.every(u=>u.searchParams.get('fixture')==='true'&&u.searchParams.get('season')==='2026'));
 assert.equal(data.events[0].status,'PROGRAMADO');
});
test('el marcador actual prevalece sobre el mismo ID de una agenda en caché',async()=>{
 const current=match();current.competitions[0].status={type:{state:'in'}};current.competitions[0].competitors[0].score='2';
 const p=createEspnProvider({db:smallDb,now,fetchFn:async url=>{const u=new URL(url);return response(u.pathname.endsWith('/schedule')?schedule(u.pathname.split('/').at(-2)):{leagues:[{slug:'per.1'}],events:[current]})}});
 const data=await p.fixtures('per');assert.equal(data.events.length,1);assert.equal(data.events[0].status,'EN VIVO');assert.equal(data.events[0].hs,2);
});
test('agendas simultáneas comparten consultas y las de club se reutilizan durante una hora',async()=>{
 const calls=[];let clock=now();const p=createEspnProvider({db:smallDb,now:()=>clock,fetchFn:async url=>{calls.push(url);const u=new URL(url);return response(u.pathname.endsWith('/schedule')?schedule(u.pathname.split('/').at(-2)):{leagues:[{slug:'per.1'}],events:[]})}});
 await Promise.all([p.fixtures('per'),p.fixtures('per')]);assert.equal(calls.filter(u=>u.includes('/schedule?')).length,2);
 clock=new Date(+clock+46000);await p.fixtures('per');assert.equal(calls.filter(u=>u.includes('/schedule?')).length,2);
 clock=new Date(+clock+3600000);await p.fixtures('per');assert.equal(calls.filter(u=>u.includes('/schedule?')).length,4);
});
test('fallos parciales no ocultan agendas válidas y la caída del scoreboard permite consultar próximos',async()=>{
 const p=createEspnProvider({db:smallDb,now,fetchFn:async url=>{const u=new URL(url);if(!u.pathname.includes('/18153/schedule'))throw Error('fuente caída');return response(schedule('18153'))}});
 const data=await p.fixtures('per');assert.equal(data.events.length,1);assert.equal(data.coverage.failedClubs,1);assert.equal(data.coverage.scoreboardAvailable,false);assert.equal(data.partial,true);assert.match(data.note,/parcial/);
});
test('consultar un día concreto conserva Perú y no descarga las agendas de temporada',async()=>{
 const calls=[];const e=match();e.competitions[0].date='2026-11-02T03:00Z';
 const p=createEspnProvider({db:smallDb,now,fetchFn:async url=>{calls.push(url);return response({leagues:[{slug:'per.1'}],events:[e]})}});
 const data=await p.fixtures('per','2026-11-01');assert.equal(data.events.length,1);assert.equal(calls.length,2);assert.ok(calls.every(url=>url.includes('/scoreboard?')));
});
test('la combinación repetida conserva la procedencia OpenFootball y el ID de ESPN',()=>{
 const local={id:'100',provider:'SoccerData',date:'2026-12-10',home:'comerciantes-unidos',away:'cienciano',status:'PROGRAMADO',hs:null,as:null};
 const remote=normalizeEspnSchedule(schedule('18153'),league,db,'18153').events[0];
 const once=combineFixtures([local],[remote]),twice=combineFixtures(once,[remote]);
 assert.equal(twice.length,1);assert.equal(twice[0].id,'777');assert.equal(twice[0].origins.length,2);
});

test('Premier y LaLiga actualizan un día provisional sin crear un próximo falso; otras copas conservan repeticiones',()=>{
 const local={id:'100',provider:'SoccerData',date:'2026-12-10',home:'a',away:'b',status:'PROGRAMADO',hs:null,as:null};
 const moved={...local,id:'200',provider:'ESPN',date:'2026-12-08T21:00:00Z',status:'FINAL',hs:2,as:0};
 const combined=combineFixtures([local],[moved],{singleRoundRobin:true});
 assert.equal(combined.length,1);assert.equal(combined[0].date,moved.date);assert.equal(combined[0].status,'FINAL');assert.equal(combined[0].origins.length,2);
 assert.equal(combineFixtures([local],[moved]).length,2);
 // Dos encuentros de la misma localía en la base son ambiguos: no se unen.
 assert.equal(combineFixtures([local,{...local,id:'101',date:'2026-11-01'}],[moved],{singleRoundRobin:true}).length,3);
});
