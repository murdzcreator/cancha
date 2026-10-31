// ESPN público: lectura HTTPS, identificadores comprobados y consultas compartidas.
// No depende de Python/SoccerData ni anuncia cobertura individual de temporada.
import fs from 'node:fs';
import {normalize,compare} from './dates.mjs';
import {safeInt,seasonStart} from './identity.mjs';
const identities=JSON.parse(fs.readFileSync(new URL('./espn-teams.json',import.meta.url),'utf8'));
const BASE='https://site.api.espn.com/apis/site/v2/sports/soccer/';
export const peruDay=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const addDay=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
const text=x=>String(x??'').slice(0,200);
const numeric=x=>{if(x==null||x===''||typeof x==='boolean')return null;const n=Number(String(x).replace(/%$/,''));return Number.isFinite(n)&&n>=0?n:null};
const statsMap=rows=>Object.fromEntries((rows||[]).map(s=>[s.name,numeric(s.value??s.displayValue)]));
export function espnStatus(status){
 const t=status?.type||{},name=t.name||'';
 if(/POSTPONED/.test(name))return 'APLAZADO';
 if(/CANCEL/.test(name))return 'CANCELADO';
 if(/SUSPEND|ABANDON|DELAY/.test(name))return 'SUSPENDIDO';
 if(t.completed===true&&t.state==='post')return 'FINAL';
 if(t.state==='in')return 'EN VIVO';
 if(t.state==='pre')return 'PROGRAMADO';
 return 'SIN CONFIRMAR';
}
function teamId(t,league){const id=identities.leagues[league.id]?.[String(t?.id)];return league.teams.includes(id)?id:null;}
export function normalizeEspnEvent(event,league,db){
 const c=event.competitions?.[0];
 if(!c||Number(event.season?.year)!==seasonStart(league))return null;
 const home=c.competitors?.find(x=>x.homeAway==='home'),away=c.competitors?.find(x=>x.homeAway==='away');
 const h=teamId(home?.team,league),a=teamId(away?.team,league),date=normalize(c.date||event.date),id=String(event.id||'');
 if(!h||!a||h===a||!date||!/^\d{1,12}$/.test(id))return null;
 const status=espnStatus(c.status||event.status),hasScore=['FINAL','EN VIVO','SUSPENDIDO'].includes(status);
 const score=x=>{const n=safeInt(x?.value??x);return n!==null&&n>=0&&n<=99?n:null};
 const hs=hasScore?score(home.score):null,as=hasScore?score(away.score):null;
 return {id,home:h,away:a,homeName:db.teams[h].name,awayName:db.teams[a].name,
  date:c.timeValid===false||event.timeValid===false?date.slice(0,10):date,
  status:status==='FINAL'&&(hs===null||as===null)?'SIN CONFIRMAR':status,hs,as,
  minute:status==='EN VIVO'?text((c.status||event.status)?.displayClock):null,provider:'ESPN'};
}
function playerStats(p){
 const s=statsMap(p.stats),has=(key)=>s[key]!==undefined&&s[key]!==null;
 const get=key=>has(key)?s[key]:null;
 return {games:{minutes:get('minutesPlayed'),rating:null},goals:{total:get('totalGoals'),assists:get('goalAssists'),saves:get('saves'),conceded:get('goalsConceded')},
  shots:{total:get('totalShots'),on:get('shotsOnTarget')},passes:{total:get('totalPasses'),accuracy:null},
  cards:{yellow:get('yellowCards'),red:get('redCards')},fouls:{committed:get('foulsCommitted'),drawn:get('foulsSuffered')}};
}
const statLabels={possessionPct:'Posesión (%)',totalShots:'Remates',shotsOnTarget:'Remates a puerta',foulsCommitted:'Faltas cometidas',offsides:'Fuera de juego',wonCorners:'Córners',yellowCards:'Tarjetas amarillas',redCards:'Tarjetas rojas',saves:'Atajadas',totalPasses:'Pases totales',accuratePasses:'Pases completados',totalCrosses:'Centros',accurateCrosses:'Centros completados',totalLongBalls:'Pases largos',accurateLongBalls:'Pases largos completados',totalTackles:'Entradas',interceptions:'Intercepciones',effectiveTackles:'Entradas efectivas',blockedShots:'Remates bloqueados'};
export function normalizeEspnSummary(data,league,db,id){
 const h=data.header;
 if(!h||String(h.id)!==String(id)||h.league?.slug!==league.espn)throw Error('La ficha ESPN pertenece a otro partido o competición');
 const match=normalizeEspnEvent({...h,id:h.id,season:h.season},league,db);
 if(!match)throw Error('La ficha ESPN no coincide con la temporada o los clubes del catálogo');
 const c=h.competitions[0],home=c.competitors.find(x=>x.homeAway==='home'),away=c.competitors.find(x=>x.homeAway==='away');
 const byId=Object.fromEntries((data.boxscore?.teams||[]).map(t=>[String(t.team?.id),statsMap(t.statistics)]));
 const hs=byId[String(home.team.id)]||{},as=byId[String(away.team.id)]||{};
 const stats=Object.entries(statLabels).filter(([key])=>hs[key]!=null||as[key]!=null).map(([key,name])=>({name,home:hs[key]??null,away:as[key]??null}));
 const lineups=[];
 for(const row of data.rosters||[]){
  const club=teamId(row.team,league);if(![match.home,match.away].includes(club))continue;
  const players=(row.roster||[]).filter(p=>p.athlete?.id&&p.athlete?.displayName).map(p=>({id:String(p.athlete.id),name:text(p.athlete.displayName),number:safeInt(p.jersey),position:text(p.position?.displayName),grid:null,starter:p.starter===true,subbedIn:p.subbedIn===true,subbedOut:p.subbedOut===true,statistics:p.stats?.length?[playerStats(p)]:[]}));
  lineups.push({team:db.teams[club].name,formation:text(row.formation),starting:players.filter(p=>p.starter),substitutes:players.filter(p=>!p.starter)});
 }
 const events=(data.keyEvents||[]).filter(e=>['goal','own-goal','penalty---scored','yellow-card','red-card','yellow-red-card','substitution'].includes(e.type?.type)||e.scoringPlay).map(e=>({
  id:text(e.id),minute:text(e.clock?.displayValue).replace(/'/g,''),type:/goal|penalty/.test(e.type?.type)?'Goal':e.type?.type==='substitution'?'subst':'Card',
  detail:({'goal':'Gol','own-goal':'Autogol','penalty---scored':'Gol de penal','yellow-card':'Amarilla','red-card':'Roja','yellow-red-card':'Segunda amarilla','substitution':'Cambio'})[e.type?.type]||text(e.type?.text),
  team:db.teams[teamId(e.team,league)]?.name||'',player:(e.participants||[]).map(x=>text(x.athlete?.displayName)).filter(Boolean).join(' / ')}));
 return {...match,league:league.id,season:league.season,source:'ESPN',updatedAt:new Date().toISOString(),lineups,events,stats,
  stadium:text(data.gameInfo?.venue?.fullName),lineupWarning:'Posiciones en cancha esquemáticas. Solo se muestran métricas publicadas; no se calculan minutos ni valoraciones ausentes.',
  note:'Consulta periódica a ESPN; cobertura y demora dependen de la fuente. Las estadísticas de esta ficha corresponden a este partido.'};
}
export function normalizeEspnStandings(data,league,db){
 if(Number(data.season?.year)!==seasonStart(league))throw Error('Clasificación de otra temporada');
 const groups=[],seen=new Set();let rejected=0;
 function visit(node){
  if(node.standings?.entries?.length){const rows=[];
   for(const e of node.standings.entries){const id=teamId(e.team,league),s=Object.fromEntries((e.stats||[]).map(x=>[x.name,x.value]));
    const values=['gamesPlayed','wins','ties','losses','pointsFor','pointsAgainst','points'].map(k=>safeInt(s[k]));
    if(!id||values.some(v=>v==null)||values.slice(0,6).some(v=>v<0)||values[1]+values[2]+values[3]!==values[0]||rows.some(r=>r.teamId===id)){rejected++;continue}
    seen.add(id);const [pj,g,draws,p,gf,gc,pts]=values;
    rows.push({teamId:id,name:db.teams[id].name,position:safeInt(s.rank),pj,g,e:draws,p,gf,gc,dg:gf-gc,pts,form:'',deductions:safeInt(s.deductions)});
   }
   if(rows.length)groups.push({label:text(node.name||node.standings.name||'General').replace('League Phase','Fase de liga').replace('Group ','Grupo '),rows,details:'Orden y puntos publicados por ESPN para esta fase; incluye los ajustes del proveedor.'});
  }
  for(const child of node.children||[])visit(child);
 }
 visit(data);if(!groups.length)throw Error('Clasificación sin filas verificables');
 return {league:league.id,season:league.season,source:'ESPN',updatedAt:data._retrievedAt||null,groups,quality:{complete:seen.size===league.teams.length&&rejected===0,found:seen.size,expected:league.teams.length,rejected},note:'Clasificación de la fase publicada; no se mezclan fases ni se recalculan puntos oficiales.'};
}
export function normalizeEspnRoster(data,team,league){
 const expected=Object.entries(identities.leagues[league.id]||{}).find(([,id])=>id===team.id)?.[0];
 if(String(data.team?.id)!==expected||Number(data.season?.year)!==seasonStart(league))throw Error('Plantilla de otro equipo o temporada');
 const positions={G:'Portero',GK:'Portero',D:'Defensa',M:'Mediocampista',F:'Delantero'},seen=new Set();
 const players=(data.athletes||[]).flatMap(g=>g.items||[g]).filter(p=>/^\d+$/.test(String(p.id))&&p.displayName&&!seen.has(String(p.id))&&seen.add(String(p.id))).map(p=>({
  id:String(p.id),name:text(p.displayName),number:safeInt(p.jersey),position:positions[p.position?.abbreviation]||text(p.position?.displayName)||'Sin posición',country:text(p.citizenship||p.birthPlace?.country)||null,
  birth:normalize(p.dateOfBirth)?.slice(0,10)||null,age:safeInt(p.age),photo:/^https:\/\//.test(p.headshot?.href||'')?p.headshot.href:null,provider:'ESPN'}));
 if(!players.length)throw Error('Plantilla sin futbolistas publicados');
 return {team:team.id,season:league.season,source:'ESPN',updatedAt:data._retrievedAt||null,players,complete:false,note:'Plantilla publicada por ESPN para la temporada consultada; sujeta a actualización.'};
}
export function createEspnProvider({db,fetchFn=fetch,now=()=>new Date(),enabled=true}){
 const leagues=Object.fromEntries(db.leagues.map(l=>[l.id,l])),saved=new Map(),running=new Map(),failed=new Map();
 let active=0;const queue=[];
 async function limited(work){if(active>=4)await new Promise(resolve=>queue.push(resolve));active++;try{return await work()}finally{active--;queue.shift()?.()}}
 let lastSuccess=null;
 async function json(key,url,ttl,validate=()=>true){
  const old=saved.get(key),at=+now();if(old&&at-old.at<ttl)return old.data;
  if(running.has(key))return running.get(key);
  if(failed.get(key)>at){if(old)return {...old.data,_stale:true};throw Error('ESPN temporalmente no disponible; reintento pendiente');}
  const work=limited(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   try{const r=await fetchFn(url,{headers:{Accept:'application/json'},signal:controller.signal});if(!r.ok)throw Error('ESPN HTTP '+r.status);
    const data=await r.json();if(!data||typeof data!=='object'||!validate(data))throw Error('Respuesta ESPN inválida');data._retrievedAt=now().toISOString();saved.set(key,{at:+now(),data});lastSuccess=now().toISOString();failed.delete(key);return data;
   }catch(e){failed.set(key,+now()+90000);if(old)return {...old.data,_stale:true};throw e;}finally{clearTimeout(timer)}
  }).finally(()=>running.delete(key));running.set(key,work);return work;
 }
 function leagueFor(lid){if(!enabled)throw Error('ESPN desactivado');const l=leagues[lid];if(!l?.espn)throw Error('Competición ESPN no configurada');return l;}
 async function daily(l,day){const today=peruDay(now()),previous=saved.get(l.id+':'+day)?.data;const activeMatch=previous?.events?.some(e=>{const c=e.competitions?.[0],t=c?.status?.type;return t?.state==='in'||(t?.state==='pre'&&Math.abs(Date.parse(e.date)-+now())<21600000)});const ttl=activeMatch?45000:day===today||day===addDay(today,1)?45000:day<today?21600000:3600000;
  const data=await json(l.id+':'+day,BASE+l.espn+'/scoreboard?dates='+day.replaceAll('-',''),ttl,d=>Array.isArray(d.events)&&d.leagues?.[0]?.slug===l.espn);
  if(!Array.isArray(data.events)||data.leagues?.[0]?.slug!==l.espn)throw Error('Calendario ESPN de competición no verificable');return data;
 }
 async function fixtures(lid,day=null){
  const l=leagueFor(lid),today=peruDay(now()),focus=day||today;
  if(normalize(focus)!==focus||focus.length!==10)throw Error('Fecha incorrecta');
  const first=await daily(l,focus),calendar=[...new Set((first.leagues?.[0]?.calendar||[]).filter(d=>typeof d==='string').map(d=>d.slice(0,10)).filter(d=>normalize(d)))].sort();
  // Un día de Perú puede terminar en el siguiente día del calendario del origen.
  const dates=day?[day,addDay(day,1)]:[today,addDay(today,1),...calendar.filter(d=>d<today).slice(-2),...calendar.filter(d=>d>today).slice(0,2)];
  const loaded=await Promise.allSettled([...new Set(dates)].map(async d=>({day:d,data:d===focus?first:await daily(l,d)})));
  const events=new Map(),rejected=[];let stale=!!first._stale;
  for(const r of loaded){if(r.status!=='fulfilled')continue;stale ||= !!r.value.data._stale;
   for(const e of r.value.data.events){const m=normalizeEspnEvent(e,l,db);if(!m){rejected.push(text(e.id));continue}if(!day||(m.date.length===10?m.date:peruDay(m.date))===day)events.set(m.id,m);}}
  const found=loaded.filter(r=>r.status==='fulfilled');
  const staleDates=found.filter(r=>r.value.data._stale).map(r=>r.value.data._retrievedAt).sort();
  return {league:lid,season:l.season,source:'ESPN',sourceUrl:'https://www.espn.com/soccer/scoreboard/_/league/'+l.espn,updatedAt:staleDates[0]||first._retrievedAt,
   availableDates:calendar,events:[...events.values()].sort(compare),partial:true,stale,totalPublished:events.size,
   coverage:{days:found.map(r=>r.value.day),failedDays:loaded.length-found.length,rejected:rejected.length},refreshSeconds:45,
   notice:day?'Partidos del día elegido en hora de Perú.':'Ventana de jornadas cercanas; no es el calendario completo de temporada.',
   ...(stale?{cache:{state:'stale'},note:'No se pudo actualizar ESPN; se conserva la última respuesta.'}:{note:'Actualización periódica; ESPN puede publicar datos con demora.'})};
 }
 async function summary(lid,id){const l=leagueFor(lid);if(!/^\d{1,12}$/.test(String(id)))throw Error('Partido no válido');const data=await json('summary:'+lid+':'+id,BASE+l.espn+'/summary?event='+id,45000,d=>{normalizeEspnSummary(d,l,db,id);return true});const result=normalizeEspnSummary(data,l,db,id);return {...result,updatedAt:data._retrievedAt,...(data._stale?{cache:{state:'stale'},stale:true}:{}),refreshSeconds:45};}
 async function standings(lid){const l=leagueFor(lid),url='https://site.api.espn.com/apis/v2/sports/soccer/'+l.espn+'/standings?season='+seasonStart(l);
  const d=await json('table:'+lid,url,300000,x=>{normalizeEspnStandings(x,l,db);return true});return {...normalizeEspnStandings(d,l,db),...(d._stale?{stale:true}: {})};}
 async function roster(tid){const t=db.teams[tid];if(!t)throw Error('Club desconocido');const l=leagueFor(t.leagues.find(x=>x!=='ucl')||t.leagues[0]),id=Object.entries(identities.leagues[l.id]||{}).find(([,x])=>x===tid)?.[0];if(!id)throw Error('Club sin identidad ESPN');
  const d=await json('roster:'+tid,BASE+l.espn+'/teams/'+id+'/roster?season='+seasonStart(l),21600000,x=>{normalizeEspnRoster(x,t,l);return true});return {...normalizeEspnRoster(d,t,l),...(d._stale?{stale:true}: {})};}
 return {fixtures,summary,standings,roster,status:()=>({enabled,lastSuccess,refreshSeconds:45,mode:'Consulta periódica; cobertura por partido, sin garantía de tiempo real'})};
}
