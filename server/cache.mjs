import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function cacheLayer(dir,{now=Date.now,cooldownMs=90000,maxEntries=128}={}){
  fs.mkdirSync(dir,{recursive:true});
  const running=new Map(),failures=new Map(),memory=new Map();
  const file=key=>path.join(dir,createHash('sha256').update(key).digest('hex')+'.json');
  function remember(key,data){memory.delete(key);memory.set(key,data);while(memory.size>maxEntries)memory.delete(memory.keys().next().value);return data;}
  function read(key){try{const d=JSON.parse(fs.readFileSync(file(key),'utf8'));return d?.value?d:null}catch{return null}}
  async function stored(key,force){
    if(!force&&memory.has(key))return remember(key,memory.get(key));
    try{const d=JSON.parse(await fs.promises.readFile(file(key),'utf8'));return d?.value?remember(key,d):null}catch{return null}
  }
  async function save(key,value){
    const data={savedAt:new Date(now()).toISOString(),value},target=file(key),tmp=target+'.'+process.pid+'.tmp';
    try{await fs.promises.writeFile(tmp,JSON.stringify(data));await fs.promises.rename(tmp,target);remember(key,data);}
    catch(error){await fs.promises.unlink(tmp).catch(()=>{});throw error;}
    return data;
  }
  async function retrieve(key,ttl,work,{force=false}={}){
    const saved=await stored(key,force),at=now(),age=saved?at-Date.parse(saved.savedAt):Infinity;
    const lifetime=typeof ttl==='function'?ttl(saved?.value):ttl;
    if(saved&&age<lifetime&&(!force||age<120000))return {...saved.value,cache:{state:'fresh',savedAt:saved.savedAt}};
    if(running.has(key))return running.get(key);
    const failure=failures.get(key);
    if(failure?.until>at){if(saved)return {...saved.value,cache:{state:'stale',savedAt:saved.savedAt,error:'Reintentaremos la consulta en unos minutos'}};throw failure.error;}
    // Registrar antes de invocar el trabajo también permite recuperar errores síncronos.
    const promise=Promise.resolve().then(work).then(async result=>{
      if(!result||typeof result!=='object')throw Error('Respuesta inválida');
      const record=await save(key,result);failures.delete(key);
      return {...result,cache:{state:'updated',savedAt:record.savedAt}};
    }).catch(error=>{failures.set(key,{until:now()+cooldownMs,error});if(saved)return {...saved.value,cache:{state:'stale',savedAt:saved.savedAt,error:'No se pudo actualizar la fuente'}};throw error;}).finally(()=>running.delete(key));
    running.set(key,promise);return promise;
  }
  return {retrieve,read};
}
