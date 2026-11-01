/* Listas del club: fechas breves, filas legibles y páginas independientes. */
(()=>{'use strict';
 const D=()=>globalThis.CANCHA_DB||{teams:{},leagues:[]},dates=()=>globalThis.CANCHA_DATES,M=()=>globalThis.CANCHA_MATCHES;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shortNames={ucl:'Champions League',esp:'LaLiga',eng:'Premier League',per:'Liga 1 Perú',arg:'Liga Argentina',ita:'Serie A',fra:'Ligue 1',bra:'Brasileirão',mex:'Liga MX'};
 function partition(events,club,league='todos',now=new Date()){
  const seen=new Set(),matches=events.filter(m=>{
   if(!m.home||!m.away||m.home===m.away||![m.home,m.away].includes(club)||!dates().normalize(m.date)||(league!=='todos'&&m.league!==league))return false;
   const key=[m.league,m.provider,m.id].join(':');if(seen.has(key))return false;seen.add(key);return true;
  });
  return {next:matches.filter(m=>m.status==='EN VIVO'&&!m.stale||dates().upcoming(m,now)).sort((a,b)=>Number(b.status==='EN VIVO')-Number(a.status==='EN VIVO')||dates().compare(a,b)),results:matches.filter(m=>m.status==='FINAL').sort((a,b)=>dates().compare(b,a))};
 }
 function paginate(items,page=0,size=5){
  size=Math.max(1,Math.min(20,Number.isInteger(size)?size:5));const pages=Math.max(1,Math.ceil(items.length/size));
  page=Math.max(0,Math.min(pages-1,Number.isInteger(page)?page:0));
  return {items:items.slice(page*size,(page+1)*size),page,pages,total:items.length,start:items.length?page*size+1:0,end:Math.min(items.length,(page+1)*size)};
 }
 function outcome(m,club){
  if(m.status!=='FINAL'||!Number.isInteger(m.hs)||!Number.isInteger(m.as))return null;
  if(m.hs===m.as)return {key:'draw',label:'Empate'};
  return ((m.home===club?m.hs:m.as)>(m.home===club?m.as:m.hs))?{key:'win',label:'Ganó'}:{key:'loss',label:'Perdió'};
 }
 function briefDate(value){const n=dates().normalize(value);return n?new Intl.DateTimeFormat('es-PE',{timeZone:n.length===10?'UTC':'America/Lima',weekday:'short',day:'numeric',month:'short'}).format(new Date(n.length===10?n+'T12:00:00Z':n)):'Fecha por confirmar';}
 function row(m,club){
  const icon=id=>globalThis.CANCHA_BRAND?.teamHTML(id)||'',name=id=>D().teams[id]?.name||id;
  const home=m.homeName||name(m.home),away=m.awayName||name(m.away),league=D().leagues.find(l=>l.id===m.league),result=outcome(m,club),isFinal=m.status==='FINAL',live=m.status==='EN VIVO'&&!m.stale;
  const score=isFinal||live?`${Number.isInteger(m.hs)?m.hs:'–'} – ${Number.isInteger(m.as)?m.as:'–'}`:M().clock(m.date);
  const status=live?M().status(m):isFinal?(result?.label||'Final'):'Próximo';
  const aria=`${home} contra ${away}. ${briefDate(m.date)}. ${score}. ${status}${result?' · '+name(club):''}. ${league?.name||''}`;
  return `<a class="c-club-match ${live?'is-live':''}" href="${M().href(m,m.league)}" aria-label="${esc(aria)}"><span class="c-club-match-meta"><time datetime="${esc(m.date)}">${esc(briefDate(m.date))}</time><span class="c-club-match-league">${globalThis.CANCHA_BRAND?.leagueHTML(m.league)||''}${esc(shortNames[m.league]||league?.name||m.league)}</span></span><span class="c-club-match-teams"><span class="c-club-match-team is-home"><strong>${esc(home)}</strong>${icon(m.home)}</span><span class="c-club-match-score ${!isFinal&&!live&&dates().normalize(m.date)?.length===10?'is-tbd':''}" ${result?`data-outcome="${result.key}"`:''}><b>${esc(score)}</b><small>${esc(m.stale?'Sin actualizar':status)}</small></span><span class="c-club-match-team is-away">${icon(m.away)}<strong>${esc(away)}</strong></span></span><span class="c-club-match-arrow" aria-hidden="true">›</span></a>`;
 }
 function navigation(p,kind){return p.pages<=1?'':`<nav class="c-club-pagination" aria-label="Páginas de ${kind==='next'?'próximos partidos':'resultados'}"><button type="button" data-club-page="${kind}" data-club-index="${p.page-1}" ${p.page===0?'disabled':''}>← Anteriores</button><span>${p.start}–${p.end} de ${p.total}</span><button type="button" data-club-page="${kind}" data-club-index="${p.page+1}" ${p.page===p.pages-1?'disabled':''}>Siguientes →</button></nav>`;}
 globalThis.CANCHA_CLUB_MATCHES={partition,paginate,outcome,briefDate,row,navigation};
})();
