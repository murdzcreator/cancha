// CANCHA V12 · Node.js 20+ · sin dependencias externas
import http from 'node:http';
import {reconcileStandings} from './server/standings.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cacheLayer} from './server/cache.mjs';
import {makeProviders} from './server/providers.mjs';
import {createPlayerIndex} from './server/player-index.mjs';
import {readBranding} from './server/branding.mjs';
import {createSoccerDataImports} from './server/soccerdata-import.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const crestCount=Object.keys(readBranding(path.dirname(fileURLToPath(import.meta.url))).teams||{}).length;
let crestStatus={state:'complete',local:crestCount,source:'biblioteca local del ZIP aportado'};
function loadEnv(){let filename=path.join(ROOT,'.env');if(!fs.existsSync(filename))return;for(let row of fs.readFileSync(filename,'utf8').split(/\r?\n/)){const m=row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}}
loadEnv();
const raw=fs.readFileSync(path.join(ROOT,'db.js'),'utf8');
const db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;\s*$/,''));
process.env.CANCHA_USAGE_PATH=path.join(ROOT,'data-cache','api-football-quota.json');
const providers=makeProviders({db}),cache=cacheLayer(path.join(ROOT,'data-cache'));
const verifiedSnapshots=JSON.parse(fs.readFileSync(path.join(ROOT,'server','public-snapshots.json'),'utf8'));
verifiedSnapshots.standings=reconcileStandings(verifiedSnapshots.standings);
const soccerdata=createSoccerDataImports(ROOT,db);
const dataKeysPresent=Boolean(process.env.FOOTBALL_DATA_KEY||process.env.API_FOOTBALL_KEY);
const playerIndex=createPlayerIndex(path.join(ROOT,'data-cache'),{db,snapshots:verifiedSnapshots});
async function standingsFor(l){
 const local=soccerdata.standings(l);
 if(local?.quality.complete&&!dataKeysPresent)return local;
 if(l==='per'&&!dataKeysPresent) return local?.quality?.complete?local:verifiedSnapshots.standings;
 try{
  const live=await providers.getStandings(l);
  if(local && (local.quality.complete&&!live.quality?.complete || local.quality.found> (live.quality?.found||0)))return local;
  if(l==='per'&&!live.quality?.complete)return local?.quality.complete?local:verifiedSnapshots.standings;
  return live;
 }catch(e){if(local)return l==='per'&&!local.quality.complete?verifiedSnapshots.standings:local;if(l==='per')return verifiedSnapshots.standings;throw e;}
}
async function fixturesFor(l){
 const imported=soccerdata.fixtures(l);
 if(imported?.events.length)return imported;
 return providers.getFixtures(l);
}
async function rosterFor(t){
 if(t==='alianza-lima'&&!dataKeysPresent)return verifiedSnapshots.roster;
 try { const live=await providers.getRoster(t);
  if(t==='alianza-lima'&&(live.players||[]).length<verifiedSnapshots.roster.players.length)return verifiedSnapshots.roster;
  return live;
 } catch(e){ if(t==='alianza-lima')return verifiedSnapshots.roster; throw e; }
}
const leagues=new Set(db.leagues.map(x=>x.id));const teams=new Set(Object.keys(db.teams));
function send(res,status,data){const json=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"});res.end(json)}
function ttl(kind){return ({standings:60*60_000,fixtures:5*60_000,roster:7*24*60*60_000,player:12*60*60_000})[kind]}
const mimes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
async function router(req,res){
 const url=new URL(req.url,'http://localhost');
 if(req.method!=='GET'){send(res,405,{error:'Método no permitido'});return}
 if(url.pathname==='/api/branding/status'){send(res,200,crestStatus);return}
 if(url.pathname==='/api/branding/manifest'){send(res,200,readBranding(ROOT));return}
 if(url.pathname.startsWith('/api/')){
  if(url.pathname==='/api/health'){send(res,200,{version:'14.2',server:true,asOf:new Date().toISOString(),providers:providers.status,liveCredentialsConfigured:dataKeysPresent,soccerdataImports:soccerdata.status(),hasImportedFixtures:soccerdata.status().some(x=>x.fixtures>0),playerCoverage:playerIndex.coverage(),snapshotFallbacks:['per','alianza-lima'],competitions:db.leagues.map(x=>({id:x.id,name:x.name,season:x.season}))});return}
  if(url.pathname==='/api/club-profile'){const id=url.searchParams.get('team');if(!teams.has(id)){send(res,404,{error:'Club desconocido'});return}try{const data=await cache.retrieve('club-profile:'+id,72*60*60_000,()=>providers.getClubProfile(id));send(res,200,data)}catch(err){send(res,503,{error:'Ficha pública adicional no disponible',detail:err.message})}return}
  if(url.pathname==='/api/players'){const integer=(v,fallback,max)=>/^\d+$/.test(v||'')?Math.min(max,Number(v)):fallback;const count=Math.max(1,integer(url.searchParams.get('limit'),80,100));const offset=integer(url.searchParams.get('offset'),0,100000);send(res,200,playerIndex.listing({q:url.searchParams.get('q')||'',team:url.searchParams.get('team')||'',limit:count,offset}));return}
  if(url.pathname==='/api/player-profile'){const t=url.searchParams.get('team')||'',id=url.searchParams.get('id')||'';if(!teams.has(t)){send(res,404,{error:'Club desconocido'});return}const p=playerIndex.one(t,id);if(!p){send(res,404,{error:'Jugador no documentado en el índice local'});return}send(res,200,p);return}
  const l=url.searchParams.get('league'),t=url.searchParams.get('team'),force=url.searchParams.get('refresh')==='1';
  try{
   if(url.pathname==='/api/standings'&&leagues.has(l)){const local=soccerdata.standings(l);if(local?.quality.complete&&!dataKeysPresent){send(res,200,local);return}let d=await cache.retrieve('standings:v15:'+l,ttl('standings'),()=>standingsFor(l),{force});send(res,200,d);return}
   if(url.pathname==='/api/fixtures'&&leagues.has(l)){const local=soccerdata.fixtures(l);if(local?.events.length){send(res,200,local);return}let d=await cache.retrieve('fixtures:v15:'+l,ttl('fixtures'),()=>fixturesFor(l),{force});send(res,200,d);return}
   if(url.pathname==='/api/roster'&&teams.has(t)){let d=await cache.retrieve('roster:'+t,ttl('roster'),()=>rosterFor(t),{force});if(d.players?.length)playerIndex.addRoster(d);send(res,200,d);return}
   if(url.pathname==='/api/match-detail'&&leagues.has(l)){
    const id=url.searchParams.get('id'),source=url.searchParams.get('source');
    if(!/^\d{1,12}$/.test(id||'')||!['API-Football','football-data.org','TheSportsDB','SoccerData'].includes(source)){send(res,400,{error:'Origen o identificador no válido'});return}
    if(source==='SoccerData'){const local=soccerdata.match(l,id);if(!local){send(res,404,{error:'Partido importado no encontrado'});return}send(res,200,local);return}
    let d=await cache.retrieve(['fixture-detail-v15',l,source,id].join(':'),10*60_000,()=>source==='SoccerData'?Promise.resolve(soccerdata.match(l,id)).then(x=>{if(!x)throw Error('Partido importado no encontrado');return x}):providers.getMatchDetail(l,source,id));send(res,200,d);return;
   }
   if(url.pathname==='/api/player-stats'&&teams.has(t)){
    const player=url.searchParams.get('player'),provider=url.searchParams.get('source');
    if(!/^\d{1,12}$/.test(player||'') || !['TheSportsDB','API-Football','football-data.org','Liga1Oficial'].includes(provider)){send(res,400,{error:'Identificador de jugador incorrecto'});return}
    let d=await cache.retrieve(['player-v15',t,player,provider].join(':'),ttl('player'),()=>provider==='Liga1Oficial' ? Promise.resolve({source:'Liga 1 (ficha pública)',updatedAt:null,rows:[],note:'La ficha oficial registra nombre, posición, nacimiento y nacionalidad; no publica estadísticas individuales. No se inventan cifras.'}) : providers.getPlayerStats(t,player,provider));send(res,200,d);return;
   }
   send(res,404,{error:'Recurso o liga inexistente'});
  }catch(err){send(res,503,{error:'No hay respuesta verificable disponible',detail:err.message,canRetry:true})}
  return;
 }
 let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end();return}
 if(pathname==='/'||pathname==='/centro.html'||pathname==='/partido-psg-barcelona-2026.html')pathname='/index.html';
 const file=path.resolve(ROOT,'.'+pathname),relative=path.relative(ROOT,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.startsWith('server/')||relative.startsWith('data-cache/')||relative.startsWith('data-imports/')||relative.startsWith('scripts/')||pathname.split('/').some(part=>part.startsWith('.'))||pathname.startsWith('/test/')||path.extname(file)==='.mjs'){
  res.writeHead(403);res.end('Acceso denegado');return
 }
 try{const stat=fs.statSync(file);if(!stat.isFile())throw Error('No encontrado');const ext=path.extname(file).toLowerCase();if(!mimes[ext]){res.writeHead(403);res.end();return}res.writeHead(200,{'Content-Type':mimes[ext],'X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'?'no-store':'public, max-age=60'});fs.createReadStream(file).pipe(res)}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Archivo no encontrado')}
}
export function startServer(port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1'){
 const server=http.createServer((req,res)=>{router(req,res).catch(()=>{if(!res.headersSent)send(res,500,{error:'Error interno'})})});
 server.listen(port,host,()=>console.log(`CANCHA V14.2: http://${host}:${server.address().port}`));
  // Escudos locales empaquetados: sin descarga automática, ni cambios silenciosos.
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startServer();
