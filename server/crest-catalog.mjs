/**
 * CANCHA 12.3. Coincidencias deterministas país + identidad del club.
 * Solo acepta un nombre exacto o un alias curado dentro del país.
 * Nunca permite búsqueda difusa por el primer resultado ni cambia escudos por otro club.
 * El repositorio de referencia es público, pero los escudos conservan los derechos de sus titulares.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const REPO='JoseArroyave/football-logos';
const TREE=`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`;
export const REGION={
 'Perú':['peru'], 'Argentina':['argentina'], 'Brasil':['brazil','brasil'], 'México':['mexico'],
 'España':['spain','espana'], 'Inglaterra':['england'], 'Italia':['italy','italia'],
 'Francia':['france','francia'], 'Alemania':['germany','alemania'], 'Turquía':['turkey','turquia'],
 'Portugal':['portugal'], 'Países Bajos':['netherlands','holland','paises bajos'],
 'Grecia':['greece','grecia'], 'Bélgica':['belgium','belgica'], 'Austria':['austria'],
 'Azerbaiyán':['azerbaijan','azerbaiyan'], 'Ucrania':['ukraine','ucrania'],
 'Chequia':['czech republic','czechia','republica checa'], 'Eslovaquia':['slovakia','eslovaquia'],
 'Noruega':['norway','noruega']
};
// Aliases específicos para evitar confundir equipos y nombres populares. No se usan búsquedas parciales.
export const ALIASES={
 'universitario':['universitario de deportes','club universitario de deportes'],
 'cusco-fc':['cusco','cusco fc'],
 'alianza-atletico':['alianza atletico sullana','alianza atletico'],
 'adt-tarma':['asociacion deportiva tarma','adt','adt tarma'],
 'utc-cajamarca':['utc','universidad tecnica de cajamarca'],
 'fc-cajamarca':['fc cajamarca'],
 'juan-pablo-ii-college':['juan pablo ii','juan pablo ii college','adc juan pablo ii'],
 'deportivo-moquegua':['club deportivo moquegua','deportivo moquegua'],
 'los-chankas':['deportivo los chankas','los chankas'],
 'fbc-melgar':['melgar','fbc melgar'],
 'sport-boys':['sport boys association','sport boys'],
 'atletico-grau':['atletico grau'],
 'atletico-de-madrid':['atletico madrid','atletico de madrid'],
 'fc-barcelona':['barcelona','fc barcelona'],
 'bayern-munich':['bayern munchen','fc bayern munchen','bayern munich'],
 'borussia-dortmund':['borussia dortmund','bvb'],
 'rb-leipzig':['rb leipzig','rasenballsport leipzig'],
 'vfb-stuttgart':['vfb stuttgart','stuttgart'],
 'bod-glimt':['bodo glimt','bodo/glimt','fk bodo glimt'],
 'club-brugge':['club brugge','club brugge kv'],
 'lask':['lask linz','lask'],
 'feyenoord':['feyenoord rotterdam','feyenoord'],
 'psv-eindhoven':['psv','psv eindhoven'],
 'inter-de-milan':['inter','inter milan','internazionale','fc internazionale milano'],
 'ac-milan':['ac milan','milan'],
 'napoli':['ssc napoli','napoli'],
 'as-roma':['roma','as roma'],
 'fc-porto':['porto','fc porto'],
 'sporting-cp':['sporting cp','sporting lisboa','sporting clube de portugal'],
 'rc-lens':['rc lens','lens'],
 'paris-saint-germain':['paris saint germain','psg'],
 'olympique-lyon':['olympique lyonnais','lyon'],
 'olympique-marsella':['olympique de marseille','marseille'],
 'as-monaco':['monaco','as monaco'],
 'manchester-city':['manchester city','man city'],
 'manchester-united':['manchester united','man united'],
 'tottenham':['tottenham hotspur','tottenham'],
 'brighton':['brighton and hove albion','brighton'],
 'bournemouth':['afc bournemouth','bournemouth'],
 'wolves':['wolverhampton wanderers'],
 'crystal-palace':['crystal palace'],
 'newcastle-united':['newcastle united'],
 'nottingham-forest':['nottingham forest'],
 'coventry-city':['coventry city'],
 'hull-city':['hull city'],
 'ipswich-town':['ipswich town'],
 'rayo-vallecano':['rayo vallecano'],
 'athletic-club':['athletic bilbao','athletic club'],
 'osasuna':['ca osasuna','osasuna'],
 'celta-de-vigo':['celta vigo','rc celta','celta de vigo'],
 'deportivo-alaves':['deportivo alaves','alaves'],
 'deportivo-la-coruna':['deportivo la coruna','deportivo de la coruna'],
 'racing-santander':['racing de santander','racing santander'],
 'real-betis':['real betis balompie','real betis'],
 'real-madrid':['real madrid','real madrid cf'],
 'real-sociedad':['real sociedad'],
 'espanyol':['rcd espanyol','espanyol'],
 'atletico-mineiro':['atletico mineiro','clube atletico mineiro'],
 'athletico-paranaense':['athletico paranaense','atletico paranaense'],
 'red-bull-bragantino':['red bull bragantino','bragantino'],
 'sao-paulo':['sao paulo','sao paulo fc'],
 'vasco-da-gama':['vasco da gama','cr vasco da gama'],
 'club-america':['america','club america'],
 'guadalajara':['chivas guadalajara','guadalajara'],
 'juarez':['fc juarez','juarez'],
 'pumas-unam':['pumas unam','unam pumas','pumas'],
 'tigres-uanl':['tigres uanl','tigres'],
 'santos-laguna':['santos laguna'],
 'central-cordoba':['central cordoba santiago del estero','central cordoba'],
 'estudiantes-la-plata':['estudiantes de la plata','estudiantes lp'],
 'estudiantes-rio-cuarto':['estudiantes de rio cuarto','estudiantes rio cuarto'],
 'gimnasia-la-plata':['gimnasia y esgrima la plata','gimnasia la plata'],
 'gimnasia-mendoza':['gimnasia y esgrima mendoza','gimnasia mendoza'],
 'newells-old-boys':['newells old boys','newells'],
 'union-santa-fe':['union de santa fe','union santa fe'],
 'velez-sarsfield':['velez sarsfield','velez'],
 'talleres':['talleres cordoba','talleres'],
 'racing-club':['racing club avellaneda','racing club'],
 'rosario-central':['rosario central'],
 'independiente-rivadavia':['independiente rivadavia'],
 'platense':['platense','ca platense'],
 'deportivo-riestra':['deportivo riestra'],
 'defensa-y-justicia':['defensa y justicia'],
 'boca-juniors':['boca juniors'],
 'river-plate':['river plate'],
 'fiorentina':['fiorentina','acf fiorentina'],
 'genoa':['genoa','genoa cfc'],
 'juventus':['juventus','juventus fc'],
 'lazio':['lazio','ss lazio'],
 'monza':['monza','ac monza'],
 'paris-fc':['paris fc','paris football club'],
 'le-mans':['le mans','le mans fc'],
 'le-havre':['le havre','le havre ac'],
 'angers':['angers','angers sco'],
 'rennes':['rennes','stade rennais'],
 'strasbourg':['strasbourg','rc strasbourg'],
 'troyes':['troyes','estac troyes'],
 'shakhtar-donetsk':['shakhtar donetsk'],
 'slavia-praga':['slavia prague','slavia praha'],
 'slovan-bratislava':['slovan bratislava'],
 'viking-fk':['viking fk','viking stavanger'],
 'sabah-fk':['sabah fk','sabah'],
};
export const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[ø]/ig,'o').replace(/&/g,' and ').replace(/[^a-zA-Z0-9]+/g,' ').trim().replace(/\s+/g,' ').toLowerCase();
const basics=s=>new Set([normalize(s),normalize(s).replace(/\b(?:fc|cf|sc|ac|afc|fk|cfc|club|football|futbol|de|do|da)\b/g,'').replace(/\s+/g,' ').trim()]);
export function matchPaths(db,repoPaths){
  const imgs=repoPaths.filter(f=>/^logos\/.+\.(?:svg|png)$/i.test(f)&&!f.includes('..')).map(p=>{
   const parts=p.split('/');return {path:p,country:normalize(parts[1]),basename:normalize(parts.at(-1).replace(/\.(svg|png)$/i,'')),ext:parts.at(-1).split('.').pop().toLowerCase()};
  });
  const matched={},unmatched={},ambiguous={};
  for(const [id,t] of Object.entries(db.teams)){
   const co=(REGION[t.country]||(id==='bod-glimt'?['norway']:[])).map(normalize), target=new Set([normalize(t.name),normalize(id.replace(/-/g,' ')),...(ALIASES[id]||[]).map(normalize)]);
   const eligible=imgs.filter(x=>co.includes(x.country));
   const candidates=eligible.filter(x=>target.has(x.basename));
   const vals=new Set(candidates.map(x=>x.basename));
   if(!candidates.length){unmatched[id]='sin coincidencia exacta en país';continue;}
   // Si un archivo para el mismo equipo aparece duplicado, preferimos SVG pero nunca nombres diferentes con ambigüedad.
   if(vals.size>1){
     // Los alias diferentes del mismo club solo se admiten si el nombre normalizado oficial está entre ellos.
     const official=candidates.filter(x=>x.basename===normalize(t.name));
     if(!official.length){ambiguous[id]=candidates.map(x=>x.path);continue}
     candidates.splice(0,candidates.length,...official);
   }
   const chosen=candidates.sort((a,b)=>Number(b.ext==='svg')-Number(a.ext==='svg')||a.path.localeCompare(b.path))[0];
   matched[id]=chosen.path;
  }
  return {matched,unmatched,ambiguous,total:Object.keys(db.teams).length};
}
async function get(url,{binary=false,timeout=19000,maxSize=4500000}={}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const res=await fetch(url,{signal:controller.signal,headers:{'User-Agent':'CANCHA-crest-catalog/12.3 (+personal project)','Accept':'application/vnd.github+json, image/svg+xml, image/png, application/json'}});
  if(!res.ok)throw new Error(`HTTP ${res.status}`);
  const len=Number(res.headers.get('content-length')||0);if(len>maxSize)throw Error('imagen demasiado grande');
  const bytes=Buffer.from(await res.arrayBuffer());if(bytes.length>maxSize)throw Error('imagen demasiado grande');
  return binary?bytes:JSON.parse(bytes.toString('utf8'));
 }finally{clearTimeout(timer)}
}
export function validRaster(buf){return buf.length>90&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));}
export function validSVG(buf){const xml=buf.toString('utf8');return xml.length>80&&/<svg[\s>]/i.test(xml)&&!/<(?:script|iframe|foreignObject|object|embed)\b|\bon\w+\s*=|javascript:|data:text\/html|<image[^>]+(?:href|xlink:href)=["']https?:/i.test(xml)}
const ROOT_RAW=`https://raw.githubusercontent.com/${REPO}/main/`;
export async function fillCrests({root,db,onProgress=()=>{},concurrency=5}={}){
 if(!root||!db)throw Error('root/db requeridos');
 const folder=path.join(root,'assets','escudos');await fsp.mkdir(folder,{recursive:true});
 let manifest;try{manifest=JSON.parse(await fsp.readFile(path.join(root,'assets','branding-manifest.json'),'utf8'))}catch{manifest={teams:{},leagues:{}}}
 manifest.teams||={};manifest.leagues||={};manifest.version='12.3';
 const ready=Object.values(manifest.teams).filter(x=>x.curatedLocal&&fs.existsSync(path.join(root,x.curatedLocal))).length;
 const result={state:'connecting',source:`https://github.com/${REPO}`,attempted:0,downloaded:0,already:ready,matched:0,unmatched:0,ambiguous:0,errors:[],lastChecked:new Date().toISOString()};
 let paths=[];
 try{const tree=await get(TREE,{timeout:25000,maxSize:14_000_000});if(tree.truncated)throw Error('El índice de la fuente está incompleto');paths=(tree.tree||[]).filter(x=>x.type==='blob').map(x=>x.path)}
 catch(err){result.state='offline';result.errors.push('No se pudo acceder al catálogo público: '+err.message);onProgress(result);return result}
 const mapping=matchPaths(db,paths);result.matched=Object.keys(mapping.matched).length;result.unmatched=Object.keys(mapping.unmatched).length;result.ambiguous=Object.keys(mapping.ambiguous).length;
 const catalog=Object.entries(mapping.matched);let offset=0;let reviewed=0;
 async function persist(){manifest.checkedAt=new Date().toISOString();const b=JSON.stringify(manifest,null,2);await fsp.writeFile(path.join(root,'assets','branding-manifest.json.tmp'),b);await fsp.rename(path.join(root,'assets','branding-manifest.json.tmp'),path.join(root,'assets','branding-manifest.json'));await fsp.writeFile(path.join(root,'assets','branding-data.js'),'window.CANCHA_BRANDING_DATA='+JSON.stringify(manifest)+';\n')}
 async function worker(){while(true){const n=offset++;if(n>=catalog.length)break;const [id,p]=catalog[n],ext=p.split('.').pop();const relative=`assets/escudos/${id}.${ext}`;const output=path.join(root,relative);
  if(fs.existsSync(output)&&((ext==='svg'&&validSVG(fs.readFileSync(output)))||(ext==='png'&&validRaster(fs.readFileSync(output))))){result.already++;manifest.teams[id]={...manifest.teams[id],curatedLocal:relative,curatedSource:`https://github.com/${REPO}/blob/main/${p}`,curatedMatch:'exact-country-and-name'};continue}
  try{const encoded=p.split('/').map(encodeURIComponent).join('/');const bytes=await get(ROOT_RAW+encoded,{binary:true,maxSize:3_200_000});if(!(ext==='svg'?validSVG(bytes):validRaster(bytes)))throw Error('imagen no válida o peligrosa');
    await fsp.writeFile(output,bytes);manifest.teams[id]={...manifest.teams[id],curatedLocal:relative,curatedSource:`https://github.com/${REPO}/blob/main/${p}`,curatedMatch:'exact-country-and-name',sha256:createHash('sha256').update(bytes).digest('hex'),curatedAt:new Date().toISOString(),rights:'marca del respectivo club; confirmar uso público'};
    result.downloaded++;
   }catch(err){result.errors.push(`${id}: ${err.message}`)}
   reviewed++;if(reviewed%20===0)onProgress({...result,state:'downloading'});
 }}
 await Promise.all(Array.from({length:Math.min(8,Math.max(1,concurrency))},()=>worker()));await persist();result.state='complete';result.attempted=catalog.length;result.lastChecked=new Date().toISOString();
 result.remaining=Object.keys(db.teams).filter(id=>!manifest.teams[id]?.curatedLocal&&!(db.teams[id].logo||db.teams[id].png));
 onProgress(result);return result;
}
