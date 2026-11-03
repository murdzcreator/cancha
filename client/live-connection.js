/* Avisos por SSE y consultas de respaldo. Se pausa al ocultar o abandonar la ficha. */
(()=>{'use strict';
 const P=globalThis.CANCHA_LIVE_POLICY;
 function watchMatch(league,id,{data:receive,sync:syncReceive=()=>{},error:onError=()=>{}}){
  const q=new URLSearchParams({league,id}),detail='/api/match-detail?'+q+'&source=ESPN';
  let stream=null,poll=null,pollMs=0,last=null,closed=false,done=false,connected=false,inflight=false,epoch=0,requestEpoch=0,errors=0,rotation=false,rotationTimer=null;
  const clearPoll=()=>{if(poll)clearInterval(poll);poll=null;pollMs=0;};
  function stopTransport(){epoch++;requestEpoch++;connected=false;stream?.close();stream=null;clearPoll();clearTimeout(rotationTimer);rotationTimer=null;}
  function polling(ms){if(closed||done||document.hidden||pollMs===ms)return;clearPoll();pollMs=ms;poll=setInterval(()=>fetchOnce(),ms);}
  function accept(next){last=next;done=P.interval(next)===0;receive(next);if(next.sync)syncReceive(next.sync);if(done)stopTransport();else if(!connected)polling(P.interval(next));}
  async function fetchOnce(){
   if(closed||done||document.hidden||connected||inflight)return;inflight=true;const mark=epoch,request=++requestEpoch;
   try{const next=await globalThis.CANCHA_API.get(detail,{timeout:15000});if(!closed&&mark===epoch&&request===requestEpoch)accept(next)}
   catch(error){if(!closed&&mark===epoch&&request===requestEpoch){onError(error.message);polling(Math.min(60000,Math.max(P.interval(last)||P.LIVE,20000)))}}
   finally{inflight=false;}
  }
  function start(){
   if(closed||done||document.hidden)return;epoch++;const mark=epoch;
   if(typeof EventSource!=='function'){polling(P.interval(last)||P.LIVE);fetchOnce();return}
   try{
    const source=new EventSource('/api/match-stream?'+q);stream=source;
    source.onopen=()=>{if(closed||mark!==epoch)return;connected=true;requestEpoch++;errors=0;rotation=false;clearTimeout(rotationTimer);clearPoll();};
    source.addEventListener('match',event=>{if(closed||mark!==epoch)return;try{requestEpoch++;accept(JSON.parse(event.data))}catch{onError('Respuesta de seguimiento no válida')}});
    source.addEventListener('sync',event=>{if(closed||mark!==epoch)return;try{syncReceive(JSON.parse(event.data))}catch{}});
    source.addEventListener('warning',event=>{if(closed||mark!==epoch)return;let message='No se pudo actualizar la fuente';try{message=JSON.parse(event.data).message||message}catch{}onError(message);});
    source.addEventListener('complete',()=>{if(!closed&&mark===epoch){done=true;stopTransport()}});
    source.addEventListener('reconnect',()=>{rotation=true;});
    source.onerror=()=>{
     if(closed||done||mark!==epoch)return;connected=false;errors++;
     if(rotation){rotation=false;rotationTimer=setTimeout(()=>{if(!connected&&!closed){polling(P.interval(last)||P.LIVE);fetchOnce()}},3000);return}
     onError('Reconectando. Se conserva la última respuesta con su fecha.');polling(P.interval(last)||P.LIVE);fetchOnce();
     if(errors>=3){source.close();if(stream===source)stream=null;}
    };
   }catch{polling(P.interval(last)||P.LIVE);fetchOnce();}
  }
  function visibility(){if(document.hidden)stopTransport();else if(!done){stopTransport();start()}}
  document.addEventListener('visibilitychange',visibility);start();
  return ()=>{closed=true;stopTransport();document.removeEventListener('visibilitychange',visibility)};
 }
 globalThis.CANCHA_SYNC={watchMatch};
})();
