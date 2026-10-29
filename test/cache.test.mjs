import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {cacheLayer} from '../server/cache.mjs';
test('caché reutiliza y preserva última respuesta ante error',async()=>{
 let dir=fs.mkdtempSync(path.join(os.tmpdir(),'cancha-cache-'));try{let c=cacheLayer(dir),n=0;let f=()=>{n++;return {points:17}};
 let r=await c.retrieve('liga/per',300000,f);assert.equal(r.points,17);assert.equal(r.cache.state,'updated');
 let r2=await c.retrieve('liga/per',300000,f);assert.equal(r2.cache.state,'fresh');assert.equal(n,1);
 let fpath=fs.readdirSync(dir).find(x=>x.endsWith('.json'));let old=JSON.parse(fs.readFileSync(path.join(dir,fpath),'utf8'));old.savedAt=new Date(Date.now()-180000).toISOString();fs.writeFileSync(path.join(dir,fpath),JSON.stringify(old));
 let r3=await c.retrieve('liga/per',300000,()=>{throw Error('API caída')},{force:true});assert.equal(r3.points,17);assert.equal(r3.cache.state,'stale');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
