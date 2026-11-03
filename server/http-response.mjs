import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
const zip=promisify(gzip),files=new Map();
const compressible=/^(text\/|application\/(json|javascript)|image\/svg)/;
export async function respond(req,res,status,body,headers={},cached=null){
 const raw=Buffer.isBuffer(body)?body:Buffer.from(body),encoding=req.headers['accept-encoding']||'';
 const accepts=encoding.split(',').some(v=>/^gzip(?:\s*;|\s*$)/i.test(v.trim())&&!/;\s*q=0(?:\.0*)?\s*$/i.test(v));
 const useGzip=raw.length>1024&&compressible.test(headers['Content-Type']||'')&&accepts;
 const payload=useGzip?(cached?.gzip||(cached?cached.gzip=await zip(raw):await zip(raw))):raw;
 if(res.destroyed)return;
 res.writeHead(status,{...headers,Vary:'Accept-Encoding',...(useGzip?{'Content-Encoding':'gzip'}:{}),'Content-Length':payload.length});res.end(payload);
}
export async function serveFile(req,res,file,type,html=false){
 const stat=await fs.stat(file);if(!stat.isFile())throw Error('No es un archivo');
 let entry=files.get(file);if(!entry||entry.time!==stat.mtimeMs){const raw=await fs.readFile(file);entry={raw,time:stat.mtimeMs,etag:'"'+createHash('sha256').update(raw).digest('base64url').slice(0,24)+'"'};
  if(raw.length<2*1024*1024){files.set(file,entry);if(files.size>128)files.delete(files.keys().next().value);}}
 const headers={'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':html?'no-store':'public, max-age=0, must-revalidate',ETag:entry.etag};
 if(!html&&req.headers['if-none-match']===entry.etag){res.writeHead(304,{...headers,Vary:'Accept-Encoding'});res.end();return}
 await respond(req,res,200,entry.raw,headers,entry);
}
