/** Biblioteca de escudos de CANCHA. Solo se descargan archivos cuya licencia
 * de Wikimedia Commons permita la reutilización (aun así las marcas registradas
 * requieren evaluación independiente). No se extraen bibliotecas de ELNINE. */
import fs from 'node:fs';
import path from 'node:path';
import {promises as fsp} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';

const USER_AGENT='CANCHA-Auditoria-Emblemas/12.1 (proyecto educativo; https://example.org/cancha; contacto: uso local)';
const WD='https://www.wikidata.org/w/api.php';
const COMMONS='https://commons.wikimedia.org/w/api.php';
const allowedHosts=new Set(['upload.wikimedia.org']);
const EXT=/\.(svg|png)$/i;
const LICENSE=/\b(CC[- ]BY(?:[- ]SA)?[- ]?[234]?\.?(?:0)?|CC0|PUBLIC DOMAIN|PUBLIC-DOMAIN|PD[- ]|PD$)\b/i;
const INCOMPAT=/\b(NC|ND|NO DERIVATIVES|NONCOMMERCI|FAIR USE|UNKNOWN|COPYRIGHTED)\b/i;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(fc|cf|ac|sc|club|de|del|el|la|atletico|football|futbol|soccer|association|sporting|sport|club deportivo)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const stripHtml=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,' ').trim().slice(0,180);
const manual={
 'alianza-lima':'Escudo Alianza Lima.svg',
 'universitario':'Escudo del Club Universitario de Deportes.svg',
 'sporting-cristal':'Escudo Sporting Cristal.svg',
 'sport-boys':'Sport Boys.svg',
 'utc-cajamarca':'UTC Cajamarca.svg',
 'paris-saint-germain':'Paris Saint-Germain F.C. logo (free version).svg'
};
const makeUrl=(base,params)=>base+'?'+new URLSearchParams({...params,format:'json',origin:'*'});
async function get(url,{timeout=18000,maxSize=4_000_000}={}){
 const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),timeout);
 try{let r=await fetch(url,{signal:ctl.signal,headers:{'User-Agent':USER_AGENT,'Accept':'application/json,image/svg+xml,image/png'}});
 if(!r.ok)throw Error(`HTTP ${r.status}`);
 const len=Number(r.headers.get('content-length')||0);if(len>maxSize)throw Error('Archivo demasiado grande');
 const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>maxSize)throw Error('Archivo demasiado grande');return bytes;
 }finally{clearTimeout(timer)}
}
async function json(url){let bytes=await get(url,{maxSize:1_600_000});return JSON.parse(Buffer.from(bytes).toString('utf8'))}
function compatibleLicense(meta){const lic=stripHtml(meta?.LicenseShortName?.value||'');const url=meta?.LicenseUrl?.value||'';const usage=stripHtml(meta?.UsageTerms?.value||'');const name=[lic,usage].filter(Boolean).join(' ');
 if(!lic||INCOMPAT.test(name)||(!LICENSE.test(lic)&&!(/creativecommons\.org\/licenses\/by(?:-sa)?\//.test(url))&&!/creativecommons\.org\/publicdomain\//.test(url)))return null;
 return {label:lic,link:/^https:\/\//.test(url)?url:'',author:stripHtml(meta.Artist?.value||''),usage};
}
async function commonsFile(filename){
 const title='File:'+filename.replace(/^File:/,'');
 const api=makeUrl(COMMONS,{action:'query',prop:'imageinfo',iiprop:'url|mime|size|extmetadata',titles:title,iilimit:'1'});
 let pages=Object.values((await json(api)).query?.pages||{}),im=pages[0]?.imageinfo?.[0];
 if(!im||!EXT.test(filename))return null;
 const license=compatibleLicense(im.extmetadata);if(!license)return null;
 const u=new URL(im.url);if(u.protocol!=='https:'||!allowedHosts.has(u.host))return null;
 if(!['image/svg+xml','image/png'].includes(im.mime))return null;
 return {url:im.url,filename:filename.replace(/^File:/,''),filePage:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(filename.replace(/^File:/,'').replace(/ /g,'_')),license,mime:im.mime,size:im.size||0,source:'Wikimedia Commons'};
}
function matchName(q,hit){const name=norm(q),p=norm(hit.label),aliases=(hit.aliases||[]).map(norm);if(p===name||aliases.includes(name))return 4;
 const tokens=new Set(name.split(' ').filter(x=>x.length>2)),tokens2=new Set(p.split(' ').filter(x=>x.length>2));if(tokens.size&&tokens2.size){const c=[...tokens].filter(x=>tokens2.has(x)).length;if(c/Math.max(tokens.size,tokens2.size)>.78)return 3}
 return 0;
}
async function searchFile(team){
 const names=[team.name,...(team.aliases||[])];let all=[];
 for(const nm of names.slice(0,2)){
  const u=makeUrl(WD,{action:'wbsearchentities',language:'en',uselang:'en',search:nm,type:'item',limit:'8'});
  try{let d=await json(u);all.push(...(d.search||[]))}catch(e){throw e}
 }
 const candidates=all.map(x=>({...x,rank:matchName(team.name,x)})).filter(x=>x.rank>=3)
  .sort((a,b)=>b.rank-a.rank).slice(0,5);
 for(const c of candidates){
  if(!(/football|fútbol|soccer|sporting club|association football/i.test(c.description||'')))continue;
  const u=makeUrl(WD,{action:'wbgetentities',ids:c.id,props:'claims|labels',languages:'en'});
  let d=await json(u), claims=d.entities?.[c.id]?.claims||{};
  const images=(claims.P154||[]).map(x=>x.mainsnak?.datavalue?.value).filter(x=>typeof x==='string'&&EXT.test(x));
  for(const fn of images){let file=await commonsFile(fn);if(file)return {...file,qid:c.id,checked:'wikidata-label+descripción+Commons-licencia'}}
 }
 return null;
}
function validImage(bytes,ext){
 if(ext==='png')return bytes.length>100&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47;
 const s=Buffer.from(bytes).toString('utf8');return /<svg\b/i.test(s)&& !/<(?:script|foreignObject|iframe|object|embed)\b|\bon\w+\s*=|javascript:|data:text\/html/i.test(s)
}
export function summarizeBranding(db,manifest={}){
 let out={clubs:0,localVerified:0,onlineUnverified:0,noImage:0,competitions:db.leagues.length,leagueExternal:0};
 for(let [id,t]of Object.entries(db.teams)){out.clubs++;if(manifest.teams?.[id]?.local)out.localVerified++;else if(t.logo||t.png||t.fallback||manifest.teams?.[id]?.referenceUrl)out.onlineUnverified++;else out.noImage++}
 out.leagueExternal=db.leagues.filter(l=>l.logo?.svg||l.logo?.png).length;return out;
}
export function readBranding(root){try{return JSON.parse(fs.readFileSync(path.join(root,'assets','branding-manifest.json'),'utf8'))}catch{return {version:'12.1',teams:{},leagues:{},checkedAt:null}}}
export async function updateBranding({root,db,fetcher=null,onProgress=()=>{},delayMs=850,limit=Infinity,only=[],offline=false}={}){
 if(!root||!db)throw Error('Faltan ROOT y DB');const current=readBranding(root);current.teams||={};current.leagues||={};current.version='12.2';current.errors||={};
 const dir=path.join(root,'assets','escudos');await fsp.mkdir(dir,{recursive:true});
 const known=Object.entries(db.teams).filter(([id])=>!only.length||only.includes(id)).slice(0,limit);
 async function persist(m){
   await fsp.writeFile(path.join(root,'assets','branding-manifest.json'),JSON.stringify(m,null,2));
   await fsp.writeFile(path.join(root,'assets','branding-data.js'),'window.CANCHA_BRANDING_DATA='+JSON.stringify(m)+';\n');
 }
 let resolved=0,failed=0,kept=0;
 for(let i=0;i<known.length;i++){
  const [id,t]=known[i],have=current.teams[id];
  if(have?.local&&fs.existsSync(path.join(root,have.local))){kept++;continue}
  if(offline){failed++;continue}
  try{
   let result=manual[id]?await commonsFile(manual[id]):null;
   if(!result)result=await searchFile(t);
   if(!result){current.errors[id]='Sin escudo reutilizable confirmado en Commons';failed++;onProgress({i:i+1,total:known.length,id,status:'not-found'});await sleep(delayMs);continue}
   const ext=result.mime==='image/png'?'png':'svg';let binary=await get(result.url,{maxSize:2_000_000,timeout:22000});
   if(!validImage(binary,ext))throw Error('Archivo SVG/PNG inválido o contenido no permitido');
   const local=`assets/escudos/${id}.${ext}`;await fsp.writeFile(path.join(root,local),binary);
   current.teams[id]={...(current.teams[id]||{}),local,source:result.source,sourceUrl:result.filePage,originalUrl:result.url,license:result.license,verifiedAt:new Date().toISOString(),qid:result.qid||null,assetFilename:result.filename,attributionRequired:!/^(?:Public domain|PD|CC0)/i.test(result.license.label),reviewStatus:'pending'};
   delete current.errors[id];resolved++;onProgress({i:i+1,total:known.length,id,status:'resolved'});
  }catch(e){failed++;current.errors[id]=String(e?.message||e).slice(0,200);onProgress({i:i+1,total:known.length,id,status:'error',message:current.errors[id]});}
  if(i%5===0||i===known.length-1){current.checkedAt=new Date().toISOString();await persist(current)}
  await sleep(delayMs);
 }
 current.checkedAt=new Date().toISOString();await persist(current);
 return {resolved,failed,kept,coverage:summarizeBranding(db,current)};
}
export {compatibleLicense,validImage,manual};
