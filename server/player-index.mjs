import fs from 'node:fs';
import path from 'node:path';
import {clean} from './identity.mjs';
// Almacén de jugadores observados: nunca se presenta como el censo completo de todos los equipos.
export function createPlayerIndex(dir,{db,snapshots}){
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'players-index.json');
 let state={};try{state=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
 function addRoster(r){
  if(!r?.team||!Array.isArray(r.players))return;
  const key=r.team;state[key]={team:key,season:r.season,source:r.source,updatedAt:r.updatedAt||null,
   snapshot:!!r.snapshot,players:r.players.map(p=>({id:String(p.id),name:p.name,position:p.position||null,number:p.number??null,country:p.country||null,birth:p.birth||null,age:p.age??null,photo:p.photo||null,provider:p.provider||r.source}))};
  const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state));fs.renameSync(tmp,file);
 }
 // Seed reference snapshots and match reference as a minimum offline catalogue.
 if(snapshots?.roster && !state[snapshots.roster.team])addRoster(snapshots.roster);
 for(const t of [...new Set(Object.values(db.matchPlayers||{}).map(p=>p.team))]){
  if(state[t])continue;const players=Object.values(db.matchPlayers||{}).filter(p=>p.team===t).map(p=>({...p,provider:'Referencia visual del partido'}));
  if(players.length)addRoster({team:t,season:'2026/27',source:'Referencia de alineación PSG–Barcelona · no equivale a plantilla actual',updatedAt:null,snapshot:true,players});
 }
 function listing({q='',team='',limit=80,offset=0}={}){
  const list=Object.values(state).flatMap(r=>(r.players||[]).map(p=>({...p,team:r.team,season:r.season,source:r.source,updatedAt:r.updatedAt,snapshot:r.snapshot})));
  const match= list.filter(p=>(!team||p.team===team)&&(!q||clean(p.name).includes(clean(q))));
  return {total:match.length,teamsIndexed:Object.keys(state).length,coverage:'Sólo plantillas consultadas o instantáneas incorporadas; no es un directorio exhaustivo',players:match.slice(offset,offset+limit)};
 }
 function one(team,id){return listing({team,limit:1000}).players.find(p=>p.id===id)||null}
 function coverage(){return Object.entries(state).map(([t,r])=>({team:t,count:r.players.length,updatedAt:r.updatedAt||null,source:r.source,snapshot:r.snapshot}))}
 return {addRoster,listing,one,coverage};
}
