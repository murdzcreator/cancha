import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createSoccerDataImports} from '../server/soccerdata-import.mjs';
const db = JSON.parse(fs.readFileSync(new URL('../db.js',import.meta.url),'utf8').split('=',2)[1].trim().replace(/;$/,''));
function setup(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-sd-'));const dir=path.join(root,'data-imports/soccerdata');fs.mkdirSync(dir,{recursive:true});return {root,dir,s:createSoccerDataImports(root,db)}}
function save(dir,league,kind,records,{season,provider='Sofascore'}={}){
 const l=db.leagues.find(x=>x.id===league);
 fs.writeFileSync(path.join(dir,`${league}-${kind}.json`),JSON.stringify({schema:'cancha-soccerdata-v1',league,season:season||l.season,kind,provider,retrievedAt:'2026-10-27T18:00:00Z',records}));
}
test('ningún calendario importado = no sobreescritura del proveedor',()=>{const a=setup();assert.equal(a.s.fixtures('per'),null);assert.equal(a.s.standings('eng'),null);fs.rmSync(a.root,{recursive:true,force:true})});
test('partidos de liga válidos quedan navegables sin estadísticas inventadas',()=>{
 const a=setup();save(a.dir,'per','fixtures',[{id:'1001',homeName:'Alianza Lima',awayName:'Universitario',date:'2026-10-25T22:00:00Z',hs:1,as:1,status:'FINAL'},{id:'1002',homeName:'Alianza Lima',awayName:'Otro Barcelona',date:'2026-11-01T22:00:00Z',status:'PROGRAMADO'}]);
 let data=a.s.fixtures('per');assert.equal(data.events.length,1);assert.equal(data.rejected.length,1);assert.equal(data.events[0].home,'alianza-lima');assert.equal(data.events[0].provider,'SoccerData');assert.equal(a.s.match('per','1001').lineups.length,0);fs.rmSync(a.root,{recursive:true,force:true});
});
test('tablas parciales no se presentan como clasificaciones completas',()=>{
 const a=setup();save(a.dir,'per','standings',[{team:'Alianza Lima',pj:3,g:2,e:1,p:0,gf:6,gc:2,dg:4,pts:7}]);
 let r=a.s.standings('per');assert.equal(r.quality.complete,false);assert.equal(r.groups[0].rows[0].position,null);fs.rmSync(a.root,{recursive:true,force:true});
});
test('rechaza valores que contradicen PJ = ganados + empates + perdidos',()=>{
 const a=setup();save(a.dir,'eng','standings',[{team:'Arsenal',pj:20,g:15,e:2,p:9,gf:40,gc:10,pts:47}]);assert.equal(a.s.standings('eng').groups[0].rows.length,0);fs.rmSync(a.root,{recursive:true,force:true});
});
test('temporada incorrecta o club ambiguo no entran en CANCHA',()=>{
 const a=setup();save(a.dir,'eng','fixtures',[{id:'900',homeName:'Arsenal',awayName:'Chelsea',date:'2026-10-25T12:00:00Z'}],{season:'2025/26'});
 assert.equal(a.s.fixtures('eng'),null);fs.rmSync(a.root,{recursive:true,force:true});
});
