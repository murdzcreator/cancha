// OpenFootball (openfootball/football.json) publica datos CC0. Importa solo una URL fija permitida por liga.
// No supone marcador en vivo ni atribuye las clasificaciones calculadas a la liga organizadora.
import crypto from 'node:crypto';
import {normalize} from './dates.mjs';
import fs from 'node:fs';
import path from 'node:path';
const URL_BASE='https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/';
const SOURCE_INFO={
 eng:{file:'en.1.json',zone:'Europe/London',names:{
  'AFC Bournemouth':'bournemouth','Arsenal FC':'arsenal','Aston Villa FC':'aston-villa','Brentford FC':'brentford','Brighton & Hove Albion FC':'brighton','Chelsea FC':'chelsea','Coventry City FC':'coventry-city','Crystal Palace FC':'crystal-palace','Everton FC':'everton','Fulham FC':'fulham','Hull City AFC':'hull-city','Ipswich Town FC':'ipswich-town','Leeds United FC':'leeds-united','Liverpool FC':'liverpool','Manchester City FC':'manchester-city','Manchester United FC':'manchester-united','Newcastle United FC':'newcastle-united','Nottingham Forest FC':'nottingham-forest','Sunderland AFC':'sunderland','Tottenham Hotspur FC':'tottenham'}},
 esp:{file:'es.1.json',zone:'Europe/Madrid',names:{
  'Athletic Club':'athletic-club','Club Atlético de Madrid':'atletico-de-madrid','CA Osasuna':'osasuna','RC Celta de Vigo':'celta-de-vigo','Deportivo Alavés':'deportivo-alaves','Elche CF':'elche','FC Barcelona':'fc-barcelona','Getafe CF':'getafe','Levante UD':'levante','Málaga CF':'malaga','Real Racing Club de Santander':'racing-santander','Rayo Vallecano de Madrid':'rayo-vallecano','RC Deportivo La Coruña':'deportivo-la-coruna','RCD Espanyol de Barcelona':'espanyol','Real Betis Balompié':'real-betis','Real Madrid CF':'real-madrid','Real Sociedad de Fútbol':'real-sociedad','Sevilla FC':'sevilla','Valencia CF':'valencia','Villarreal CF':'villarreal'}},
};
function dateOK(value){return typeof value==='string'&&/^202[67]-\d\d-\d\d$/.test(value)&&normalize(value)!==null}
function zonedISO(date,time,zone){if(time===undefined||time===null||time==='')return date; const hh=/^\d\d:\d\d$/.test(time)?time:null;if(!hh)return null;const [hours,mins]=hh.split(':').map(Number);if(hours>23||mins>59)return null;
 const utc=Date.parse(date+'T'+hh+':00Z');const tz=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(new Date(utc)).find(p=>p.type==='timeZoneName')?.value||'GMT';const m=tz.match(/GMT([+-])(\d\d?)(?::(\d\d))?/);const offset=m?(m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0)):0;return new Date(utc-offset*60000).toISOString();}
function matchId(league,home,away){const n=BigInt('0x'+crypto.createHash('sha256').update([league,home,away].join(':')).digest('hex').slice(0,13))%100000000000n;return (n+10000000000n).toString()}
function pair(score){const arr=Array.isArray(score?.ft)?score.ft:Array.isArray(score)?score:null;return Array.isArray(arr)&&arr.length===2&&arr.every(n=>Number.isInteger(n)&&n>=0&&n<=99)?arr:null}
export const openfootballSources=Object.fromEntries(Object.entries(SOURCE_INFO).map(([l,x])=>[l,URL_BASE+x.file]));
export function convertOpenFootball(source,league,db,{retrievedAt=new Date().toISOString(),seed=false}={}){
 const c=SOURCE_INFO[league],l=db.leagues.find(x=>x.id===league);if(!l||!c||l.season!=='2026/27'||!source||!Array.isArray(source.matches))throw Error('Formato/temporada incorrecta');
 const unknown=new Set(),seen=new Set(),events=[],table=Object.fromEntries(l.teams.map(id=>[id,{team:db.teams[id].name,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0}]));
 for(const m of source.matches){const h=c.names[m.team1],a=c.names[m.team2];if(!h||!a||!l.teams.includes(h)||!l.teams.includes(a)||h===a){unknown.add(`${m.team1||'?'} / ${m.team2||'?'}`);continue}
 if(!dateOK(m.date)){unknown.add('Fecha inválida: '+m.date);continue}
 const id=matchId(league,h,a);if(seen.has(id)){unknown.add('Partido duplicado: '+m.team1+' - '+m.team2);continue}seen.add(id);
 const result=pair(m.score),d=zonedISO(m.date,m.time,c.zone);if(!d){unknown.add('Hora inválida: '+m.time);continue;}
 const status=result?'FINAL':'PROGRAMADO';
 events.push({id,homeName:db.teams[h].name,awayName:db.teams[a].name,date:d,status,hs:result?.[0]??null,as:result?.[1]??null});
 if(result){const [hg,ag]=result;const H=table[h],A=table[a];H.pj++;A.pj++;H.gf+=hg;H.gc+=ag;A.gf+=ag;A.gc+=hg;
  if(hg>ag){H.g++;A.p++;H.pts+=3}else if(ag>hg){A.g++;H.p++;A.pts+=3}else{H.e++;A.e++;H.pts++;A.pts++}
 }
 }
 // Una carga incompleta no reemplaza un calendario íntegro: todos los 20 equipos deben estar incluidos.
 const present=new Set(events.flatMap(m=>[m.homeName,m.awayName]));if(present.size!==l.teams.length||events.length<10)throw Error(`Cobertura insuficiente: ${present.size} equipos, ${events.length} partidos`);
 if(unknown.size)throw Error('Identificación no comprobada: '+[...unknown].slice(0,5).join('; '));
 const src=openfootballSources[league],meta={schema:'cancha-soccerdata-v1',league,season:l.season,provider:'OpenFootball (CC0)',sourceUrl:src,retrievedAt,publication:'Calendario/resultado de datos abiertos; no resultados en vivo',seed};
 const standings=Object.values(table).map(x=>({...x,dg:x.gf-x.gc}));return {
 fixtures:{...meta,kind:'fixtures',records:events,coverage:{matches:events.length,finished:events.filter(x=>x.status==='FINAL').length}},
 standings:{...meta,kind:'standings',records:standings,coverage:{calculatedFrom:events.filter(x=>x.status==='FINAL').length,warning:'Clasificación CALCULADA con los resultados disponibles en OpenFootball, no oficial ni garantizada al día.'}}
 };
}
export async function downloadOpenFootball(root,db,{fetchFn=globalThis.fetch,leagues=['eng','esp'],timeoutMs=10000,force=false,log=()=>{}}={}){
 const report=[],folder=path.join(root,'data-imports','soccerdata');fs.mkdirSync(folder,{recursive:true});
 for(const league of leagues){const cfg=SOURCE_INFO[league];if(!cfg){report.push({league,ok:false,error:'Liga no compatible'});continue}
 const files=['fixtures','standings'].map(kind=>path.join(folder,`${league}-${kind}.json`));const prev=files.find(fs.existsSync);
 if(!force&&prev){try{const d=JSON.parse(fs.readFileSync(prev,'utf8'));if(d.provider==='OpenFootball (CC0)'&&!d.seed&&Date.now()-Date.parse(d.retrievedAt)<24*3600*1000){report.push({league,ok:true,skipped:true});continue}}catch{}}
 try{const signal=AbortSignal.timeout(timeoutMs);const resp=await fetchFn(openfootballSources[league],{signal,headers:{'Accept':'application/json','User-Agent':'CANCHA/14.1 personal football dashboard (OpenFootball CC0)'}});if(!resp.ok)throw Error('HTTP '+resp.status);const body=await resp.text();if(body.length>2_000_000)throw Error('Fuente supera tamaño permitido');const dataset=JSON.parse(body);const obj=convertOpenFootball(dataset,league,db);if(obj.fixtures.records.length<100)throw Error('La fuente remota trae menos de 100 partidos; se conserva la copia anterior');
 // Write atomically. Preserve last good results on network or data error.
 for(const kind of ['fixtures','standings']){const tmp=files[kind==='fixtures'?0:1]+'.tmp';fs.writeFileSync(tmp,JSON.stringify(obj[kind],null,0));fs.renameSync(tmp,files[kind==='fixtures'?0:1])}
 report.push({league,ok:true,matches:obj.fixtures.records.length,finished:obj.fixtures.records.filter(x=>x.status==='FINAL').length,source:openfootballSources[league]});log(`${league}: ${obj.fixtures.records.length} partidos; ${report.at(-1).finished} resultados.`);
 }catch(e){report.push({league,ok:false,previousDataKept:!!prev,error:String(e.message).slice(0,200)});log(`${league}: no se actualizó (${String(e.message).slice(0,110)}). Conservando datos anteriores.`)}
 }
 return report;
}
