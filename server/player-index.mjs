import fs from 'node:fs';
import path from 'node:path';
import {clean} from './identity.mjs';
import {jsonStore} from './json-store.mjs';

// Nóminas y actas se conservan por club/temporada, con fechas independientes.
export function createPlayerIndex(dir,{db,snapshots}){
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'players-index.json');
 const currentSeason=(team,league='')=>db.leagues.find(l=>l.id===(league||db.teams[team]?.leagues.find(id=>id!=='ucl')||db.teams[team]?.leagues[0]))?.season;
 let state={version:2,rosters:{},observations:{}};
 const key=(team,season)=>team+'@'+season;
 try{const old=JSON.parse(fs.readFileSync(file,'utf8'));if(old.version===2&&old.rosters&&old.observations)state=old;else for(const r of Object.values(old)){if(!r?.team||!Array.isArray(r.players))continue;const bucket=/parcial|observados/.test(r.source||'')?'observations':'rosters';state[bucket][key(r.team,r.season||currentSeason(r.team))]={...r,season:r.season||currentSeason(r.team)};}}catch{}
 const store=jsonStore(file,()=>state);
 const normalize=p=>({id:String(p.id),name:p.name,position:p.position||null,number:p.number??null,country:p.country||null,birth:p.birth||null,age:p.age??null,photo:p.photo||null,provider:p.provider||'ESPN'});
 function addRoster(r){
  if(!db.teams[r?.team]||!Array.isArray(r.players)||r.stale||r.cache?.state==='stale')return false;
  const season=r.season||currentSeason(r.team),k=key(r.team,season),old=state.rosters[k];
  if(old?.updatedAt&&r.updatedAt&&Date.parse(r.updatedAt)<Date.parse(old.updatedAt))return false;
  const record={team:r.team,season,source:r.source,updatedAt:r.updatedAt||null,snapshot:!!r.snapshot,players:r.players.map(p=>normalize({...p,provider:p.provider||r.source}))};
  if(JSON.stringify(old)===JSON.stringify(record))return false;state.rosters[k]=record;store.schedule();return true;
 }
 if(snapshots?.roster&&!state.rosters[key(snapshots.roster.team,snapshots.roster.season||currentSeason(snapshots.roster.team))])addRoster(snapshots.roster);
 for(const team of [...new Set(Object.values(db.matchPlayers||{}).map(p=>p.team))]){
  const season=currentSeason(team);if(state.rosters[key(team,season)]||state.observations[key(team,season)])continue;
  const players=Object.values(db.matchPlayers||{}).filter(p=>p.team===team).map(p=>({...p,provider:'Referencia visual del partido'}));
  if(players.length)addRoster({team,season,source:'Referencia de alineación PSG–Barcelona · no equivale a plantilla actual',snapshot:true,players});
 }
 function addMatch(d){
  if(d.provider!=='ESPN'||d.stale||d.cache?.state==='stale')return false;let changed=false;
  for(const lineup of d.lineups||[]){const team=Object.keys(db.teams).find(id=>db.teams[id].name===lineup.team);if(!team)continue;
   const season=d.season||currentSeason(team,d.league),k=key(team,season),old=state.observations[k];
   if(old?.updatedAt&&d.updatedAt&&Date.parse(d.updatedAt)<Date.parse(old.updatedAt))continue;
   const players=[...(old?.players||[])];
   for(const p of [...(lineup.starting||[]),...(lineup.substitutes||[])]){
    const item={...normalize({...p,provider:'ESPN'}),lastSeenAt:d.updatedAt||null},i=players.findIndex(q=>q.id===item.id||clean(q.name)===clean(item.name));
    if(i<0)players.push(item);else players[i]={...players[i],...item};
   }
   const record={team,season,source:'ESPN · registros de actas',updatedAt:d.updatedAt||old?.updatedAt||null,players};
   if(JSON.stringify(record)!==JSON.stringify(old)){state.observations[k]=record;changed=true;}
  }
  if(changed)store.schedule();return changed;
 }
 function records({team='',league='',season=''}={}){
  const candidates=[...new Set([...Object.keys(state.rosters),...Object.keys(state.observations)])],result=[];
  for(const k of candidates){const roster=state.rosters[k],observed=state.observations[k],r=roster||observed;
   if((team&&r.team!==team)||(league&&!db.teams[r.team]?.leagues.includes(league))||r.season!==(season||currentSeason(r.team,league)))continue;
   const players=new Map();for(const p of roster?.players||[])players.set(p.id,{...p,team:r.team,season:r.season,source:roster.source,updatedAt:roster.updatedAt,snapshot:!!roster.snapshot,scope:roster.snapshot?'reference':'roster',rosterFetchedAt:roster.updatedAt,lastSeenAt:observed?.players.find(q=>q.id===p.id)?.lastSeenAt||null});
   for(const p of observed?.players||[])if(!players.has(p.id))players.set(p.id,{...p,team:r.team,season:r.season,source:observed.source,updatedAt:observed.updatedAt,snapshot:false,scope:'match-observation',rosterFetchedAt:roster?.updatedAt||null,lastSeenAt:p.lastSeenAt||observed.updatedAt});
   result.push({team:r.team,season:r.season,roster,observed,players:[...players.values()]});
  }return result;
 }
 function listing({q='',team='',league='',season='',limit=80,offset=0}={}){
  const list=records({team,league,season}).flatMap(r=>r.players).filter(p=>!q||clean(p.name).includes(clean(q)));
  return {total:list.length,teamsIndexed:records().length,coverage:'Plantillas consultadas y registros de actas de la temporada indicada; no es un censo exhaustivo',players:list.slice(offset,offset+limit)};
 }
 function one(team,id,season=''){return listing({team,season,limit:10000}).players.find(p=>p.id===String(id))||null}
 function coverage(){return records().map(r=>({team:r.team,season:r.season,count:r.players.length,updatedAt:r.roster?.updatedAt||r.observed?.updatedAt||null,source:r.roster?.source||r.observed?.source,snapshot:!!r.roster?.snapshot,rosterSource:r.roster?.source||null,rosterFetchedAt:r.roster?.updatedAt||null,lastSeenAt:r.observed?.updatedAt||null}))}
 return {addRoster,addMatch,listing,one,coverage,flush:store.flush,storageStats:store.stats};
}
