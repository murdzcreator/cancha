import '../live-policy.js';
const P=globalThis.CANCHA_LIVE_POLICY;
const signature=data=>JSON.stringify(data,(key,value)=>['updatedAt','observedAt','cache','sync'].includes(key)?undefined:value);

// Un seguimiento por partido; todos sus visitantes comparten consulta y temporizador.
export function createLiveChannel({load,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,maxRooms=64,maxListeners=1000}={}){
 const rooms=new Map();let total=0;
 const safeSend=(fn,packet)=>{try{fn(packet)}catch{}};
 function emit(room,packet){for(const fn of [...room.listeners])safeSend(fn,packet);}
 async function tick(room){
  if(room.closed||room.running)return;room.running=true;const started=now();let delay=P.LIVE;
  try{
   const data=await load(room.key);if(room.closed)return;room.failures=0;const next=signature(data),changed=next!==room.signature;
   room.data=data;room.signature=next;
   emit(room,changed?{type:'match',data}:{type:'sync',sync:data.sync});
   delay=P.interval(data,now());
   if(!delay){room.done=true;emit(room,{type:'complete',sync:data.sync});return;}
  }catch{
   if(room.closed)return;room.failures++;delay=Math.min(60000,P.LIVE*2**Math.min(room.failures-1,3));
   emit(room,{type:'warning',checkedAt:new Date(now()).toISOString(),message:'No se pudo actualizar. Se conserva la última respuesta con su fecha.',retrySeconds:delay/1000});
  }finally{
   room.running=false;if(!room.closed&&!room.done&&room.listeners.size)room.timer=setTimer(()=>tick(room),Math.max(250,delay-(now()-started)));
  }
 }
 function subscribe(key,listener){
  if(total>=maxListeners||!rooms.has(key)&&rooms.size>=maxRooms)throw Error('Seguimiento temporalmente ocupado');
  let room=rooms.get(key);if(!room){room={key,listeners:new Set(),data:null,signature:null,failures:0,timer:null,closed:false,running:false,done:false};rooms.set(key,room);}
  room.listeners.add(listener);total++;
  if(room.data)safeSend(listener,{type:'match',data:room.data});
  if(room.done)safeSend(listener,{type:'complete',sync:room.data?.sync});
  else if(!room.running&&!room.timer)tick(room);
  let subscribed=true;return ()=>{if(!subscribed)return;subscribed=false;room.listeners.delete(listener);total=Math.max(0,total-1);if(!room.listeners.size){room.closed=true;if(room.timer)clearTimer(room.timer);if(rooms.get(key)===room)rooms.delete(key);}};
 }
 function close(){for(const room of rooms.values()){room.closed=true;if(room.timer)clearTimer(room.timer);emit(room,{type:'shutdown'});}rooms.clear();total=0;}
 return {subscribe,close,status:()=>({rooms:rooms.size,listeners:total})};
}

export function serveMatchStream(req,res,channel,key,{heartbeatMs=20000,lifetimeMs=240000}={}){
 let ready=false,unsubscribe=null,heartbeat=null,lifetime=null,closed=false;const pending=[];
 function cleanup(){if(closed)return;closed=true;clearInterval(heartbeat);clearTimeout(lifetime);unsubscribe?.();}
 function send(packet){
  if(!ready){pending.push(packet);return}if(closed||res.destroyed)return;
  if(res.writableLength>256*1024){res.destroy();cleanup();return}
  if(packet.type==='shutdown'){res.end();cleanup();return}
  res.write('event: '+packet.type+'\ndata: '+JSON.stringify(packet.type==='match'?packet.data:packet.type==='sync'?packet.sync:packet)+'\n\n');
  if(packet.type==='complete'){res.end();cleanup();}
 }
 unsubscribe=channel.subscribe(key,send);
 res.on('close',cleanup);req.on('aborted',cleanup);
 res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'});
 res.flushHeaders();res.write('retry: 2000\n\n');ready=true;
 heartbeat=setInterval(()=>{if(!closed&&!res.destroyed)res.write(': keepalive\n\n')},heartbeatMs);
 // Renovar la conexión genera actividad entrante incluso en alojamientos gratuitos.
 lifetime=setTimeout(()=>{if(!closed){res.write('event: reconnect\ndata: {}\n\n');res.end();cleanup()}},lifetimeMs);
 for(const packet of pending)send(packet);
 return cleanup;
}
