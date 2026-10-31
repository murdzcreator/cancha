/* Fechas civiles sin zona; instantes con zona explícita. Presentación en Perú. */
(()=>{
 const DATE=/^\d{4}-\d{2}-\d{2}$/;
 function normalize(value){
  if(typeof value!=='string')return null;
  const day=value.slice(0,10);
  if(!DATE.test(day))return null;
  const civil=new Date(day+'T00:00:00Z');
  if(!Number.isFinite(+civil)||civil.toISOString().slice(0,10)!==day)return null;
  if(DATE.test(value))return value;
  // Una hora sin offset no permite convertir de forma fiable a la hora de Perú.
  if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value))return null;
  const d=new Date(value);return Number.isFinite(+d)?d.toISOString():null;
 }
 function format(value,{long=false}={}){
  const normalized=normalize(value);if(!normalized)return 'Fecha por confirmar';
  const dayOnly=DATE.test(normalized);
  return new Intl.DateTimeFormat('es-PE',{timeZone:dayOnly?'UTC':'America/Lima',day:'2-digit',month:long?'long':'short',year:'numeric',...(!dayOnly?{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}:{})}).format(new Date(dayOnly?normalized+'T12:00:00Z':normalized))+(dayOnly?' · hora por confirmar':' · Perú');
 }
 const time=value=>{const n=normalize(value);return n?Date.parse(n.length===10?n+'T12:00:00Z':n):Infinity};
 const compare=(a,b)=>time(a.date)-time(b.date);
 const dayInPeru=(now=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 function upcoming(m,now=new Date()){
  if(m.status!=='PROGRAMADO')return false;
  const n=normalize(m.date);return !!n&&(n.length===10?n>=dayInPeru(now):time(n)>=+now);
 }
 function nearby(matches,limit=8,now=new Date()){
  const next=matches.filter(m=>upcoming(m,now)).sort(compare);
  const previous=matches.filter(m=>m.status==='FINAL').sort((a,b)=>compare(b,a));
  // Reserva lugar para resultados recientes y próximos; nunca rellena con programados vencidos.
  const recentCount=Math.min(previous.length,Math.floor(limit/2));
  const selectedNext=next.slice(0,limit-recentCount);
  return {next:selectedNext,previous:previous.slice(0,limit-selectedNext.length)};
 }
 const statusLabel=(m,now=new Date())=>m.status==='PROGRAMADO'&&!upcoming(m,now)?'Horario vencido · estado sin actualizar':m.status==='EN VIVO'&&m.minute?'EN VIVO · '+m.minute:m.status||'SIN CONFIRMAR';
 globalThis.CANCHA_DATES={statusLabel,normalize,format,time,compare,upcoming,nearby,dayInPeru};
})();
