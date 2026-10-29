import { clean,matchTeam,safeInt,seasonStart,daysISO } from './identity.mjs';
import fs from 'node:fs';
import {reconcileStandings} from './standings.mjs';
import {normalize,compare} from './dates.mjs';
import {mergeRosters,selectStandings} from './merge.mjs';

const CONFIG={
 per:{af:281, tsCountry:'Peru',match:['primera division','liga 1','peruvian primera']},
 ucl:{af:2,fd:'CL',tsCountry:'Europe',match:['uefa champions league','champions league']},
 esp:{af:140,fd:'PD',tsCountry:'Spain',match:['spanish la liga','primera division','la liga']},
 eng:{af:39,fd:'PL',tsCountry:'England',match:['english premier league','premier league']},
 arg:{af:128,tsCountry:'Argentina',match:['argentinian primera division','liga profesional','argentine primera']},
 ita:{af:135,fd:'SA',tsCountry:'Italy',match:['italian serie a','serie a']},
 fra:{af:61,fd:'FL1',tsCountry:'France',match:['french ligue 1','ligue 1']},
 bra:{af:71,fd:'BSA',tsCountry:'Brazil',match:['brazilian serie a','brasileirao','campeonato brasileiro']},
 mex:{af:262,tsCountry:'Mexico',match:['mexican primera division','liga mx']}
};
export const PROVIDER_CONFIG=CONFIG;
export const providerNames={footballData:'football-data.org',apiFootball:'API-Football',theSportsDB:'TheSportsDB'};

function apiError(d){return d && (Array.isArray(d.errors) ? d.errors.length>0 : Boolean(d.errors && Object.keys(d.errors).length));}
function statusText(s){let value=String(s||'').toUpperCase();if(['FT','AET','PEN','MATCH FINISHED','FINAL','FINISHED'].includes(value))return 'FINAL';if(['NS','TBD','SCHEDULED','TIMED'].includes(value))return 'PROGRAMADO';if(['PST','POSTPONED'].includes(value))return 'APLAZADO';if(['CANC','CANCELLED','CANCELED'].includes(value))return 'CANCELADO';if(['SUSP','SUSPENDED'].includes(value))return 'SUSPENDIDO';if(['1H','2H','HT','ET','LIVE','IN_PLAY','PAUSED'].includes(value))return 'EN VIVO';return 'SIN CONFIRMAR'}
function toStandings(groups,source,season,league,at){return reconcileStandings({kind:'standings',league,season,source,updatedAt:at,groups:groups.filter(g=>g.rows.length)});}
function rowFromAF(row,db,league){let t=row.team||{};return {teamId:matchTeam(t.name,db.teams,league.teams),providerTeamId:t.id??null,name:t.name||'Equipo',logo:t.logo||'',position:safeInt(row.rank),pj:safeInt(row.all?.played),g:safeInt(row.all?.win),e:safeInt(row.all?.draw),p:safeInt(row.all?.lose),gf:safeInt(row.all?.goals?.for),gc:safeInt(row.all?.goals?.against),dg:safeInt(row.goalsDiff),pts:safeInt(row.points),form:row.form||''};}
function rowFromFD(row,db,league){let t=row.team||{};return {teamId:matchTeam(t.name,db.teams,league.teams),providerTeamId:t.id??null,name:t.name||'Equipo',logo:t.crest||'',position:safeInt(row.position),pj:safeInt(row.playedGames),g:safeInt(row.won),e:safeInt(row.draw),p:safeInt(row.lost),gf:safeInt(row.goalsFor),gc:safeInt(row.goalsAgainst),dg:safeInt(row.goalDifference),pts:safeInt(row.points),form:row.form||''};}
function rowFromTSD(row,db,league){return {teamId:matchTeam(row.strTeam,db.teams,league.teams),providerTeamId:row.idTeam||null,name:row.strTeam||'Equipo',logo:row.strBadge||'',position:safeInt(row.intRank),pj:safeInt(row.intPlayed),g:safeInt(row.intWin),e:safeInt(row.intDraw),p:safeInt(row.intLoss),gf:safeInt(row.intGoalsFor),gc:safeInt(row.intGoalsAgainst),dg:safeInt(row.intGoalDifference),pts:safeInt(row.intPoints),form:''};}
const tsSeason=l=> l.season.includes('/') ? l.season.replace(/^(\d{4})\/(\d{2})$/,(_,a,b)=>a+'-'+a.slice(0,2)+b) : l.season;
function validStandings(groups,league){
 // Never label free-tier's top 5 as a complete table. Cup groups may be genuinely small;
 // cross-check all unique named teams and prefer documented rank coverage.
 let names=new Set(groups.flatMap(x=>x.rows.map(r=>clean(r.name))));
 let covered=new Set(groups.flatMap(x=>x.rows.map(r=>r.teamId).filter(Boolean)));
 const expected=league.teams.length;
 const complete=covered.size===expected;
 return {complete,found:covered.size,expected,unmatched:groups.flatMap(g=>g.rows).filter(r=>!r.teamId).map(r=>r.name)};
}
function checkSeason(actual,league){
 if(actual!=null && String(actual).slice(0,4)!==String(seasonStart(league)))throw Error('La fuente devolvió otra temporada');
}
function checkMatch(m,league,actualLeague,actualSeason,expectedLeague){
 checkSeason(actualSeason,league);
 if(actualLeague!=null&&String(actualLeague)!==String(expectedLeague))throw Error('El partido pertenece a otra competición');
 if(!m.home||!m.away||m.home===m.away||!normalize(m.date))throw Error('Equipos o fecha del partido no verificables');
}
function tsMatch(m,db,l){
 const hs=safeInt(m.intHomeScore),as=safeInt(m.intAwayScore);
 const date=normalize(m.strTimestamp)||normalize(m.dateEvent&&m.strTime?m.dateEvent+'T'+m.strTime.replace(/Z$/,'')+'Z':m.dateEvent);
 let status=statusText(m.strStatus);if(status==='SIN CONFIRMAR'&&hs!=null&&as!=null)status='FINAL';
 return {id:String(m.idEvent),home:matchTeam(m.strHomeTeam,db.teams,l.teams),away:matchTeam(m.strAwayTeam,db.teams,l.teams),homeName:m.strHomeTeam,awayName:m.strAwayTeam,date,status,hs,as,provider:'TheSportsDB'};
}
export function makeProviders({fetchFn=fetch,env=process.env, db}){
 const leagues=Object.fromEntries(db.leagues.map(l=>[l.id,l]));
 const keys={fd:env.FOOTBALL_DATA_KEY||'',af:env.API_FOOTBALL_KEY||'',ts:env.THESPORTSDB_KEY||'123'};
 const status={footballData:Boolean(keys.fd),apiFootball:Boolean(keys.af),theSportsDB:true};
 let day=new Date().toISOString().slice(0,10),used=0;
 const usageFile=env.CANCHA_USAGE_PATH||'';
 if(usageFile){try{let saved=JSON.parse(fs.readFileSync(usageFile,'utf8'));if(saved.date===day)used=saved.used||0}catch{}}
 const maxAF=Math.max(0,Number(env.API_FOOTBALL_DAILY_BUDGET||75));
 async function json(url,headers={}){
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),10500);
  try{
   const res=await fetchFn(url,{headers:{'Accept':'application/json',...headers},signal:ctrl.signal});
   if(!res.ok) throw Error(`Proveedor HTTP ${res.status}`);
   return await res.json();
  } finally{clearTimeout(timer)}
 }
 async function af(path,params={}){
  if(!keys.af)throw Error('API-Football sin configurar');
  let today=new Date().toISOString().slice(0,10);if(today!==day){day=today;used=0}
  if(used>=maxAF)throw Error('Reserva diaria de API-Football agotada'); used++;
  if(usageFile){try{fs.writeFileSync(usageFile,JSON.stringify({date:day,used}));}catch{}}
  const url=new URL('https://v3.football.api-sports.io/'+path);Object.entries(params).forEach(([k,v])=>v!==undefined&&url.searchParams.set(k,String(v)));
  const d=await json(url,{'x-apisports-key':keys.af});if(apiError(d))throw Error('El proveedor devolvió errores');return d.response||[];
 }
 async function fd(path,params={}){if(!keys.fd)throw Error('football-data.org sin configurar');let url=new URL('https://api.football-data.org/v4/'+path);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));return json(url,{'X-Auth-Token':keys.fd});}
 async function ts(path,params={}){let url=new URL(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(keys.ts)}/${path}`);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));return json(url);}
 const tsIds=new Map();
 async function findTSLeague(l){if(tsIds.has(l.id))return tsIds.get(l.id); let cfg=CONFIG[l.id];if(!cfg)return null;
  let d=await ts('search_all_leagues.php',{c:cfg.tsCountry,s:'Soccer'});
  let list=d.countrys||d.leagues||[];
  let candidates=list.filter(x=>cfg.match.some(m=>clean(x.strLeague).includes(clean(m)) || clean(m).includes(clean(x.strLeague))));
  let match=candidates.length===1?candidates[0]:null; if(!match && l.id==='eng') match={idLeague:'4328'};
  const id=match?.idLeague||null;tsIds.set(l.id,id);return id;
 }
 async function getStandings(lid){const l=leagues[lid],cfg=CONFIG[lid];if(!l||!cfg)throw Error('Liga desconocida');const tried=[];
  const fromAF=async()=>{
   let rr=await af('standings',{league:cfg.af,season:seasonStart(l)});
   checkSeason(rr[0]?.league?.season,l);
   let gs=(rr[0]?.league?.standings||[]).map((rows,i)=>({label:rows[0]?.group || (i===0?'General':'Grupo '+(i+1)),rows:rows.map(r=>rowFromAF(r,db,l))}));
   if(!gs.length)throw Error('Sin clasificación publicada');
   return toStandings(gs,'API-Football',l.season,lid,new Date().toISOString())};
  const fromFD=async()=>{
   let d=await fd(`competitions/${cfg.fd}/standings`,{season:seasonStart(l)});
   checkSeason(d.season?.startDate,l);
   let groups=(d.standings||[]).filter(x=>x.table?.length).map(x=>({label:x.group||({TOTAL:'General',HOME:'Local',AWAY:'Visitante'}[x.type]||x.type),type:x.type,rows:x.table.map(r=>rowFromFD(r,db,l))}));
   const total=groups.filter(x=>x.type==='TOTAL' || (groups.every(g=>!g.type)));
   if(!total.length)throw Error('Sin clasificación general');
   return toStandings(total,'football-data.org',l.season,lid,new Date().toISOString())};
  const fromTS=async()=>{
   const id=await findTSLeague(l);if(!id)throw Error('Competición no identificada en TheSportsDB');
   let d=await ts('lookuptable.php',{l:id,s:tsSeason(l)}),list=d.table||[];
   if(!list.length)throw Error('No hay tabla disponible');
   for(const row of list)checkSeason(row.strSeason,l);
   return toStandings([{label:'General',rows:list.map(r=>rowFromTSD(r,db,l))}],'TheSportsDB',l.season,lid,new Date().toISOString())};
  // Local provider selection: European leagues favor comprehensive football-data; others API-Football.
  const priorities=cfg.fd?[[keys.fd,fromFD],[keys.af,fromAF],[true,fromTS]]:[[keys.af,fromAF],[true,fromTS]];
  const partials=[];
  for(let [enabled,fn] of priorities){if(!enabled)continue;
   try{const result=await fn();let quality=validStandings(result.groups,l);result.quality=quality;
    // Better preserve complete snapshots than overwrite with free limited top-N.
    if(quality.complete)return result;
    partials.push(result);
   }catch(e){tried.push(e.message)}
  }
  if(partials.length)return selectStandings(partials,l);
  throw Error(tried.length?tried.join(' · '):'No hay proveedor disponible');
 }
 function fdMatch(m,db,league){return {id:String(m.id),home:matchTeam(m.homeTeam?.name,db.teams,league.teams),away:matchTeam(m.awayTeam?.name,db.teams,league.teams),homeName:m.homeTeam?.name,awayName:m.awayTeam?.name,date:m.utcDate||'',status:statusText(m.status),hs:safeInt(m.score?.fullTime?.home),as:safeInt(m.score?.fullTime?.away),provider:'football-data.org'};}
 function afMatch(m,db,league){return {id:String(m.fixture?.id||''),home:matchTeam(m.teams?.home?.name,db.teams,league.teams),away:matchTeam(m.teams?.away?.name,db.teams,league.teams),homeName:m.teams?.home?.name,awayName:m.teams?.away?.name,date:m.fixture?.date||'',status:statusText(m.fixture?.status?.short),hs:safeInt(m.goals?.home),as:safeInt(m.goals?.away),provider:'API-Football'};}
 async function getFixtures(lid){
  const l=leagues[lid],cfg=CONFIG[lid];if(!l)throw Error('Liga desconocida');
  const tried=[],from=daysISO(-14),to=daysISO(45),now=Date.now();
  const focus=events=>events.filter(m=>{const t=Date.parse(m.date);return m.home&&m.away&&m.home!==m.away&&normalize(m.date)&&Number.isFinite(t)&&t>=now-14*864e5&&t<=now+45*864e5}).sort(compare);
  if(keys.fd&&cfg.fd)try{
   // football-data devuelve el fixture de temporada. Filtramos a la ventana de interés.
   const d=await fd(`competitions/${cfg.fd}/matches`,{season:seasonStart(l)});
   const all=(d.matches||[]).map(x=>fdMatch(x,db,l));
   if(all.length)return {league:lid,source:'football-data.org',updatedAt:new Date().toISOString(),range:{from,to},totalPublished:all.length,events:focus(all)};
  }catch(e){tried.push(e.message)}
  if(keys.af)try{
   const d=await af('fixtures',{league:cfg.af,season:seasonStart(l),from,to});
   if(d.length)return {league:lid,source:'API-Football',updatedAt:new Date().toISOString(),range:{from,to},totalPublished:d.length,events:focus(d.map(x=>afMatch(x,db,l)))};
  }catch(e){tried.push(e.message)}
  // Último recurso público: sólo un encuentro anterior y siguiente por liga.
  try{const id=await findTSLeague(l);if(id){
   const [prev,next]=await Promise.allSettled([ts('eventspastleague.php',{id}),ts('eventsnextleague.php',{id})]);
   const rows=[...(prev.status==='fulfilled'?(prev.value.events||[]):[]),...(next.status==='fulfilled'?(next.value.events||[]):[])];
   const events=focus([...new Map(rows.filter(x=>x.idEvent&&(!x.strSeason||String(x.strSeason).slice(0,4)===String(seasonStart(l)))).map(x=>[String(x.idEvent),tsMatch(x,db,l)])).values()]);
   if(events.length)return {league:lid,source:'TheSportsDB',updatedAt:new Date().toISOString(),partial:true,notice:'Acceso gratuito: sólo algunos encuentros; no representa el calendario completo',totalPublished:null,events};
  }}catch(e){tried.push(e.message)}
  throw Error(tried.length?tried.join(' · '):'No hay calendario accesible con las cuentas actuales');
 }
 async function findAFTeam(team,l){
  const cfg=CONFIG[l.id];if(!cfg)return null;
  const list=await af('teams',{league:cfg.af,season:seasonStart(l)});
  const matches=list.filter(x=>matchTeam(x.team?.name,db.teams,l.teams)===team.id);
  return matches.length===1?matches[0]:null;
 }
 async function fdTeam(team,l){const cfg=CONFIG[l.id];if(!cfg?.fd) return null;
  const d=await fd(`competitions/${cfg.fd}/teams`,{season:seasonStart(l)});
  const filtered=(d.teams||[]).filter(x=>matchTeam(x.name,db.teams,l.teams)===team.id);
  return filtered.length===1?filtered[0]:null;
 }
 function normPos(x){let s=clean(x);if(s.includes('goal')||s.includes('keeper'))return 'Portero';if(s.includes('def')||s.includes('back'))return 'Defensa';if(s.includes('mid'))return 'Mediocampista';if(s.includes('attack')||s.includes('forward')||s.includes('wing')||s.includes('striker'))return 'Delantero';return x||'Sin especificar'}
 async function getRoster(teamId){
  const team=db.teams[teamId];if(!team)throw Error('Club desconocido');
  const eligible=team.leagues.map(x=>leagues[x]).filter(Boolean).sort((a,b)=>a.id==='ucl'?1:-1);
  const candidates=[],tried=[];
  if(keys.fd)for(const l of eligible){if(!CONFIG[l.id]?.fd)continue;
   try{const t=await fdTeam(team,l);if(!t)continue;
    const d=await fd(`teams/${t.id}`);const players=d.squad||[];if(!players.length)continue;
    candidates.push({team:teamId,season:l.season,source:'football-data.org',updatedAt:new Date().toISOString(),coach:d.coach?.name||t.coach?.name||null,
     players:players.map(x=>({id:String(x.id),name:x.name,number:x.shirtNumber??null,position:normPos(x.position),age:x.dateOfBirth?Math.floor((Date.now()-Date.parse(x.dateOfBirth))/31557600000):null,country:x.nationality||null,birth:x.dateOfBirth||null,height:null,photo:null,provider:'football-data.org'}))});
    break;
   }catch(e){tried.push(e.message)}
  }
  if(keys.af)for(const l of eligible){
   try{const t=await findAFTeam(team,l);if(!t)continue;
    const rr=await af('players/squads',{team:t.team.id}); const players=rr[0]?.players||[];if(!players.length)continue;
    candidates.push({team:teamId,season:l.season,source:'API-Football',updatedAt:new Date().toISOString(),coach:null,
     players:players.map(x=>({id:String(x.id),name:x.name,number:x.number??null,position:normPos(x.position),age:x.age||null,country:null,birth:null,height:null,photo:x.photo||null,provider:'API-Football'}))});
    break;
   }catch(e){tried.push(e.message)}
  }
  // Una versión pública de TheSportsDB suele devolver solo un subconjunto: NO representa plantilla completa.
  if(!candidates.length)for(const l of eligible){
   try{const tsId=await findTSLeague(l);if(!tsId)continue;
    const d=await ts('search_all_teams.php',{l:tsId});const matches=(d.teams||[]).filter(x=>matchTeam(x.strTeam,db.teams,l.teams)===teamId);if(matches.length!==1)continue;
    const rr=await ts('lookup_all_players.php',{id:matches[0].idTeam});const players=rr.player||[];if(!players.length)continue;
    candidates.push({team:teamId,season:null,source:'TheSportsDB',updatedAt:new Date().toISOString(),coach:matches[0].strManager||null,
     players:players.map(x=>({id:String(x.idPlayer),name:x.strPlayer,number:x.strNumber||null,position:normPos(x.strPosition),age:null,country:x.strNationality||null,birth:x.dateBorn||null,height:x.strHeight||null,photo:x.strCutout||x.strThumb||null,provider:'TheSportsDB'}))});break;
   }catch(e){tried.push(e.message)}
  }
  if(candidates.length)return mergeRosters(candidates,{team:teamId,season:candidates[0].season});
  throw Error(tried.length?tried.join(' · '):'No hay plantilla accesible con las fuentes configuradas');
 }
 async function getPlayerStats(teamId,playerId,provider){const t=db.teams[teamId];if(!t || !/^\d{1,12}$/.test(String(playerId)))throw Error('Jugador no identificado');
  if(provider==='TheSportsDB'){let d=await ts('lookupplayerstats.php',{id:playerId});return {source:'TheSportsDB',updatedAt:new Date().toISOString(),rows:Array.isArray(d.playerstats)?d.playerstats:[],note:'Estadísticas publicadas por TheSportsDB; pueden estar incompletas.'}}
  if(provider==='API-Football' && keys.af){for(let lid of t.leagues){const l=leagues[lid];try{let result=await af('players',{id:playerId,season:seasonStart(l),league:CONFIG[l.id].af});if(result.length)return {source:'API-Football',updatedAt:new Date().toISOString(),rows:result.flatMap(x=>(x.statistics||[]).filter(s=>matchTeam(s.team?.name,db.teams,[teamId])===teamId&&String(s.league?.season)===String(seasonStart(l))&&String(s.league?.id)===String(CONFIG[l.id].af)).map(s=>({league:s.league?.name,team:s.team?.name,appearances:s.games?.appearences,goals:s.goals?.total,assists:s.goals?.assists,minutes:s.games?.minutes,shots:s.shots?.total,passes:s.passes?.total,rating:s.games?.rating}))),note:'Estadísticas de temporada, no del partido'};}catch{}}
  }
  return {source:provider||'Sin fuente',updatedAt:null,rows:[],note:'No hay estadísticas individuales accesibles para este jugador con los proveedores configurados.'};
 }
 async function getMatchDetail(lid,source,id){
  const l=leagues[lid];if(!l||!/^\d{1,12}$/.test(String(id)))throw Error('Encuentro no identificado');
  if(source==='API-Football'){
   const [results,eventsResult,statsResult,linesResult,playersResult]=await Promise.allSettled([
    af('fixtures',{id}),af('fixtures/events',{fixture:id}),af('fixtures/statistics',{fixture:id}),
    af('fixtures/lineups',{fixture:id}),af('fixtures/players',{fixture:id})
   ]);
   if(results.status!=='fulfilled'||!results.value[0])throw Error('Partido no disponible en el proveedor');
   const raw=results.value[0], f=afMatch(raw,db,l);
   checkMatch(f,l,raw.league?.id,raw.league?.season,CONFIG[lid].af);
   const events=eventsResult.status==='fulfilled'?eventsResult.value:[];
   const statsSrc=statsResult.status==='fulfilled'?statsResult.value:[];
   const lineups=linesResult.status==='fulfilled'?linesResult.value:[];
   const playerInfo=playersResult.status==='fulfilled'?playersResult.value:[];
   let ev=events.map(e=>({minute:e.time?.elapsed,type:e.type,player:e.player?.name,detail:e.detail||'',team:e.team?.name||''}));
   let stats=[];
   if(statsSrc.length){const homeStats=statsSrc.find(x=>raw.teams?.home?.id!=null?String(x.team?.id)===String(raw.teams.home.id):matchTeam(x.team?.name,db.teams,[f.home])===f.home);const awayStats=statsSrc.find(x=>raw.teams?.away?.id!=null?String(x.team?.id)===String(raw.teams.away.id):matchTeam(x.team?.name,db.teams,[f.away])===f.away);const a=new Map((homeStats?.statistics||[]).map(x=>[x.type,x.value]));const b=new Map((awayStats?.statistics||[]).map(x=>[x.type,x.value]));stats=[...new Set([...a.keys(),...b.keys()])].map(k=>({name:k,home:a.get(k),away:b.get(k)}));}
   return {...f,events:ev,stats,source,lineups:lineups.map(x=>({team:x.team?.name,formation:x.formation,coach:x.coach?.name,starting:(x.startXI||[]).map(a=>a.player),substitutes:(x.substitutes||[]).map(a=>a.player)})),playerStats:playerInfo.map(x=>({team:x.team?.name,players:(x.players||[]).map(y=>({id:y.player?.id,name:y.player?.name,statistics:y.statistics||[]}))})),note:'Información por encuentro. Los apartados dependen de la cobertura y del plan contratado.'};
  }
  if(source==='TheSportsDB'){
   const r=await ts('lookupevent.php',{id});const m=r.events?.[0];if(!m)throw Error('Partido no encontrado');
   const f=tsMatch(m,db,l);const leagueId=await findTSLeague(l);checkMatch(f,l,m.idLeague,m.strSeason,leagueId);
   return {...f,events:[],stats:[],lineups:[],source,note:'TheSportsDB público ofrece sólo información básica de este encuentro.'};
  }
  if(source==='football-data.org'){
   const item=await fd(`matches/${id}`);if(!item?.id)throw Error('Partido no encontrado');
   const f=fdMatch(item,db,l);checkMatch(f,l,item.competition?.code,item.season?.startDate,CONFIG[lid].fd);const ev=(item.goals||[]).map(g=>({minute:g.minute,type:'Gol',player:g.scorer?.name,detail:g.type||''}));
   return {...f,events:ev,stats:[],source,note:'Este proveedor puede no publicar estadísticas avanzadas en el plan gratuito.'};
  }
  throw Error('Fuente de encuentros no habilitada');
 }

 async function getClubProfile(teamId){
  const t=db.teams[teamId]; if(!t)throw Error('Club no registrado');
  const tried=[];
  const countries={'Perú':['peru'],'Inglaterra':['england','united kingdom'],'Francia':['france'],'España':['spain'],'Italia':['italy'],'Argentina':['argentina'],'Brasil':['brazil'],'México':['mexico']};
  const nameCheck=val=>matchTeam(val,db.teams,t.leagues.flatMap(id=>leagues[id]?.teams||[]))===teamId;
  // Public data, but matches must be unique and compatible with country. No blind name-based assignment.
  try{
   const data=await ts('searchteams.php',{t:t.name});
   let arr=(data.teams||[]).filter(x=>nameCheck(x.strTeam)||nameCheck(x.strAlternate));
   arr=arr.filter(x=>{let cc=clean(x.strCountry||'');return !cc||(countries[t.country]||[clean(t.country)]).some(c=>cc===clean(c))});
   if(arr.length===1){let r=arr[0];return {team:teamId,name:t.name,city:r.strLocation||null,stadium:r.strStadium||null,coach:null,founded:r.intFormedYear||null,website:r.strWebsite||null,source:'TheSportsDB · ficha pública',sourceUrl:`https://www.thesportsdb.com/team/${encodeURIComponent(r.idTeam||'')}`,updatedAt:new Date().toISOString(),note:'Datos complementarios del proveedor. Cambios de estadio o entrenador deben verificarse por temporada.'};}
   tried.push('Sin coincidencia única para país y club');
  }catch(e){tried.push(e.message)}
  // football-data.org: optionally use the season team dataset for richer stadium/city metadata.
  if(keys.fd){for(const lid of t.leagues){let l=leagues[lid];if(!l||!CONFIG[lid]?.fd)continue;try{
   const item=await fdTeam(t,l);if(!item)continue;
   const rr=await fd(`teams/${item.id}`);
   return {team:teamId,name:t.name,city:rr.area?.name||null,stadium:rr.venue||item.venue||null,coach:rr.coach?.name||null,founded:rr.founded||null,website:rr.website||null,source:'football-data.org',updatedAt:new Date().toISOString(),note:'Datos de un proveedor con clave configurada; sujetos a cambios.'};
  }catch(e){tried.push(e.message)}}}
  throw Error('Sin ficha externa compatible: '+tried.slice(0,2).join(' · '));
 }

 return {status,getStandings,getFixtures,getRoster,getPlayerStats,getMatchDetail,getClubProfile,config:CONFIG};
}
