/* Frecuencias compartidas por navegador y servidor; los tiempos son de consulta. */
(()=>{'use strict';
 const LIVE=10000,PRE=30000,FAR=60000;
 function interval(match,now=Date.now()){
  if(match?.status==='EN VIVO')return LIVE;
  if(match?.status==='FINAL'&&!match.stale&&match.cache?.state!=='stale')return 0;
  const start=Date.parse(match?.date||'');
  if(match?.status==='PROGRAMADO'&&Number.isFinite(start)&&(start-now>30*60000||now-start>6*3600000))return FAR;
  return PRE;
 }
 function ttl(match,now=Date.now()){
  if(match?.stale||match?.cache?.state==='stale')return 5000;
  if(match?.status==='FINAL')return 300000;
  const ms=interval(match,now);return ms===LIVE?5000:ms===FAR?45000:20000;
 }
 function eventsInterval(events=[]){return events.some(m=>m.status==='EN VIVO')?LIVE:PRE;}
 globalThis.CANCHA_LIVE_POLICY={LIVE,PRE,FAR,interval,ttl,eventsInterval};
})();
