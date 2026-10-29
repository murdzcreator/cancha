import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {makeProviders} from '../server/providers.mjs';
const root=path.resolve(import.meta.dirname,'..');
const db=JSON.parse(fs.readFileSync(path.join(root,'db.js'),'utf8').split(' = ')[1].trim().replace(/;$/,''));
const facts=JSON.parse(fs.readFileSync(path.join(root,'club-facts.js'),'utf8').split('=')[1].trim().replace(/;$/,''));
test('183 clubes conservados y escudos locales de V12.4',()=>{
 assert.equal(Object.keys(db.teams).length,183);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/branding-manifest.json'),'utf8'));
 assert.ok(Object.keys(manifest.teams||{}).length>=170);
 assert.equal(Object.keys(manifest.leagues||{}).length,9);
});
test('cada uno de los 37 partidos históricos tiene identificador y equipos',()=>{
 assert.equal(db.matches.length,37);
 for(const m of db.matches){assert.ok(db.teams[m.home],m.id);assert.ok(db.teams[m.away],m.id);assert.ok(db.leagues.some(l=>l.id===m.league),m.id)}
});
test('hechos verificados tienen fuente y fecha, y no inventamos entrenadores para el resto',()=>{
 for(let t of ['paris-saint-germain','alianza-lima','aldosivi','manchester-united']){assert.ok(facts[t].coach);assert.ok(facts[t].source.startsWith('https://'));assert.ok(facts[t].checked)}
 assert.equal(facts['paris-saint-germain'].coach,'Luis Enrique');
 assert.equal(facts['alianza-lima'].coach,'Pablo Guede');
 assert.equal(facts['aldosivi'].coach,'Javier Sanguinetti');
 assert.equal(facts['manchester-united'].coach,'Michael Carrick');
});
test('búsqueda de ficha pública valida país y evita clubes homónimos',async()=>{
 const env={THESPORTSDB_KEY:'123'};
 let requests=0;
 const mockFetch=async url=>{
  requests++;
  if(String(url).includes('searchteams.php'))return {ok:true,json:async()=>({teams:[
   {idTeam:'aaa',strTeam:'Universitario',strCountry:'Bolivia',strLocation:'La Paz',strStadium:'Incorrecto'},
   {idTeam:'bbb',strTeam:'Universitario',strCountry:'Peru',strLocation:'Lima',strStadium:'Monumental'}
  ]})};
  throw Error('No se esperaba otra consulta');
 };
 const p=makeProviders({fetchFn:mockFetch,env,db});
 const r=await p.getClubProfile('universitario');
 assert.equal(r.city,'Lima');assert.equal(r.stadium,'Monumental');assert.equal(requests,1);
});
test('página contiene plantilla universal y fuente estática local',()=>{
 const h=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const x of ['universal.js','club-facts.js','v13.css'])assert.ok(h.includes(x));
 for(const f of ['centro.html','partido-psg-barcelona-2026.html'])assert.ok(fs.readFileSync(path.join(root,f),'utf8').includes('index.html'));
 const u=fs.readFileSync(path.join(root,'universal.js'),'utf8');assert.ok(u.includes('function matchHTML(data)'));assert.ok(u.includes('remoteMatchShell'));assert.ok(u.includes('Sin dato contrastado'));
});
