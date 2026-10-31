/* Partidos: selección por fecha de Perú y presentación compartida. */
(()=>{'use strict';
 const dates=()=>globalThis.CANCHA_DATES,db=()=>globalThis.CANCHA_DB||{teams:{},leagues:[]};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function dayKey(value){const n=dates().normalize(value);return !n?null:n.length===10?n:dates().dayInPeru(new Date(n));}
 const onDay=(events,day)=>events.filter(m=>m.home&&m.away&&m.home!==m.away&&dayKey(m.date)===day);
 function accepts(m,filter,now=new Date()){return filter==='todos'||(filter==='vivo'?m.status==='EN VIVO'&&!m.stale:filter==='resultados'?m.status==='FINAL':dates().upcoming(m,now));}
 function featured(events,now=new Date()){
  const sorted=events.slice().sort(dates().compare);
  return sorted.find(m=>m.status==='EN VIVO'&&!m.stale)||sorted.find(m=>dates().upcoming(m,now))||sorted.filter(m=>m.status==='FINAL').at(-1)||null;
 }
 function href(m,lid){return m.provider==='Catalogo'?`#/encuentro/${encodeURIComponent(m.id)}`:`#/evento/${encodeURIComponent(lid||m.league)}/${encodeURIComponent(m.provider||'SoccerData')}/${encodeURIComponent(m.id)}`;}
 function clock(value){const n=dates().normalize(value);return !n||n.length===10?'Por confirmar':new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(n));}
 function status(m,now=new Date()){if(m.stale)return 'Sin actualizar';return m.status==='EN VIVO'?(m.minute||'En vivo'):m.status==='FINAL'?'Final':m.status==='PROGRAMADO'?(dates().upcoming(m,now)?'Próximo':'Sin actualizar'):({APLAZADO:'Aplazado',CANCELADO:'Cancelado',SUSPENDIDO:'Suspendido'})[m.status]||'Sin confirmar';}
 function row(m,lid,{showDate=true}={}){
  const brand=globalThis.CANCHA_BRAND,icon=id=>db().teams[id]&&brand?brand.teamHTML(id):'',label=status(m),score=x=>Number.isInteger(x)?x:'–';
  const normalized=dates().normalize(m.date),day=showDate&&normalized?new Intl.DateTimeFormat('es-PE',{timeZone:normalized.length===10?'UTC':'America/Lima',day:'numeric',month:'short'}).format(new Date(normalized.length===10?normalized+'T12:00:00Z':normalized)):'';
  return `<a class="score-row m16-match ${m.status==='EN VIVO'&&!m.stale?'is-live':''}" href="${href(m,lid)}" aria-label="${esc(m.homeName)} ${score(m.hs)} a ${score(m.as)} ${esc(m.awayName)}. ${esc(dates().statusLabel(m))}"><span class="m16-when">${day?`<small>${esc(day)}</small>`:''}<time datetime="${esc(m.date)}">${esc(normalized?.length===10?'Sin hora':clock(m.date))}</time><span class="m16-match-state">${esc(label)}</span></span><span class="m16-club is-home"><span>${esc(m.homeName||db().teams[m.home]?.name)}</span>${icon(m.home)}</span><span class="m16-score"><b class="m16-home-score">${score(m.hs)}</b><span class="m16-dash">–</span><b class="m16-away-score">${score(m.as)}</b></span><span class="m16-club is-away">${icon(m.away)}<span>${esc(m.awayName||db().teams[m.away]?.name)}</span></span><span class="m16-row-arrow" aria-hidden="true">›</span></a>`;
 }
 globalThis.CANCHA_MATCHES={dayKey,onDay,accepts,featured,href,clock,status,row,esc};
})();
