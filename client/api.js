/* Consultas compartidas: una petición simultánea por URL, con plazo y errores comunes. */
(()=>{'use strict';
 const running=new Map();
 async function get(url,{signal,timeout=60000}={}){
  if(signal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
  if(!running.has(url)){
   const request=fetch(url,{signal:AbortSignal.timeout(timeout)}).then(async res=>{const data=await res.json();if(!res.ok)throw Error(data.detail||data.error||'La fuente no respondió');return data;}).finally(()=>running.delete(url));running.set(url,request);
  }
  const request=running.get(url);if(!signal)return request;
  return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Consulta cancelada','AbortError'));signal.addEventListener('abort',abort,{once:true});request.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});
 }
 globalThis.CANCHA_API={get};
})();
