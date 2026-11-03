/* competition-ui.js */
/* Clasificación actual, zonas publicadas, forma y contexto de la jornada. */
(()=>{'use strict';
 const D=()=>globalThis.CANCHA_DB,E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),data=new Map();
 const zones=new Set(['champions','champions-qualifier','europa','conference','libertadores','sudamericana','relegation','relegation-playoff','promotion','promotion-playoff','ucl-playoff','eliminated']);
 let current=null,token=0,dialog=null,observer=null,metric='goals';
 function zone(row,lid){
  if(zones.has(row.zone?.key))return row.zone;
  if(lid==='ucl'&&Number.isInteger(row.position)&&row.position>=1&&row.position<=36)return row.position<=8?{key:'champions',label:'1–8 · Octavos de final'}:row.position<=24?{key:'ucl-playoff',label:'9–24 · Eliminatoria previa'}:{key:'eliminated',label:'25–36 · Fuera de clasificación'};
  return null;
 }
 function phase(lid,label){
  const l=D().leagues.find(x=>x.id===lid),text=String(label||'General');
  if(/clausura/i.test(text))return 'Clausura · '+l.season;
  if(/apertura/i.test(text))return 'Apertura · '+l.season;
  if(/fase de liga|league phase/i.test(text))return 'Fase de liga · '+l.season;
  if(/regular season/i.test(text))return 'Fase regular · '+l.season;
  if(/grupo|group/i.test(text))return text+' · '+l.season;
  return 'Temporada '+l.season;
 }
 function legend(rows,lid,ranked){
  const available=[...new Map((ranked?rows:[]).map(r=>zone(r,lid)).filter(Boolean).map(z=>[z.key,z])).values()];
  return `<div class="c-table-legend" aria-label="Leyenda de posiciones">${available.length?available.map(z=>`<span><i class="c-zone c-zone--${z.key}" aria-hidden="true"></i>${E(z.label)}</span>`).join(''):'<span>Las zonas de esta fase no están publicadas en los datos disponibles.</span>'}</div><p class="c-table-footnote">Orden y desempates de la clasificación publicada. Las plazas pueden cambiar según las reglas y resoluciones de cada competición.</p>`;
 }
 function form(team,lid){
  const d=data.get(lid);if(!d)return '<span class="c-form-pending" aria-label="Consultando últimos resultados">…</span>';
  const rows=d.forms?.[team]||[];if(!rows.length)return d.resultsReady?'<span class="c-form-missing">Sin resultados</span>':'<span class="c-form-pending" aria-label="Consultando resultados">…</span>';
  return `<span class="c-form-list">${rows.map((m,i)=>`<button type="button" class="c-form-result c-form-${m.result}" data-form-team="${E(team)}" data-form-league="${E(lid)}" data-form-index="${i}" aria-label="${E(({V:'Victoria',E:'Empate',D:'Derrota'})[m.result]+' · '+m.homeName+' '+m.hs+'–'+m.as+' '+m.awayName)}" title="${E(m.homeName+' '+m.hs+'–'+m.as+' '+m.awayName)}">${m.result}</button>`).join('')}${rows.length<5?`<small title="Resultados disponibles">${rows.length}/5</small>`:''}</span>`;
 }
 function formCoverage(lid){const d=data.get(lid);if(!d)return 'Consultando resultados de esta competición…';const c=d.coverage;if(!d.resultsReady)return 'Completando racha de la competición…';return `Racha de esta competición · ${c.clubs}/${c.expectedClubs} clubes con resultados en el archivo${d.stale||d.cache?.state==='stale'?' · Copia pendiente de actualizar':''}`;}
 function rankings(d){
  const a=d.analytics,labels=[['goals','Goleadores'],['assists','Asistencias'],['yellow','Amarillas'],['red','Rojas']];
  return `<div class="c-rankings-heading"><div><h2>Líderes de los partidos analizados</h2><p>Muestra de ${a.coverage.details} actas · no equivale al ranking completo de temporada</p></div><button type="button" class="btn btn-outline" data-competition-enrich>Ampliar estadísticas</button></div><div class="c-rank-metrics" role="group" aria-label="Estadística del ranking">${labels.map(([field,label])=>`<button type="button" data-mini-metric="${field}" aria-pressed="${metric===field}">${label}</button>`).join('')}</div><div class="c-mini-rankings">${labels.map(([field,label])=>{
   const rows=a.players.filter(p=>p[field]>0).sort((x,y)=>y[field]-x[field]||x.name.localeCompare(y.name)).slice(0,5);
   return `<section class="panel" data-rank-panel="${field}" data-active="${metric===field}"><div class="panel-title">${label}</div>${rows.length?rows.map(p=>`<a class="c-mini-leader" href="#/perfil/${encodeURIComponent(p.team)}/${encodeURIComponent(p.id)}">${globalThis.CANCHA_BRAND.teamHTML(p.team)}<span><strong>${E(p.name)}</strong><small>${E(D().teams[p.team]?.name)} · ${p.known[field]||0} ${p.known[field]===1?'partido':'partidos'} con dato</small></span><b>${p[field]}</b></a>`).join(''):`<p class="c-mini-empty">${a.coverage.details?'Sin cifras publicadas para esta métrica en las actas analizadas.':'Consulta actas disponibles para ver esta clasificación.'}</p>`}<button class="c-mini-more" type="button" data-league-tab="lideres" data-league-metric="${field}">Ver más →</button></section>`;
  }).join('')}</div><p class="c-competition-message" role="status"></p>`;
 }
 function contextShell(lid){return `<section class="panel c-round-panel" data-competition-context="${E(lid)}"><div class="panel-title">Partidos de la jornada</div><div class="c-round-controls"><button type="button" data-round-shift="-1" aria-label="Día anterior">‹</button><label><span class="sr-only">Fecha de los partidos de la competición</span><input type="date" id="c-round-date" value="${globalThis.CANCHA_DATES.dayInPeru()}"></label><button type="button" data-round-shift="1" aria-label="Día siguiente">›</button></div><p class="c-round-note">Hora de Perú · la tabla muestra la clasificación actual</p><div id="c-round-matches" role="status">Consultando partidos…</div></section>`;}
 function renderRound(){
  const el=document.getElementById('c-round-matches');if(!el||!current)return;
  const ordered=(current.events||[]).slice().sort(globalThis.CANCHA_DATES.compare),rows=globalThis.CANCHA_MATCHES.onDay(ordered,current.day).map(m=>current.roundFailed?{...m,stale:true}:m);
  const next=ordered.find(m=>globalThis.CANCHA_DATES.upcoming(m)&&globalThis.CANCHA_MATCHES.dayKey(m.date)>current.day);
  el.innerHTML=rows.length?rows.slice(0,10).map(m=>`<a class="c-round-match" href="${globalThis.CANCHA_MATCHES.href(m,current.league)}"><small>${E(m.date.length===10?'Por confirmar':globalThis.CANCHA_MATCHES.clock(m.date))} · ${E(globalThis.CANCHA_MATCHES.status(m))}</small><span>${globalThis.CANCHA_BRAND.teamHTML(m.home)}<strong>${E(m.homeName)}</strong><b>${E(m.hs??'–')}</b></span><span>${globalThis.CANCHA_BRAND.teamHTML(m.away)}<strong>${E(m.awayName)}</strong><b>${E(m.as??'–')}</b></span></a>`).join(''):`<p class="c-mini-empty">${current.roundLoading?'Consultando esta fecha…':current.roundFailed?'La fuente no respondió para esta fecha.':'No hay partidos publicados para esta fecha.'}</p>`+(next?`<button type="button" class="c-mini-more" data-round-day="${globalThis.CANCHA_MATCHES.dayKey(next.date)}">Ir a la próxima fecha →</button>`:'');
  if(current.roundFailed&&rows.length)el.innerHTML+='<p class="c-mini-empty">No se pudo actualizar esta fecha. Se conserva la última consulta.</p>';
  el.innerHTML+='<button type="button" class="c-mini-more" data-league-tab="calendario">Ver calendario →</button>';
 }
 const json=url=>globalThis.CANCHA_API.get(url);
 function apply(lid,d,mark){
  if(mark!==token||!document.querySelector(`[data-competition-context="${lid}"]`))return false;
  data.set(lid,d);const selected=current;current={...d,league:lid,day:selected.day,dayEvents:selected.dayEvents,roundLoading:selected.roundLoading,roundFailed:selected.roundFailed??!!d.stale,events:[...new Map([...(d.events||[]),...(selected.dayEvents||[])].map(m=>[m.provider+':'+m.id,m])).values()]};
  document.dispatchEvent(new CustomEvent('cancha:competition',{detail:{league:lid}}));renderRound();return true;
 }
 async function loadRanks(lid,mark){
  const ranks=document.getElementById('c-competition-rankings');if(!ranks)return;
  try{const d=await json('/api/competition?league='+lid+'&view=rankings');if(apply(lid,d,mark)&&ranks.isConnected)globalThis.CANCHA_UI.patch(ranks,rankings(d));}
  catch{if(mark===token&&ranks.isConnected)ranks.innerHTML='<p class="c-mini-empty">La muestra no pudo actualizarse. <button type="button" class="btn btn-outline" data-ranks-retry>Reintentar</button></p>';}
 }
 async function load(lid){
  const mark=++token;observer?.disconnect();if(!document.querySelector('[data-competition-context]'))return;
  current={league:lid,day:globalThis.CANCHA_DATES.dayInPeru(),events:data.get(lid)?.events||[],dayEvents:[]};
  try{apply(lid,await json('/api/competition?league='+lid),mark)}catch{if(mark===token){const el=document.getElementById('c-round-matches');if(el)el.innerHTML='<p class="c-mini-empty">No se pudo actualizar la jornada.</p>';}}
  if(mark!==token)return;
  // La racha se completa después de la primera vista; las actas esperan al bloque de rankings.
  json('/api/competition?league='+lid+'&view=results').then(d=>apply(lid,d,mark)).catch(()=>{});
  const ranks=document.getElementById('c-competition-rankings');if(!ranks)return;
  ranks.innerHTML='<p class="c-mini-empty">Los rankings se consultan al llegar a esta sección.</p>';
  observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();loadRanks(lid,mark)}},{rootMargin:'120px'});observer.observe(ranks);
 }

 function showForm(button){
  const d=data.get(button.dataset.formLeague),m=d?.forms?.[button.dataset.formTeam]?.[Number(button.dataset.formIndex)];if(!m)return;
  if(!dialog){dialog=document.createElement('dialog');dialog.className='c-form-dialog';dialog.setAttribute('aria-labelledby','c-form-dialog-title');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-form-close]'))dialog.close()});}
  dialog.innerHTML=`<div class="c-form-dialog-heading"><h2 id="c-form-dialog-title">Resultado del partido</h2><button type="button" data-form-close aria-label="Cerrar">×</button></div><p>${E(globalThis.CANCHA_DATES.format(m.date))}</p><div class="c-form-dialog-clubs">${globalThis.CANCHA_BRAND.teamHTML(m.home)}<span>${E(m.homeName)}<b>${m.hs} – ${m.as}</b>${E(m.awayName)}</span>${globalThis.CANCHA_BRAND.teamHTML(m.away)}</div><p>${E(m.provider)} · resultado disponible en el archivo</p><a class="btn" data-form-close href="${globalThis.CANCHA_MATCHES.href(m,button.dataset.formLeague)}">Abrir partido →</a>`;dialog.showModal();
 }
 document.addEventListener('click',async e=>{
  const field=e.target.closest('[data-mini-metric]');if(field){metric=field.dataset.miniMetric;document.querySelectorAll('[data-mini-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.miniMetric===metric)));document.querySelectorAll('[data-rank-panel]').forEach(p=>p.dataset.active=String(p.dataset.rankPanel===metric));return}
  if(e.target.closest('[data-ranks-retry]')&&current){loadRanks(current.league,token);return}
  const formButton=e.target.closest('[data-form-team]');if(formButton){showForm(formButton);return}
  const shift=e.target.closest('[data-round-shift]'),day=e.target.closest('[data-round-day]');
  if((shift||day)&&current){const value=day?.dataset.roundDay||new Date(Date.parse(current.day+'T12:00:00Z')+Number(shift.dataset.roundShift)*864e5).toISOString().slice(0,10);selectDay(value);return}
  const enrich=e.target.closest('[data-competition-enrich]');if(enrich&&current){const lid=current.league;enrich.disabled=true;const msg=document.querySelector('.c-competition-message');if(msg)msg.textContent='Consultando actas disponibles…';try{await json('/api/enrich?league='+lid);const fresh=await json('/api/competition?league='+lid+'&view=rankings');const analytics=fresh.analytics,d=data.get(lid);if(d&&current?.league===lid&&document.getElementById('c-competition-rankings')){d.analytics=analytics;document.getElementById('c-competition-rankings').innerHTML=rankings(d)}}catch{if(msg)msg.textContent='No se pudo ampliar la muestra. Se conservan las actas disponibles.'}finally{if(enrich.isConnected)enrich.disabled=false}}
 });
 async function selectDay(day){
  if(!current)return;const input=document.getElementById('c-round-date');if(day.length!==10||globalThis.CANCHA_DATES.normalize(day)!==day){if(input)input.value=current.day;return}
  const lid=current.league,mark=token;if(current.day!==day)current.roundFailed=false;current.day=day;current.roundLoading=true;if(input)input.value=day;renderRound();
  try{const d=await json('/api/fixtures?league='+lid+'&date='+day);if(mark===token&&current?.league===lid&&current.day===day){const existing=new Map(current.events.map(m=>[m.provider+':'+m.id,m]));for(const m of d.events||[])existing.set(m.provider+':'+m.id,m);current.dayEvents=d.events||[];current.events=[...existing.values()];current.roundLoading=false;current.roundFailed=!!d.stale||d.cache?.state==='stale';renderRound()}}
  catch{if(mark===token&&current?.league===lid&&current.day===day){current.roundLoading=false;current.roundFailed=true;renderRound()}}
 }
 document.addEventListener('change',e=>{if(e.target.id==='c-round-date')selectDay(e.target.value)});
 window.addEventListener('hashchange',()=>{token++;observer?.disconnect();dialog?.close()});
 globalThis.CANCHA_COMPETITION={data,zone,phase,legend,form,formCoverage,contextShell,load,refreshDay:()=>{if(current&&document.querySelector('[data-competition-context]'))return selectDay(current.day)}};
})();
