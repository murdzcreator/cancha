/* Calendario general: un rango explícito y 24 encuentros por página. */
(()=>{'use strict';
 const V=globalThis.CANCHA_VIEW,E=V.escape,D=()=>globalThis.CANCHA_DB;
 const displayDay=day=>new Intl.DateTimeFormat('es-PE',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(new Date(day+'T12:00:00Z'));
 const state={mode:'today',selected:'',league:'todos',team:'',filter:'todos',page:0,events:[],datasets:[],token:0,lastHash:'',dataKey:'',loading:false,failed:0,loadedAt:0};
 function shell(filter){
  if(state.lastHash!==location.hash){const q=new URLSearchParams(location.hash.split('?')[1]||'');if(q.has('liga')&&D().leagues.some(l=>l.id===q.get('liga')))state.league=q.get('liga');if(q.has('fecha')&&globalThis.CANCHA_DATES.normalize(q.get('fecha'))===q.get('fecha')){state.mode='custom';state.selected=q.get('fecha')}state.lastHash=location.hash}
  state.filter=filter;const r=V.range(state.mode,state.selected);
  return `<div class="c-calendar-ranges" role="group" aria-label="Rango del calendario">${[['today','Hoy'],['tomorrow','Mañana'],['week','Próximos 7 días']].map(([id,label])=>`<button type="button" data-calendar-range="${id}" aria-pressed="${state.mode===id}">${label}</button>`).join('')}<label>Elegir fecha<input type="date" id="c-calendar-date" value="${r.from}"></label></div><details class="c-calendar-secondary" ${window.matchMedia('(min-width:601px)').matches?'open':''}><summary>Filtrar por competición y equipo</summary><div class="c-calendar-filters"><label>Competición<select id="c-calendar-league"><option value="todos">Todas las competiciones</option>${D().leagues.map(l=>`<option value="${l.id}" ${state.league===l.id?'selected':''}>${E(l.name)}</option>`).join('')}</select></label><label>Equipo<select id="c-calendar-team"><option value="">Todos los equipos</option>${Object.values(D().teams).filter(t=>state.league==='todos'||t.leagues.includes(state.league)).sort((a,b)=>a.name.localeCompare(b.name,'es')).map(t=>`<option value="${t.id}" ${state.team===t.id?'selected':''}>${E(t.name)}</option>`).join('')}</select></label></div></details><p id="c-calendar-status" class="c-calendar-status" role="status">Consultando el rango…</p><div id="c-calendar-results"></div>`;
 }
 function render(){
  const el=document.getElementById('c-calendar-results');if(!el)return;const r=V.range(state.mode,state.selected),M=globalThis.CANCHA_MATCHES;
  const events=state.events.filter(m=>(!state.team||m.home===state.team||m.away===state.team)&&M.dayKey(m.date)>=r.from&&M.dayKey(m.date)<=r.to&&M.accepts(m,state.filter)).sort(globalThis.CANCHA_DATES.compare),p=V.page(events,state.page,24);state.page=p.index;
  const groups=new Map();for(const m of p.items){const day=M.dayKey(m.date);if(!groups.has(day))groups.set(day,new Map());const leagues=groups.get(day);if(!leagues.has(m.league))leagues.set(m.league,[]);leagues.get(m.league).push(m)}
  const failures=state.failed;
  document.getElementById('c-calendar-status').textContent=`${r.from===r.to?displayDay(r.from):displayDay(r.from)+' al '+displayDay(r.to)} · ${events.length} encuentros · hora de Perú${state.loading?' · Consultando…':''}${failures?' · '+failures+' fuentes sin respuesta':''}`;
  el.setAttribute('aria-busy',String(state.loading));
  document.querySelectorAll('[data-calendar-range]').forEach(b=>b.setAttribute('aria-pressed',String(state.mode===b.dataset.calendarRange)));
  el.innerHTML=V.pagination(p,'calendar')+[...groups].map(([day,leagues])=>`<section class="c-calendar-day"><h2>${E(new Intl.DateTimeFormat('es-PE',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'}).format(new Date(day+'T12:00:00Z')))}</h2>${[...leagues].map(([lid,rows])=>`<section class="panel m16-day-league"><div class="m16-league-heading"><a href="#/liga/${lid}">${globalThis.CANCHA_BRAND.leagueHTML(lid)}<h3>${E(D().leagues.find(l=>l.id===lid)?.name)}</h3></a><span>${rows.length} partidos</span></div>${rows.map(m=>M.row(m,lid,{showDate:false})).join('')}</section>`).join('')}</section>`).join('')+(!events.length?(state.loading?'<p class="v11-loading">Consultando partidos de este rango…</p>':`<p class="c-directory-empty">${failures&&!state.datasets.length?'No se pudo consultar el calendario. Vuelve a elegir la fecha para reintentar.':'No hay partidos publicados con este rango y estos filtros. Prueba otra fecha o competición.'}</p>`):'')+V.pagination(p,'calendar')+`<details class="c-calendar-sources"><summary>Fuentes y cobertura del rango</summary>${state.datasets.map(d=>`<p><b>${E(D().leagues.find(l=>l.id===d.league)?.name)}</b> · ${E(d.source)} · ${E(d.updatedAt?globalThis.CANCHA_DATES.format(d.updatedAt):'Sin actualización verificable')}${d.stale?' · Sin actualizar':''}</p>`).join('')}<p>Los encuentros y sus horarios dependen de lo publicado por las fuentes. Una fecha sin hora conserva su día civil.</p></details>`;
 }
 async function mount(){
  if(!document.getElementById('c-calendar-results'))return;const mark=++state.token,r=V.range(state.mode,state.selected),selected=D().leagues.filter(l=>state.league==='todos'||l.id===state.league);
  const key=[state.league,r.from,r.to].join(':');if(state.dataKey!==key){state.dataKey=key;state.events=[];state.datasets=[];state.failed=0;}
  if(state.loadedAt&&Date.now()-state.loadedAt>90000){state.datasets=state.datasets.map(d=>({...d,stale:true}));state.events=state.events.map(m=>({...m,stale:true}));}
  const input=document.getElementById('c-calendar-date');if(input)input.value=r.from;state.loading=true;render();
  const previous=new Map(state.datasets.map(d=>[d.league,d]));
  const loaded=await Promise.allSettled(selected.map(async l=>{
   const q=new URLSearchParams({league:l.id,...(r.from===r.to?{date:r.from}:{from:r.from,to:r.to})});const res=await fetch('/api/fixtures?'+q,{signal:AbortSignal.timeout(30000)}),d=await res.json();if(!res.ok)throw Error('Sin respuesta');return {...d,league:l.id};
  }));
  if(mark!==state.token||!document.getElementById('c-calendar-results'))return;state.loading=false;state.loadedAt=Date.now();state.failed=loaded.filter(x=>x.status==='rejected').length;
  state.datasets=loaded.flatMap((x,i)=>x.status==='fulfilled'?[x.value]:previous.has(selected[i].id)?[{...previous.get(selected[i].id),stale:true}]:[]);
  const seen=new Set();state.events=state.datasets.flatMap(d=>(d.events||[]).map(m=>({...m,league:d.league,stale:!!d.stale||d.cache?.state==='stale'}))).filter(m=>{const k=m.league+':'+m.provider+':'+m.id;if(seen.has(k))return false;seen.add(k);return true});render();
 }
 document.addEventListener('click',e=>{
  const range=e.target.closest('[data-calendar-range]');if(range){state.mode=range.dataset.calendarRange;state.page=0;const r=V.range(state.mode,state.selected);document.getElementById('c-calendar-date').value=r.from;mount();return}
  const p=e.target.closest('[data-view-page="calendar"]');if(p&&!p.disabled){state.page=Number(p.dataset.pageIndex);render()}
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='c-calendar-date'){state.selected=e.target.value;state.mode=state.selected?'custom':'today';state.page=0;mount()}
  if(e.target.id==='c-calendar-league'){state.league=e.target.value;state.team='';state.page=0;state.events=[];globalThis.CANCHA_REDRAW()}
  if(e.target.id==='c-calendar-team'){state.team=e.target.value;state.page=0;render()}
 });
 window.addEventListener('hashchange',()=>{state.token++});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&document.getElementById('c-calendar-results'))mount()});globalThis.CANCHA_CALENDAR={shell,mount};
})();
