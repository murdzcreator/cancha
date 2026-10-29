import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSoccerDataImports} from '../server/soccerdata-import.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dbRaw=fs.readFileSync(path.join(root,'db.js'),'utf8');
const db=JSON.parse(dbRaw.slice(dbRaw.indexOf('=')+1).trim().replace(/;\s*$/,''));

test('importación abre fichas con vecinos reales del catálogo sin inventar alineaciones',()=>{
 const importer=createSoccerDataImports(root,db),calendar=importer.fixtures('eng');
 assert.ok(calendar.events.length>=10);
 const event=calendar.events[3];
 const detail=importer.match('eng',event.id);
 assert.equal(detail.id,event.id);assert.equal(detail.home,event.home);assert.equal(detail.away,event.away);
 assert.equal(detail.hs,event.hs);assert.equal(detail.as,event.as);
 assert.deepEqual(detail.lineups,[]);assert.deepEqual(detail.stats,[]);assert.deepEqual(detail.events,[]);
 assert.ok(detail.relatedMatches?.home);assert.ok(detail.relatedMatches?.away);
 for(const club of [detail.home,detail.away]){
  const near=club===detail.home?detail.relatedMatches.home:detail.relatedMatches.away;
  for(const x of [...near.previous,...near.next]){
   assert.ok(x.id!==detail.id);
   assert.ok(x.home===club||x.away===club);
  }
 }
});
test('navegación de pestañas de ficha no usa enlaces hash que destruyen la ruta',()=>{
 const ui=fs.readFileSync(path.join(root,'universal.js'),'utf8');
 for(const name of ['v13-lineups','v13-events','v13-stats','v13-match-facts']){
  assert.ok(ui.includes(`data-v14-jump="${name}"`));
  assert.ok(!ui.includes(`href="#${name}"`));
 }
 assert.ok(ui.includes('relatedMatchHTML(data)'));
});
test('contadores importados sustituyen a los estáticos de la versión anterior',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const ui=fs.readFileSync(path.join(root,'live.js'),'utf8');
 assert.ok(app.includes('data-v14-fixture-summary'));
 assert.ok(app.includes('data-v14-league-counter'));
 assert.ok(ui.includes('updateFixtureCounters'));
 assert.ok(ui.includes('refreshLeagueCounter'));
});
