import test from 'node:test';
import assert from 'node:assert/strict';
import {matchPaths,validSVG,validRaster} from '../server/crest-catalog.mjs';
const db={teams:{
 'arsenal':{name:'Arsenal',country:'Inglaterra'},
 'fc-barcelona':{name:'FC Barcelona',country:'España'},
 'alianza-lima':{name:'Alianza Lima',country:'Perú'},
 'inter-de-milan':{name:'Inter de Milán',country:'Italia'},
 'not-match':{name:'Talleres',country:'Argentina'}
}};
test('solo nombre exacto + país correcto; aliases explícitos',()=>{
 const paths=['logos/england/Arsenal.svg','logos/spain/Barcelona.svg','logos/peru/Alianza Lima.svg','logos/italy/Inter Milan.svg','logos/chile/Talleres.svg','logos/argentina/Talleres B.svg'];
 const x=matchPaths(db,paths);
 assert.equal(x.matched.arsenal,'logos/england/Arsenal.svg');
 assert.equal(x.matched['fc-barcelona'],'logos/spain/Barcelona.svg');
 assert.equal(x.matched['alianza-lima'],'logos/peru/Alianza Lima.svg');
 assert.equal(x.matched['inter-de-milan'],'logos/italy/Inter Milan.svg');
 assert.ok(x.unmatched['not-match']);
});
test('archivos de un club homónimo extranjero no contaminan el escudo',()=>{
 const x=matchPaths({teams:{'universitario':{name:'Universitario',country:'Perú'}}},['logos/chile/Universitario.svg']);
 assert.equal(Object.keys(x.matched).length,0)
});
test('rechaza SVG con scripts, enlaces externos y png incorrectos',()=>{
 assert.equal(validSVG(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle r="90"/></svg>')),true);
 assert.equal(validSVG(Buffer.from('<svg onload="alert(1)"></svg>')),false);
 assert.equal(validSVG(Buffer.from('<svg><image href="https://evil.example/x"/></svg>')),false);
 assert.equal(validRaster(Buffer.from('not a png'.repeat(30))),false);
});

test('integración automática: descarga SVG de ruta exacta y guarda manifest, sin intervención manual',async()=>{
 const fs=await import('node:fs/promises');const os=await import('node:os');const path=await import('node:path');
 const {fillCrests}=await import('../server/crest-catalog.mjs');
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'cancha-crest-test-'));await fs.mkdir(path.join(root,'assets'));
 const original=globalThis.fetch;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 0 L100 0 L100 100 L0 100 Z"/></svg>';
 globalThis.fetch=async url=>{
  if(String(url).includes('/git/trees/'))return new Response(JSON.stringify({truncated:false,tree:[{type:'blob',path:'logos/peru/Alianza Lima.svg'}]}),{status:200});
  if(String(url).includes('/logos/peru/Alianza%20Lima.svg'))return new Response(svg,{status:200});
  return new Response('Not found',{status:404});
 };
 try{
  const result=await fillCrests({root,db:{teams:{'alianza-lima':{name:'Alianza Lima',country:'Perú'}}},concurrency:1});
  assert.equal(result.downloaded,1);assert.equal(result.matched,1);
  assert.equal((await fs.readFile(path.join(root,'assets','escudos','alianza-lima.svg'),'utf8')),svg);
  const manifest=JSON.parse(await fs.readFile(path.join(root,'assets','branding-manifest.json'),'utf8'));
  assert.equal(manifest.teams['alianza-lima'].curatedLocal,'assets/escudos/alianza-lima.svg');
 }finally{globalThis.fetch=original;await fs.rm(root,{recursive:true,force:true})}
});
