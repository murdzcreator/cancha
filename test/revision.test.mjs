import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {normalize,format,nearby} from '../server/dates.mjs';
import {safeInt} from '../server/identity.mjs';
import {makeProviders} from '../server/providers.mjs';
import {createSoccerDataImports} from '../server/soccerdata-import.mjs';
import {convertOpenFootball} from '../server/openfootball.mjs';
const root=path.resolve(import.meta.dirname,'..');
const db=JSON.parse(fs.readFileSync(path.join(root,'db.js'),'utf8').split('=',2)[1].trim().replace(/;$/,''));
test('fechas: rechaza días imposibles y horas sin zona, sin normalizar febrero a marzo',()=>{
 for(const x of ['2026-02-30','2026-13-01','2026-10-29T15:00:00','2026-10-29T25:00:00Z'])assert.equal(normalize(x),null,x);
 assert.equal(normalize('2024-02-29'),'2024-02-29');
 assert.match(format('2026-10-29'),/29.*2026.*hora por confirmar/);
 assert.match(format('2026-10-29T02:00:00Z'),/28.*21:00.*Perú/);
});
test('selección de partidos: evita los primeros ocho antiguos y programados vencidos',()=>{
 const now=new Date('2026-10-29T12:00:00Z');
 const data=[...Array.from({length:20},(_,i)=>({id:i,date:`2026-10-${String(i+1).padStart(2,'0')}`,status:'FINAL'})),{id:'expired',date:'2026-10-28',status:'PROGRAMADO'},{id:'next',date:'2026-10-30',status:'PROGRAMADO'}];
 const selected=nearby(data,8,now);assert.equal(selected.next[0].id,'next');assert.equal(selected.previous[0].id,19);assert.equal(selected.previous.length,7);
});
test('enteros: cero válido; fracciones, booleanos y blancos no se vuelven estadísticas',()=>{
 assert.equal(safeInt(0),0);for(const x of [true,' ',1.5])assert.equal(safeInt(x),null);
});
test('las nueve competiciones tienen clubes únicos y partidos ligados a equipos de la competición',()=>{
 assert.equal(db.leagues.length,9);
 for(const l of db.leagues){assert.equal(new Set(l.teams).size,l.teams.length);for(const t of l.teams)assert.ok(db.teams[t]);for(const m of db.matches.filter(m=>m.league===l.id)){assert.ok(l.teams.includes(m.home));assert.ok(l.teams.includes(m.away));assert.ok(normalize(m.date));}}
});
test('OpenFootball conserva el día si falta hora; convierte horario de verano e invierno',()=>{
 const names=['AFC Bournemouth','Arsenal FC','Aston Villa FC','Brentford FC','Brighton & Hove Albion FC','Chelsea FC','Coventry City FC','Crystal Palace FC','Everton FC','Fulham FC','Hull City AFC','Ipswich Town FC','Leeds United FC','Liverpool FC','Manchester City FC','Manchester United FC','Newcastle United FC','Nottingham Forest FC','Sunderland AFC','Tottenham Hotspur FC'];
 const matches=names.filter((_,i)=>i%2===0).map((n,i)=>({team1:n,team2:names[i*2+1],date:'2026-10-24'}));
 let data=convertOpenFootball({matches},'eng',db);assert.equal(data.fixtures.records[0].date,'2026-10-24');
 matches[0].time='15:00';assert.equal(convertOpenFootball({matches},'eng',db).fixtures.records[0].date,'2026-10-24T14:00:00.000Z');
 matches[0].date='2026-11-01';assert.equal(convertOpenFootball({matches},'eng',db).fixtures.records[0].date,'2026-11-01T15:00:00.000Z');
 matches[0].date='2026-02-30';assert.throws(()=>convertOpenFootball({matches},'eng',db));
});
test('importación no transforma FINAL sin resultado ni medio marcador en un resultado válido',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-regression-'));
 try{fs.mkdirSync(path.join(dir,'data-imports/soccerdata'),{recursive:true});fs.writeFileSync(path.join(dir,'data-imports/soccerdata/per-fixtures.json'),JSON.stringify({schema:'cancha-soccerdata-v1',league:'per',season:'2026',kind:'fixtures',provider:'Test',retrievedAt:'2026-10-29T10:00:00Z',records:[{id:'1',homeName:'Alianza Lima',awayName:'Universitario',date:'2026-10-29',status:'FINAL',hs:1,as:null},{id:'2',homeName:'Alianza Lima',awayName:'Universitario',date:'2026-11-01',status:'PROGRAMADO',hs:0,as:0}]}));
 const events=createSoccerDataImports(dir,db).fixtures('per').events;assert.equal(events[0].status,'SIN CONFIRMAR');assert.equal(events[0].hs,null);assert.equal(events[0].date,'2026-10-29');assert.equal(events[1].hs,null);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
function mockProvider({competition=281,season=2026,reverse=true}={}){
 return makeProviders({db,env:{API_FOOTBALL_KEY:'TEST'},fetchFn:async url=>{
 const p=new URL(url).pathname;let response=[];
 if(p==='/fixtures')response=[{league:{id:competition,season},fixture:{id:1,date:'2026-10-29T02:00:00Z',status:{short:'FT'}},teams:{home:{id:10,name:'Alianza Lima'},away:{id:20,name:'Universitario'}},goals:{home:1,away:0}}];
 if(p==='/fixtures/statistics'){response=[{team:{id:10},statistics:[{type:'Shots',value:9}]},{team:{id:20},statistics:[{type:'Shots',value:0}]}];if(reverse)response.reverse();}
 return {ok:true,json:async()=>({errors:[],response})};}});
}
test('estadísticas local/visitante se unen por ID del equipo aunque el proveedor invierta las filas',async()=>{
 const d=await mockProvider().getMatchDetail('per','API-Football','1');assert.deepEqual(d.stats,[{name:'Shots',home:9,away:0}]);
});
test('no permite abrir un partido de otra liga ni otra temporada',async()=>{
 await assert.rejects(mockProvider({competition:39}).getMatchDetail('per','API-Football','1'),/otra competición/);
 await assert.rejects(mockProvider({season:2025}).getMatchDetail('per','API-Football','1'),/otra temporada/);
});
test('vista: alineaciones invertidas se ubican por equipo y no heredan estadísticas del rival',()=>{
 const window={CANCHA_DB:db,CANCHA_BRAND:{teamHTML:id=>id},CANCHA_DATES:globalThis.CANCHA_DATES};
 vm.runInNewContext(fs.readFileSync(path.join(root,'universal.js'),'utf8'),{window,document:{addEventListener(){}},Intl,Date});
 const data={home:'alianza-lima',away:'universitario',homeName:'Alianza Lima',awayName:'Universitario',date:'2026-10-29',league:'per',lineups:[{team:'Universitario',starting:[{id:20,name:'Visitante'}]},{team:'Alianza Lima',starting:[{id:10,name:'Local'}]}],playerStats:[{team:'Universitario',players:[{id:10,name:'Local',statistics:[{games:{rating:99}}]}]}]};
 const html=window.CANCHA_UNIVERSAL.matchHTML(data);assert.match(html,/side-home[^>]*[^]*?Ficha de Local/);assert.doesNotMatch(html,/v13-grade/);assert.match(html,/Sin dato contrastado/);
});

test('diferencia de goles: corrige la resta conservando cifra fuente, puntos y posición',async()=>{
 const {reconcileStandings}=await import('../server/standings.mjs');
 const data={groups:[{rows:[{teamId:'juan-pablo-ii-college',gf:45,gc:56,dg:-15,pts:38,position:11}]}]};
 const r=reconcileStandings(data);assert.equal(r.groups[0].rows[0].dg,-11);assert.equal(r.groups[0].rows[0].reportedDg,-15);assert.equal(r.groups[0].rows[0].pts,38);assert.equal(r.groups[0].rows[0].position,11);assert.equal(data.groups[0].rows[0].dg,-15);assert.equal(r.warnings.length,1);
});
