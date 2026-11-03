import {combineFixtures,preferMatch} from './history.mjs';
import {recentForm} from './competition.mjs';
import {miniAnalytics,analyticsView} from './presenters.mjs';
import '../dates.js';
const D=globalThis.CANCHA_DATES;
const day=m=>m.date.length===10?m.date:D.dayInPeru(new Date(m.date));

export function createFootballService({db,espn,soccerdata,history,cache,playerIndex}){
 const jobs=new Map(),league=id=>db.leagues.find(l=>l.id===id),stamp=d=>({...d,events:(d.events||[]).map(m=>({...m,observedAt:m.observedAt||d.updatedAt||null}))});
 function job(key,work){if(jobs.has(key))return jobs.get(key);const p=Promise.resolve().then(work).finally(()=>jobs.delete(key));jobs.set(key,p);return p;}
 async function fixtures(lid,date=null,team=null){
  const local=soccerdata.fixtures(lid);let loaded=[],error=null;
  if(team){loaded=await Promise.allSettled([espn.schedule(lid,team),espn.schedule(lid,team,{results:true}),espn.fixtures(lid,D.dayInPeru())]);}
  else loaded=await Promise.allSettled([espn.fixtures(lid,date)]);
  const valid=loaded.filter(r=>r.status==='fulfilled').map(r=>stamp(r.value));
  for(const d of valid)history.observe(lid,d);
  if(!valid.length)error=loaded.find(r=>r.status==='rejected')?.reason;
  let live=valid.reduce((a,d)=>({...d,events:combineFixtures(a?.events||[],d.events),stale:!!a?.stale||!!d.stale}),null);
  let events=combineFixtures(history.fixtures(lid,local),live?.events||[],{singleRoundRobin:['eng','esp'].includes(lid)}).filter(m=>(!date||day(m)===date)&&(!team||m.home===team||m.away===team));
  // El día de hoy necesita confirmación de ESPN para los horarios provisionales de OpenFootball.
  if(date&&date<=D.dayInPeru()&&valid.length)events=events.filter(m=>!(m.provider==='SoccerData'&&m.status==='PROGRAMADO'&&!m.origins?.some(o=>o.provider==='ESPN')));
  if(!valid.length&&!events.length&&error)throw error;
  const hasLocal=!!local?.events.length;
  return {...(live||{}),league:lid,season:league(lid).season,source:hasLocal?'OpenFootball + ESPN':live?'ESPN':'Archivo ESPN',events,totalPublished:events.length,updatedAt:live?.updatedAt||local?.updatedAt||null,
   sources:[...(hasLocal?[{name:local.source,updatedAt:local.updatedAt}]:[]),...valid.map(d=>({name:d.source||'ESPN',updatedAt:d.updatedAt}))],partial:true,stale:!!error||!!live?.stale,fallback:!!error,
   notice:team?'Agenda y resultados del club, contrastados por competición.':date?'Partidos de la fecha elegida en hora de Perú.':'Calendario abierto combinado con jornadas y agenda ESPN por club (fixture=true).',
   note:error?'No se pudo actualizar. Se conserva el archivo con su fecha.':loaded.some(r=>r.status==='rejected')?'Algunas consultas no respondieron; cobertura parcial.':undefined};
 }
 async function results(lid,team=''){
  const key=['results:v19',lid,league(lid).season,team||'all'].join(':');
  return job(key,async()=>{
   const d=await cache.retrieve(key,d=>d?.coverage?.failedClubs?90000:6*3600000,()=>team?espn.schedule(lid,team,{results:true}):espn.results(lid));history.observe(lid,stamp(d));return d;
  });
 }
 function analytics(lid,options={}){return analyticsView(history.analytics(lid,soccerdata.fixtures(lid)),options);}
 async function detail(lid,id){
  const known=history.match(lid,id),key=['detail:v19',lid,league(lid).season,id].join(':');
  const d=await cache.retrieve(key,known?.status==='FINAL'?300000:45000,()=>espn.summary(lid,id));
  const canonical=history.fixture(lid,id);if(canonical&&preferMatch(canonical,d)===canonical&&['status','hs','as'].some(k=>canonical[k]!==d[k])){if(known&&known.status===canonical.status&&known.hs===canonical.hs&&known.as===canonical.as)return {...known,stale:true};throw Error('El acta recibida es anterior al marcador verificado; reintento pendiente');}
  history.detail(lid,d);playerIndex.addMatch(d);return history.match(lid,id)||d;
 }
 function enrich(lid,team=''){
  return job('enrich:'+lid+':'+team,async()=>{
   await results(lid,team).catch(()=>{});const a=history.analytics(lid,soccerdata.fixtures(lid)),seen=new Set(a.analysedMatches.map(String));
   const eligible=a.events.filter(m=>m.provider==='ESPN'&&m.status==='FINAL'&&!seen.has(String(m.id))&&(!team||m.home===team||m.away===team)),candidates=eligible.slice().reverse().slice(0,4);
   const outcome=await Promise.allSettled(candidates.map(async m=>{const d=await detail(lid,m.id);if(d.stale||d.cache?.state==='stale')throw Error('Acta pendiente de actualizar');return m.id}));
   return {added:outcome.filter(r=>r.status==='fulfilled').length,failed:outcome.filter(r=>r.status==='rejected').length,remaining:Math.max(0,eligible.length-outcome.filter(r=>r.status==='fulfilled').length)};
  });
 }
 async function overview(lid,view='summary',team=''){
  let data;
  if(view==='results'||view==='rankings')data=await results(lid,team);
  else try{data=await fixtures(lid,D.dayInPeru());}catch{data={source:'Archivo ESPN',stale:true,events:[],updatedAt:null}}
  let a=history.analytics(lid,soccerdata.fixtures(lid));
  if(view==='rankings'&&!a.coverage.details){await enrich(lid,team);a=history.analytics(lid,soccerdata.fixtures(lid));}
  const forms=Object.fromEntries(league(lid).teams.map(t=>[t,recentForm(a.events,t)]));
  return {league:lid,season:league(lid).season,source:data.source,updatedAt:data.updatedAt,stale:!!data.stale||data.cache?.state==='stale',coverage:{clubs:Object.values(forms).filter(f=>f.length).length,expectedClubs:league(lid).teams.length},resultsReady:view!=='summary',forms,events:a.events.filter(m=>day(m)===D.dayInPeru()),analytics:miniAnalytics(a),scope:a.scope};
 }
 return {fixtures,results,overview,analytics,enrich,detail};
}
