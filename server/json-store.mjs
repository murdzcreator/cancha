import fs from 'node:fs';
import path from 'node:path';

// Una cola por archivo: agrupa cambios y mantiene el último JSON íntegro.
export function jsonStore(file, snapshot, {delay=20}={}) {
  let timer=null, pending=false, chain=Promise.resolve(), last='';
  const stats={writes:0};
  try { last=fs.readFileSync(file,'utf8'); } catch {}
  function schedule(){pending=true;if(!timer)timer=setTimeout(()=>{timer=null;flush().catch(()=>{});},delay);}
  function flush(){
    if(timer){clearTimeout(timer);timer=null;}
    chain=chain.catch(()=>{}).then(async()=>{
      if(!pending)return;pending=false;
      const text=JSON.stringify(snapshot());if(text===last)return;
      await fs.promises.mkdir(path.dirname(file),{recursive:true});
      const tmp=file+'.'+process.pid+'.tmp';
      try{await fs.promises.writeFile(tmp,text);await fs.promises.rename(tmp,file);last=text;stats.writes++;}
      catch(error){pending=true;await fs.promises.unlink(tmp).catch(()=>{});throw error;}
    });return chain;
  }
  return {schedule,flush,stats};
}
