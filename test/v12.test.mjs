import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeRosters,selectStandings} from '../server/merge.mjs';
import {createPlayerIndex} from '../server/player-index.mjs';
import {makeProviders} from '../server/providers.mjs';
import os from 'node:os';import fs from 'node:fs';import path from 'node:path';
const db=JSON.parse(fs.readFileSync(new URL('../db.js',import.meta.url),'utf8').split('=')[1].trim().replace(/;$/,''));
test('combina perfiles iguales, respeta la prioridad y añade campos faltantes',()=>{
 const r=mergeRosters([
 {team:'alianza-lima',season:'2026',source:'A',players:[{id:'11',name:'Carlos Zambrano',country:null,number:3,provider:'A'}]},
 {team:'alianza-lima',season:'2026',source:'B',players:[{id:'40',name:'Carlos Zambrano',country:'Perú',number:90,provider:'B'},{id:'41',name:'Jugador Ejemplo',country:'Perú',provider:'B'}]},
 {team:'alianza-lima',season:'2025',source:'Antigua',players:[{id:'1',name:'Jugador antiguo'}]}
 ],{team:'alianza-lima',season:'2026'});
 assert.equal(r.players.length,2);assert.equal(r.players[0].number,3);assert.equal(r.players[0].country,'Perú');assert.deepEqual(r.players[0].sources,['A','B']);assert.equal(r.complete,false);
});
test('elige tabla completa antes que fragmentos gratuitos sin mezclar puntos de fechas distintas',()=>{
 const l=db.leagues.find(x=>x.id==='per');
 const r=selectStandings([{source:'TSD',quality:{complete:false,found:5},groups:[{rows:Array(5).fill({})}]},{source:'A',quality:{complete:true,found:18},groups:[{rows:Array(18).fill({})}]}],l);
 assert.equal(r.source,'A');assert.equal(r.partial,false);assert.equal(r.alternatives.length,1);
});
test('índice persiste futbolistas de plantillas consultadas y permite buscar',()=>{
 let dir=fs.mkdtempSync(path.join(os.tmpdir(),'cancha12-'));
 try {let s=createPlayerIndex(dir,{db,snapshots:{roster:{team:'alianza-lima',season:'2026',source:'Referencia',players:[{id:'12',name:'Jugador de prueba',position:'Portero'}]}}});
 assert.equal(s.listing({q:'jugador'}).total,1);
 assert.equal(s.one('alianza-lima','12').name,'Jugador de prueba');
 s.addRoster({team:'alianza-lima',season:'2026',source:'API',players:[{id:'23',name:'Jugador oficial',position:'Defensa'}]});
 const again=createPlayerIndex(dir,{db,snapshots:{}});assert.equal(again.one('alianza-lima','23').name,'Jugador oficial');
 } finally {fs.rmSync(dir,{recursive:true,force:true})}
});
test('encuentro de API-Football consulta eventos y estadísticas por endpoints separados',async()=>{
 const urls=[];const fetchFn=async url=>{let u=new URL(url);urls.push(u.pathname);
 let response=[];if(u.pathname.endsWith('/fixtures'))response=[{fixture:{id:100,date:'2026-10-26T20:00:00Z',status:{short:'FT'}},teams:{home:{name:'Alianza Lima'},away:{name:'Universitario'}},goals:{home:2,away:1}}];
 if(u.pathname.endsWith('/fixtures/events'))response=[{time:{elapsed:45},type:'Goal',player:{name:'Jugador'},detail:'Normal Goal'}];
 if(u.pathname.endsWith('/fixtures/statistics'))response=[{team:{name:'Alianza Lima'},statistics:[{type:'Shots on Goal',value:5}]},{team:{name:'Universitario'},statistics:[{type:'Shots on Goal',value:3}]}];
 if(u.pathname.endsWith('/fixtures/lineups'))response=[{team:{name:'Alianza Lima'},formation:'4-3-3',startXI:[{player:{name:'Portero'}}]}];
 return {ok:true,json:async()=>({errors:[],response})};
 };
 const p=makeProviders({fetchFn,env:{API_FOOTBALL_KEY:'TEST',API_FOOTBALL_DAILY_BUDGET:10},db});
 const d=await p.getMatchDetail('per','API-Football','100');assert.equal(d.events.length,1);assert.equal(d.stats.length,1);assert.equal(d.lineups.length,1);assert.equal(urls.length,5);
});
