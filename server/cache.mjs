import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function cacheLayer(dir){
  fs.mkdirSync(dir,{recursive:true}); const running=new Map();const retryCooldown=new Map();
  function file(key){return path.join(dir,createHash('sha256').update(key).digest('hex')+'.json')}
  function read(key){try{const d=JSON.parse(fs.readFileSync(file(key),'utf8'));return d?.value ? d:null}catch{return null}}
  function save(key,value){const f=file(key); const data=JSON.stringify({savedAt:new Date().toISOString(),value}); fs.writeFileSync(f+'.tmp',data);fs.renameSync(f+'.tmp',f)}
  async function retrieve(key, ttl, work,{force=false}={}){
    const saved=read(key),now=Date.now(),age=saved?now-Date.parse(saved.savedAt):Infinity;
    if(saved && age<ttl && (!force || age<120000)) return {...saved.value,cache:{state:'fresh',savedAt:saved.savedAt}};
    if(running.has(key))return running.get(key);
    if(saved && retryCooldown.get(key)>now)return {...saved.value,cache:{state:'stale',savedAt:saved.savedAt,error:'Reintentaremos la consulta en unos minutos'}};
    const promise=(async()=>{try{const result=await work();if(!result || typeof result!=='object')throw Error('Respuesta inválida');save(key,result);retryCooldown.delete(key);return {...result,cache:{state:'updated',savedAt:new Date().toISOString()}};}catch(e){retryCooldown.set(key,now+90_000);if(saved)return {...saved.value,cache:{state:'stale',savedAt:saved.savedAt,error:'No se pudo actualizar la fuente'}};throw e;}finally{running.delete(key)}})();
    running.set(key,promise);return promise;
  }
  return {retrieve,read};
}
