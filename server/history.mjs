import fs from 'node:fs';
import path from 'node:path';
import {normalize,compare} from './dates.mjs';
import {jsonStore} from './json-store.mjs';
const day=m=>m.date.length===10?m.date:new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Lima'}).format(new Date(m.date));
const final=m=>m.status==='FINAL'&&Number.isInteger(m.hs)&&m.hs>=0&&m.hs<=99&&Number.isInteger(m.as)&&m.as>=0&&m.as<=99;
const pair=(a,b)=>a.home===b.home&&a.away===b.away;
const observed=m=>Date.parse(m.observedAt||m.updatedAt||'');
export function preferMatch(old,incoming,{correction=false}={}){
 const a=observed(old),b=observed(incoming);
 if(Number.isFinite(a)&&(!Number.isFinite(b)||b<a))return old;
 if(final(old)&&!final(incoming)&&!correction)return old;
 return incoming;
}
export function combineFixtures(local=[],remote=[],{singleRoundRobin=false}={}){
 const result=local.map(x=>({...x,origins:x.origins?.map(o=>({...o}))||[{provider:x.provider,id:x.id}]}));
 for(const m of remote){let candidates=result.filter(x=>pair(x,m)&&(x.provider===m.provider?String(x.id)===String(m.id):day(x)===day(m)));
  // Premier y LaLiga: una sola localía por pareja en la temporada. ESPN puede
  // mover el día provisional de OpenFootball (p. ej. del domingo al viernes).
  if(!candidates.length&&singleRoundRobin){const samePair=result.filter(x=>pair(x,m));if(samePair.length===1&&samePair[0].provider!==m.provider)candidates=samePair;}
  if(candidates.length===1){const old=candidates[0],index=result.indexOf(old),winner=preferMatch(old,m);
   result[index]={...winner,origins:[...old.origins.filter(o=>!(o.provider===m.provider&&String(o.id)===String(m.id))),{provider:m.provider,id:m.id}],...(winner===m?{}:{alternate:{provider:m.provider,id:m.id}})};
  }else result.push({...m,origins:[{provider:m.provider,id:m.id}]});
 }
 return result.sort(compare);
}
function summary(games,team){const x={played:0,wins:0,draws:0,losses:0,gf:0,gc:0,cleanSheets:0,failedToScore:0};
 for(const m of games){const gf=m.home===team?m.hs:m.as,gc=m.home===team?m.as:m.hs;x.played++;x[gf>gc?'wins':gf<gc?'losses':'draws']++;x.gf+=gf;x.gc+=gc;x.cleanSheets+=Number(gc===0);x.failedToScore+=Number(gf===0)}
 return {...x,dg:x.gf-x.gc,goalsAverage:x.played?Number((x.gf/x.played).toFixed(2)):null,winPercent:x.played?Math.round(x.wins*100/x.played):null};}
export function teamAnalytics(events,team){const games=events.filter(m=>final(m)&&(m.home===team||m.away===team)).sort(compare);return {team,total:summary(games,team),home:summary(games.filter(m=>m.home===team),team),away:summary(games.filter(m=>m.away===team),team),recent:games.slice(-5).reverse().map(m=>({match:m,result:m.hs===m.as?'E':(m.home===team?m.hs>m.as:m.as>m.hs)?'V':'D'}))};}
export function createHistory(root,db){
 const file=path.join(root,'data-cache','history-v1.json');let data={fixtures:{},details:{}};
 try{const old=JSON.parse(fs.readFileSync(file,'utf8'));if(old.fixtures&&old.details)data=old}catch{}
 data.days||={};
 const watermarkFile=path.join(root,'data-cache','history-observations-v1.json');let watermarks={};try{watermarks=JSON.parse(fs.readFileSync(watermarkFile,'utf8'))}catch{}
 for(const [season,rows] of Object.entries(data.fixtures))for(const [id,m] of Object.entries(rows)){const seen=watermarks[season]?.[id];if(Number.isFinite(Date.parse(seen))&&(!Number.isFinite(observed(m))||Date.parse(seen)>observed(m)))m.observedAt=seen;}
 const watermarkStore=jsonStore(watermarkFile,()=>watermarks,{delay:20000});
 const league=id=>db.leagues.find(l=>l.id===id),key=id=>id+'@'+league(id).season;
 function valid(m,lid){const l=league(lid);return l&&l.teams.includes(m.home)&&l.teams.includes(m.away)&&m.home!==m.away&&!!normalize(m.date)&&m.id&&m.provider==='ESPN'&&(!m.season||m.season===l.season);}
 const store=jsonStore(file,()=>data),versions=new Map(),memo=new Map();
 function changed(lid){versions.set(lid,(versions.get(lid)||0)+1);memo.delete(lid);store.schedule()}
 function observe(lid,d){
  if(d.stale||d.cache?.state==='stale'||d.season&&d.season!==league(lid).season)return false;
  const rows=data.fixtures[key(lid)]||{};let dirty=false;
  for(const m of d.events||[])if(valid(m,lid)){
   const incoming=Object.fromEntries([...['id','home','away','homeName','awayName','date','status','hs','as','minute','provider'].map(k=>[k,m[k]]),['observedAt',m.observedAt||m.updatedAt||d.updatedAt||null]]),old=rows[String(m.id)];
   if(old&&preferMatch(old,incoming,{correction:d.correctionVerified===true})===old)continue;
   const fields=['home','away','homeName','awayName','date','status','hs','as','minute','provider'];
   if(!old||fields.some(k=>old[k]!==incoming[k]))dirty=true;
   if(old&&Number.isFinite(observed(incoming))&&(!Number.isFinite(observed(old))||observed(incoming)>observed(old))){watermarks[key(lid)]||={};watermarks[key(lid)][String(m.id)]=incoming.observedAt;watermarkStore.schedule();}
   rows[String(m.id)]=incoming;
  }
  data.fixtures[key(lid)]=rows;
  const days=[...new Set([...(data.days[key(lid)]||[]),...(d.coverage?.days||[])])];
  if(days.length!==(data.days[key(lid)]||[]).length)dirty=true;data.days[key(lid)]=days;
  if(dirty)changed(lid);return dirty;
 }
 function detail(lid,d){
  if(d.provider!=='ESPN'||!valid(d,lid)||d.stale||d.cache?.state==='stale')return false;
  const old=data.details[key(lid)]?.[d.id];
  if(old&&preferMatch(old,d)===old)return false;
  const fixture=data.fixtures[key(lid)]?.[d.id];if(fixture&&preferMatch(fixture,d)===fixture&&['status','hs','as'].some(k=>fixture[k]!==d[k]))return false;
  const semantic=x=>JSON.stringify(x,(k,v)=>['updatedAt','observedAt','cache'].includes(k)?undefined:v);
  if(old&&semantic(old)===semantic(d)){data.details[key(lid)][d.id]=d;return false;}
  data.details[key(lid)]||={};data.details[key(lid)][d.id]=d;
  observe(lid,{events:[d],updatedAt:d.updatedAt});changed(lid);return true;
 }
 function fixtures(lid,local){return combineFixtures(local?.events||[],Object.values(data.fixtures[key(lid)]||{}).filter(m=>valid(m,lid)),{singleRoundRobin:['eng','esp'].includes(lid)})}
 function detailsFor(lid){return Object.values(data.details[key(lid)]||{}).filter(d=>{const m=data.fixtures[key(lid)]?.[d.id];return valid(d,lid)&&final(d)&&(!m||m.status!=='FINAL'||m.hs===d.hs&&m.as===d.as)});}
 function playerRows(lid){const players=new Map(),details=detailsFor(lid);
  for(const d of details){for(const lu of d.lineups||[]){const team=Object.keys(db.teams).find(id=>db.teams[id].name===lu.team);if(!team)continue;
   for(const p of [...(lu.starting||[]),...(lu.substitutes||[])]){if(!p.starter&&!p.subbedIn&&!lu.starting?.some(x=>x.id===p.id))continue;
    const k=team+':'+p.id,s=p.statistics?.[0]||{},values={goals:s.goals?.total,assists:s.goals?.assists,minutes:s.games?.minutes,yellow:s.cards?.yellow,red:s.cards?.red,shots:s.shots?.total,saves:s.goals?.saves};
    let row=players.get(k)||{id:p.id,name:p.name,team,played:0,starts:0,values:{},known:{},matches:[]};row.played++;row.starts+=Number(p.starter===true);row.matches.push({id:d.id,league:lid,provider:'ESPN',date:d.date,home:d.home,away:d.away,homeName:d.homeName,awayName:d.awayName,hs:d.hs,as:d.as,...values});
    for(const [f,v] of Object.entries(values)){if(typeof v==='number'){row.values[f]=(row.values[f]||0)+v;row.known[f]=(row.known[f]||0)+1}}
    players.set(k,row);
   }
  }}
  return {details:details.length,players:[...players.values()].map(r=>({...r,...Object.fromEntries(['goals','assists','minutes','yellow','red','shots','saves'].map(f=>[f,r.known[f]?r.values[f]:null])),matches:r.matches.sort((a,b)=>compare(b,a))}))};
 }
 function analytics(lid,local){const version=[versions.get(lid)||0,local?.updatedAt||'',local?.events?.length||0].join(':');if(memo.get(lid)?.version===version)return memo.get(lid).value;const l=league(lid),events=fixtures(lid,local),games=events.filter(final),individual=playerRows(lid);
  const value={league:lid,season:l.season,events,analysedMatches:detailsFor(lid).map(d=>String(d.id)),source:local?.events?.length?'OpenFootball + ESPN':'ESPN · archivo consultado',teamCoverage:Object.fromEntries(l.teams.map(t=>[t,{results:games.filter(m=>m.home===t||m.away===t).length,details:detailsFor(lid).filter(m=>m.home===t||m.away===t).length}])),coverage:{fixtures:events.length,results:games.length,details:individual.details,first:games[0]?.date||null,last:games.at(-1)?.date||null},rows:l.teams.map(t=>teamAnalytics(events,t)),players:individual.players,scope:'Muestra de partidos disponibles de esta temporada; los rankings individuales cubren únicamente las actas guardadas.'};memo.set(lid,{version,value});return value;
 }
 return {observe,detail,fixtures,analytics,playerRows,match:(lid,id)=>data.details[key(lid)]?.[id]||null,fixture:(lid,id)=>data.fixtures[key(lid)]?.[id]||null,flush:()=>Promise.all([store.flush(),watermarkStore.flush()]),storageStats:store.stats,days:lid=>data.days[key(lid)]||[]};
}
