import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeProviders} from '../server/providers.mjs';
import {matchTeam} from '../server/identity.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raw=fs.readFileSync(path.join(root,'db.js'),'utf8');
const db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
function response(d){return {ok:true,json:async()=>d}}
test('normaliza nombres de clubes sin enlazar coincidencias ambiguas',()=>{
 assert.equal(matchTeam('PSG',db.teams,db.leagues.find(l=>l.id==='ucl').teams),'paris-saint-germain');
 assert.equal(matchTeam('Alianza Lima',db.teams,db.leagues.find(l=>l.id==='per').teams),'alianza-lima');
 assert.equal(matchTeam('Un equipo inexistente',db.teams),null);
});
test('API-Football normaliza tabla peruana completa de 18 equipos',async()=>{
 const l=db.leagues.find(l=>l.id==='per');
 let count=0;
 const fetchFn=async(url,options)=>{count++;assert.match(String(url),/standings\?league=281&season=2026/);
 const items=l.teams.map((id,i)=>({rank:i+1,team:{id:i+100,name:db.teams[id].name},points:60-i,all:{played:20,win:15-i%3,draw:1,lose:4+i%3,goals:{for:30,against:9+i}},goalsDiff:20-i}));
 return response({errors:[],response:[{league:{standings:[items]}}]})};
 const p=makeProviders({fetchFn,env:{API_FOOTBALL_KEY:'TEST',API_FOOTBALL_DAILY_BUDGET:5},db});
 let r=await p.getStandings('per');assert.equal(r.source,'API-Football');assert.equal(r.groups[0].rows.length,18);assert.equal(r.quality.complete,true);assert.equal(r.groups[0].rows.find(x=>x.teamId==='alianza-lima')?.pj,20);assert.equal(count,1);
});
test('TheSportsDB free top-5 never counts as full 18-team standings',async()=>{
 let count=0;let fetchFn=async(url)=>{count++;if(String(url).includes('search_all_leagues.php'))return response({countrys:[{idLeague:'111',strLeague:'Peruvian Primera Division'}]});return response({table:[1,2,3,4,5].map((v,i)=>({idTeam:''+i,strTeam:db.teams[db.leagues[0].teams[i]].name,intRank:v,intPlayed:10,intWin:v,intDraw:0,intLoss:0,intPoints:v*3}))})};
 const p=makeProviders({fetchFn,env:{THESPORTSDB_KEY:'123'},db});
 let r=await p.getStandings('per');assert.equal(r.source,'TheSportsDB');assert.equal(r.partial,true);assert.equal(r.quality.found,5);assert.equal(r.quality.expected,18);assert.equal(count,2);
});
test('API-Football squads can load the real club without fake placeholders',async()=>{
 let fetchFn=async(url)=>{if(String(url).includes('/teams?'))return response({errors:[],response:[{team:{id:111,name:'Alianza Lima'}}]});return response({errors:[],response:[{players:[{id:123,name:'Futbolista de prueba',number:9,position:'Attacker',age:21}]}]})};
 const p=makeProviders({fetchFn,env:{API_FOOTBALL_KEY:'TEST'},db});let r=await p.getRoster('alianza-lima');assert.equal(r.source,'API-Football');assert.equal(r.players[0].position,'Delantero');assert.equal(r.complete,false);
});
