import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {packageRuntime} from '../scripts/package-runtime.mjs';
const root=path.resolve(import.meta.dirname,'..');
test('la edición ligera conserva módulos y escudos sin fuentes duplicadas, pruebas ni cachés personales',async()=>{
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'cancha-runtime-'));
 try{const report=await packageRuntime({out});assert.ok(report.rootItems<20);assert.ok(report.bytes<12*1024*1024);
  const entries=new Set(report.entries.map(r=>r.path)),pkg=JSON.parse(await fs.readFile(path.join(out,'package.json'),'utf8'));
  assert.deepEqual(Object.keys(pkg.scripts),['start']);assert.equal(pkg.version,JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version);
  for(const name of entries)assert.ok(!/^(?:review|test|scripts|work|output|data-cache)\//.test(name)&&name!=='.env',name);
  for(const name of ['app.js','home.js','styles.css','v18.css','assets/branding-data.js'])assert.ok(!entries.has(name));
  for(const name of ['client/bootstrap.js','client/bundles/core.js','client/bundles/universal.js','dates.js','db.js','Dockerfile','render.yaml','PUBLICAR_WEB.md'])assert.ok(entries.has(name),name);
  for(const name of entries)if(name.startsWith('server/')&&name.endsWith('.mjs')||name==='server.mjs'){
   const s=await fs.readFile(path.join(out,name),'utf8');for(const match of s.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){const dep=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));assert.ok(entries.has(dep),name+' requiere '+dep);}
  }
  const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/branding-manifest.json'),'utf8'));
  for(const item of [...Object.values(manifest.teams),...Object.values(manifest.leagues)])for(const name of [item.local,item.curatedLocal].filter(Boolean)){try{await fs.access(path.join(root,name))}catch{continue}assert.ok(entries.has(name),name)}
 }finally{await fs.rm(out,{recursive:true,force:true})}
});
test('empaquetar rechaza carpetas usadas y antecesores del proyecto sin borrar su contenido',async()=>{
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'cancha-keep-'));
 try{await fs.writeFile(path.join(out,'personal.txt'),'conservar');await assert.rejects(packageRuntime({out}),/carpeta de salida vacía/);assert.equal(await fs.readFile(path.join(out,'personal.txt'),'utf8'),'conservar');await assert.rejects(packageRuntime({out:root}),/proyecto de origen/);}finally{await fs.rm(out,{recursive:true,force:true})}
});
