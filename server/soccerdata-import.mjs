// CANCHA V14. Importación local revisable: NO hace scraping ni peticiones a fuentes de terceros.
import fs from 'node:fs';
import {normalize as isoDate,compare} from './dates.mjs';
import path from 'node:path';
import {matchTeam,safeInt} from './identity.mjs';
const TYPES = new Set(['standings','fixtures','match']);
const STATUSES = new Set(['FINAL','PROGRAMADO','EN VIVO','APLAZADO','CANCELADO','SUSPENDIDO','SIN CONFIRMAR']);
const MAX_BYTES = 3_000_000;
const score = x => {const n=safeInt(x);return n!==null&&n>=0&&n<=99?n:null};
const str = x => String(x??'').slice(0,180).trim();
export function createSoccerDataImports(root,db,{dirname='data-imports/soccerdata'}={}) {
 const leagues=Object.fromEntries(db.leagues.map(x=>[x.id,x]));const folder=path.resolve(root,dirname);
 function read(lid,kind){
  if(!leagues[lid]||!TYPES.has(kind))return null;
  const filename=path.join(folder,`${lid}-${kind}.json`);
  try { const st=fs.statSync(filename);if(!st.isFile()||st.size>MAX_BYTES)return null;
   const obj=JSON.parse(fs.readFileSync(filename,'utf8'));
   if(obj.schema!=='cancha-soccerdata-v1'||obj.league!==lid||obj.kind!==kind||obj.season!==leagues[lid].season||!Array.isArray(obj.records))return null;
   if(obj.records.length>1500)return null;
   const updatedAt=isoDate(obj.retrievedAt);if(!updatedAt)return null;
   return {...obj,updatedAt};
  }catch{return null}
 }
 function standings(lid){const d=read(lid,'standings');if(!d)return null;const league=leagues[lid];let rows=[],seen=new Set(),errors=[];
  for(const item of d.records){const t=matchTeam(item.team,db.teams,league.teams);if(!t){errors.push(str(item.team));continue}if(seen.has(t)){errors.push(`Duplicado: ${t}`);continue}
   const pj=safeInt(item.pj),g=safeInt(item.g),e=safeInt(item.e),p=safeInt(item.p),gf=safeInt(item.gf),gc=safeInt(item.gc),pts=safeInt(item.pts),dg=safeInt(item.dg);
   if([pj,g,e,p,gf,gc,pts].some(v=>v==null||v<0)||g+e+p!==pj||dg!=null&&dg!==gf-gc){errors.push(`Inconsistencia: ${t}`);continue}
   seen.add(t);rows.push({teamId:t,name:db.teams[t].name,position:null,pj,g,e,p,gf,gc,dg:gf-gc,pts,form:''});
  }
  const complete=rows.length===league.teams.length && errors.length===0;
  if(complete){rows.sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);rows.forEach((r,i)=>r.position=i+1)}
  return {kind:'standings',league:lid,season:league.season,source:d.provider==='OpenFootball (CC0)'?'OpenFootball · dominio público CC0':`SoccerData · ${str(d.provider)}`,sourceDetail:str(d.sourceUrl),updatedAt:d.updatedAt,imported:true,partial:!complete,calculated:d.provider==='OpenFootball (CC0)',seed:!!d.seed,quality:{complete,found:rows.length,expected:league.teams.length,unmatched:errors},groups:[{label:'Tabla importada',rows,source:d.provider==='OpenFootball (CC0)'?'OpenFootball · dominio público CC0':`SoccerData · ${str(d.provider)}`,details:d.provider==='OpenFootball (CC0)'?`Tabla CALCULADA con ${d.coverage?.calculatedFrom||0} partidos finalizados incluidos en el archivo; NO es la clasificación oficial ni necesariamente la última jornada. Orden técnico por puntos, diferencia y goles.`:complete?'Tabla completa importada; desempates ordenados provisionalmente por puntos, diferencia y goles.':'Datos parciales: ninguna posición oficial se inventa.',sourceUrl:d.sourceUrl||''}],note:d.provider==='OpenFootball (CC0)'?'Resultados disponibles en OpenFootball CC0. Consulta fechada y potencialmente atrasada; NO son resultados en directo.':'Importación manual fechada, no transmisión en vivo.'};
 }
 function fixtures(lid){const d=read(lid,'fixtures');if(!d)return null;const l=leagues[lid],events=[],errors=[],ids=new Set();
  for(const item of d.records){const home=matchTeam(item.homeName,db.teams,l.teams),away=matchTeam(item.awayName,db.teams,l.teams);
   const date=isoDate(item.date);const id=str(item.id);if(!home||!away||home===away||!date||!/^\d{1,12}$/.test(id)||ids.has(id)){errors.push(`${str(item.homeName)} - ${str(item.awayName)}`);continue}
   ids.add(id);
   let hs=score(item.hs),as=score(item.as);let status=STATUSES.has(item.status)?item.status:'SIN CONFIRMAR';
   if(status==='FINAL'&&(hs===null||as===null)||(hs===null)!==(as===null)){status='SIN CONFIRMAR';hs=null;as=null}
   if(['PROGRAMADO','CANCELADO','APLAZADO'].includes(status)){hs=null;as=null}
   events.push({id,home,away,homeName:db.teams[home].name,awayName:db.teams[away].name,date,status,hs,as,provider:'SoccerData',source:d.provider==='OpenFootball (CC0)'?'OpenFootball · dominio público CC0':`SoccerData · ${str(d.provider)}`});
  }
  return {kind:'fixtures',league:lid,season:l.season,source:d.provider==='OpenFootball (CC0)'?'OpenFootball · dominio público CC0':`SoccerData · ${str(d.provider)}`,sourceUrl:d.sourceUrl||'',updatedAt:d.updatedAt,imported:true,seed:!!d.seed,events:events.sort(compare),totalPublished:events.length,rejected:errors.slice(0,40),coverage:{matched:events.length,rejected:errors.length},note:d.provider==='OpenFootball (CC0)'?'Calendario de OpenFootball CC0, no en vivo. Algunas horas pueden diferir del horario oficial; consulta al organizador.':'Importación local manual. Las alineaciones y métricas no se infieren del resultado.'};
 }
 function match(lid,id){const data=fixtures(lid);const m=data?.events.find(x=>x.id===String(id));if(!m)return null;
  const detailed=read(lid,'match');const rec=detailed?.records.find(x=>String(x.id)===String(id))||null;
  const lines=[];
  if(rec?.lineups && Array.isArray(rec.lineups))for(const x of rec.lineups.slice(0,2)){
   const team=matchTeam(x.team,db.teams,leagues[lid].teams);if(!team||![m.home,m.away].includes(team))continue;
   const pl=Array.isArray(x.players)?x.players.slice(0,40).filter(p=>p.name).map(p=>({id:str(p.id),name:str(p.name),number:safeInt(p.number),position:str(p.position),grid:null,statistics:Array.isArray(p.statistics)?p.statistics:[]})):[];
   lines.push({team:db.teams[team].name,formation:str(x.formation),starting:pl.filter(p=>p.id!=='-1'),substitutes:[]});
  }
  // El calendario no publica eventos ni futbolistas, pero sí encuentros asociados a ambos clubes.
  // La comparación se hace respecto a la fecha del partido abierto, nunca respecto a la fecha actual.
  const neighbors=club=>{
   const clubFixtures=data.events.filter(x=>x.home===club||x.away===club).filter(x=>x.id!==m.id);
   return {
    previous:clubFixtures.filter(x=>x.date<m.date).slice(-3).reverse(),
    next:clubFixtures.filter(x=>x.date>m.date).slice(0,3)
   };
  };
  return {...m,league:lid,source:data.source,sourceUrl:data.sourceUrl,updatedAt:data.updatedAt,
   lineups:lines,events:[],stats:[],relatedMatches:{home:neighbors(m.home),away:neighbors(m.away)},
   note:'OpenFootball publica fecha, equipos y marcador. Esta importación no contiene alineaciones, sustituciones, cronología de goles ni estadísticas individuales.'};
 }
 function status(){return Object.keys(leagues).map(lid=>{const f=fixtures(lid),s=standings(lid);return {league:lid,season:leagues[lid].season,fixtures:f?.events.length||0,standings:s?.quality.found||0,tableComplete:!!s?.quality.complete,source:f?.source||s?.source||null,lastUpdated:f?.updatedAt||s?.updatedAt||null}})}
 return {read,standings,fixtures,match,status,folder};
}
