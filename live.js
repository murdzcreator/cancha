/* CANCHA V14: un único esquema de presentación, independentemente del proveedor. */
(()=>{'use strict';
 const db=window.CANCHA_DB;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safe=u=>/^https:\/\//.test(u||'')?esc(u):'';
 const team=id=>db.teams[id];
 const league=id=>db.leagues.find(l=>l.id===id);
 const date=s=>window.CANCHA_DATES.format(s);
 let healthLoaded=false;
 let routeGeneration=0,activeLeague=null,groups=[],groupSelected=0,activeStandings=null;
 let standingsDetailed=false,standingsSearch='';
 const fixturePages=new Map(),fixtureSnapshots=new Map();
 const status=()=>document.getElementById('v11-system-status');
 function headline(mark,info=''){
   healthLoaded=true;
   const el=status();if(el)el.innerHTML=`<a class="m16-source-link" href="#/fuentes" title="${esc(info||mark)}">Fuentes y cobertura</a>`;
 }
 function banner(type,message){return `<div class="v11-banner ${type}">${message}</div>`}
 const offline=location.protocol==='file:';
 async function get(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{let r=await fetch(url,{signal:controller.signal});let o=await r.json();if(!r.ok)throw Error(o.detail||o.error||'Consulta fallida');return o}finally{clearTimeout(timer)}}
 const key=(type,id)=>`cancha-v15-${type}-${id}`;
 function read(type,id){try{return JSON.parse(localStorage.getItem(key(type,id))||'null')}catch{return null}}
 function write(type,id,data){try{localStorage.setItem(key(type,id),JSON.stringify(data))}catch{}}
 function tableHead(){return `<div class="table-wrap m16-table-wrap ${standingsDetailed?'is-detailed':''}"><table class="standings v11-table"><thead><tr><th scope="col">#</th><th scope="col" class="teamcol">Equipo</th><th scope="col" class="pts">PTS</th><th scope="col">PJ</th><th scope="col">DG</th>${['G','E','P','GF','GC','Forma'].map(n=>`<th scope="col" class="m16-detail-col">${n}</th>`).join('')}</tr></thead><tbody>`}
 function rowHtml(r,pos,isRank){
  let name=team(r.teamId)?.name||r.name||'Equipo';
  let image=r.logo||'';
  let avatar=r.teamId&&team(r.teamId)?window.CANCHA_BRAND.teamHTML(r.teamId):
    (safe(image)?`<img src="${safe(image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span class="initial-mark">◈</span>`);
  const link=r.teamId?`<a class="team-link" href="#/equipo/${encodeURIComponent(r.teamId)}">${avatar}<span>${esc(name)}</span></a>`:`<span class="team-link">${avatar}<span>${esc(name)}</span></span>`;
  const n=v=>v===null||v===undefined?'—':esc(v);
  const dg=r.dg==null?(r.gf!=null&&r.gc!=null?r.gf-r.gc:null):r.dg;
  return `<tr ${standingsSearch&&!name.toLocaleLowerCase().includes(standingsSearch)?'hidden':''}><td>${isRank&&pos!=null?`<span class="position ${activeLeague==='ucl'?(pos<=8?'top':pos<=24?'playoff':''):''}">${pos}</span>`:'—'}</td><td class="teamcol">${link}</td><td class="pts">${n(r.pts)}</td><td>${n(r.pj)}</td><td>${dg!=null&&dg>0?'+':''}${n(dg)}</td>${[r.g,r.e,r.p,r.gf,r.gc,r.form||'—'].map(v=>`<td class="m16-detail-col">${n(v)}</td>`).join('')}</tr>`;
 }
 function wrapStandings(group,result){
  const l=league(activeLeague);if(!l)return '';
  let rs=group?.rows||[];
  const found=new Set(rs.map(r=>r.teamId).filter(Boolean));
  let complete=(result.quality?.complete??found.size===l.teams.length)&&rs.every(r=>r.position!=null&&r.pts!=null);
  let byTeam=new Map(rs.filter(r=>r.teamId).map(r=>[r.teamId,r]));
  // Incomplete provider responses must not pretend to be official rankings.
  let rows=complete?rs.slice().sort((a,b)=>(a.position??999)-(b.position??999)):l.teams.slice().sort((a,b)=>team(a).name.localeCompare(team(b).name,'es')).map(id=>byTeam.get(id)||{teamId:id,name:team(id).name});
  let label=complete?(result.source?.includes('OpenFootball')?'Tabla calculada con resultados publicados':'Clasificación de la temporada'):`Cobertura parcial · ${found.size} de ${l.teams.length} clubes relacionados`;
  const provenance=result.snapshot?`${esc(group.source||result.source)} · ${esc(group.dateLabel||'Instantánea fechada')}`:`${esc(result.source)} · ${esc(date(result.updatedAt||result.cache?.savedAt))}`;
  const meta=`<div class="v11-subline"><span><b>${provenance}</b> · ${esc(l.season)} · ${esc(group.label||'General')} · ${esc(label)}</span><button class="btn btn-outline" data-fetch-standings="${esc(activeLeague)}">↻ Comprobar datos</button></div>`;
  let groupsNav=(result.groups.length>1)?`<div class="v11-grouptabs">${result.groups.map((g,i)=>`<button class="v11-group-btn ${groupSelected===i?'is-active':''}" data-v11-group="${i}">${esc(g.label||'Tabla '+(i+1))}</button>`).join('')}</div>`:'';
  let note=(result.snapshot||result.imported)?banner('info',`<b>${result.source?.includes('OpenFootball')?'Tabla calculada con fuente abierta; no oficial ni en vivo.':'Datos de referencia, no en vivo.'}</b> ${esc(group.details||result.note||'')} ${safe(group.sourceUrl)?`<a href="${safe(group.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ver fuente ↗</a>`:''}`):'';
  note+=(result.warnings||[]).map(w=>banner('warning',esc(w))).join('');
  note+=!complete?banner('warning','Esta fuente devuelve una tabla incompleta. CANCHA conserva a todos los participantes y solo rellena las cifras que pudieron relacionarse; los guiones no son ceros.') : '';
  if(result.cache?.state==='stale'||result.stale)note+=banner('warning','No se pudo actualizar. Se conserva la última tabla guardada y su fecha original.');
  return `${meta}${groupsNav}${note}${activeLeague==='ucl'&&rs.length===36?'<p class="v18-caption pad">1–8: acceso directo · 9–24: eliminatoria previa · 25–36: fuera de clasificación.</p>':''}<div class="m16-table-tools"><label class="v18-table-search"><span class="sr-only">Buscar equipo</span><input type="search" id="v18-standings-filter" placeholder="Buscar equipo" value="${esc(standingsSearch)}"></label><button type="button" class="btn btn-outline" data-standings-detail aria-pressed="${standingsDetailed}">${standingsDetailed?'Vista resumida':'Vista detallada'}</button></div>${tableHead()}${rows.map((r,i)=>rowHtml(r,complete?(r.position??i+1):null,complete)).join('')}</tbody></table></div>`;
 }
 function updateFixtureCounters(lid,d){
  const qty=Array.isArray(d?.events)?d.events.length:0;
  const summary=document.querySelector('[data-v14-fixture-summary]');
  if(summary&&summary.dataset.v14FixtureSummary===lid)summary.textContent=`${qty} encuentros del calendario · ${d.events.filter(x=>x.status==='FINAL').length} con resultado`;
  const counter=document.querySelector('[data-v14-league-counter]');
  if(counter&&counter.dataset.v14LeagueCounter===lid)counter.textContent=String(qty);
 }
 async function refreshLeagueCounter(lid){
  const counter=document.querySelector('[data-v14-league-counter]');if(!counter||counter.dataset.v14LeagueCounter!==lid)return;
  try{const d=await get('/api/health');const current=(d.calendarCoverage||[]).find(x=>x.league===lid);if(document.contains(counter)&&current){counter.textContent=String(current.count);return}const leagueInfo=(d.soccerdataImports||[]).find(x=>x.league===lid);
   if(document.contains(counter)&&counter.dataset.v14LeagueCounter===lid&&leagueInfo?.fixtures)counter.textContent=String(leagueInfo.fixtures);
  }catch{/* se conserva el contador local */}
 }
 function renderStandings(d,old){let el=document.getElementById('v11-standings');if(!el)return;activeStandings=d;
  if(!d?.groups?.length){if(old)el.innerHTML=old;return}
  groups=d.groups;groupSelected=Math.min(groupSelected,groups.length-1);
  // Retain the historical verified Champions table if the external source provides only a subset.
  if(d.partial&&activeLeague==='ucl'&&old){el.innerHTML=banner('warning','Fuente gratuita parcial. Se conserva la última tabla histórica fechada de Champions.')+old;return}
  el.innerHTML=wrapStandings(groups[groupSelected],d);
 }
 async function loadStandings(lid,force=false){let el=document.getElementById('v11-standings');if(!el)return;
  el.querySelector('[data-v12-error]')?.remove();let old=el.innerHTML,gen=routeGeneration; if(activeLeague!==lid)groupSelected=0;activeLeague=lid;
  let saved=read('standings',lid);if(saved?.groups)renderStandings(saved,old);
  if(offline){if(!saved)el.insertAdjacentHTML('afterbegin',banner('warning','Abre CANCHA mediante el servidor incluido para consultar APIs. El archivo local conserva el catálogo histórico.'));return}
  try{let d=await get(`/api/standings?league=${encodeURIComponent(lid)}${force?'&refresh=1':''}`);if(gen!==routeGeneration||activeLeague!==lid)return;
   if(d.groups?.length){write('standings',lid,d);renderStandings(d,old);}else if(!saved)el.insertAdjacentHTML('afterbegin',banner('warning','No hay clasificación disponible en las fuentes configuradas.'));
  }catch(e){if(gen!==routeGeneration)return;let oldWarning=el.querySelector('[data-v12-error]');oldWarning?.remove();el.insertAdjacentHTML('afterbegin',`<div data-v12-error>${banner('warning','No se obtuvo una clasificación nueva: '+esc(e.message)+'. Se conserva la información anterior.')}</div>`)}
 }
 async function refreshStandings(lid){let el=document.getElementById('v11-standings');if(!el)return;let b=document.querySelector('[data-fetch-standings]');if(b){b.disabled=true;b.textContent='Actualizando…'}await loadStandings(lid,true);if(b){b.disabled=false;b.textContent='↻ Consultar clasificación'}}
 function position(p){let x=(p.position||'').toLowerCase();if(/portero|goal|keeper/.test(x))return 'Porteros';if(/defensa|defender|back/.test(x))return 'Defensas';if(/medio|mid/.test(x))return 'Centrocampistas';if(/delanter|forward|attack|wing/.test(x))return 'Delanteros';return 'Otros'}
 function rosterHtml(d){let p=d.players||[];let groups=['Porteros','Defensas','Centrocampistas','Delanteros','Otros'];let html=banner('info',`Datos obtenidos de <b>${esc(d.source)}</b>. ${esc(d.coverage||'')} · ${d.snapshot?'Instantánea '+esc(d.retrievedOn||'sin fecha'):esc(date(d.updatedAt))}`);
  if(d.cache?.state==='stale')html+=banner('warning','Mostrando la última plantilla guardada; la actualización ha fallado.');
  if(d.coach)html+=`<div class="v11-coach"><b>Director técnico:</b> ${esc(d.coach)}</div>`;
  if(d.sources?.length>1)html+=`<div class="v12-provider-chips">${d.sources.map(s=>`<span>${esc(s.source)} · ${esc(s.count)} registros</span>`).join('')}</div>`;
  if(!p.length)return html+banner('warning','El proveedor no devolvió futbolistas.');
  html+=`<div class="v11-roster-summary">${p.length} futbolistas publicados por la fuente${d.snapshot?' · Instantánea del '+esc(d.retrievedOn)+' · No es una actualización automática':' · No confundir con la nómina oficial completa'} ${safe(d.sourceUrl)?`· <a href="${safe(d.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fuente ↗</a>`:''}</div>`;
  html+='<p class="c-avatar-note">Avatares ilustrados con la identidad del club</p>';
  for(let group of groups){let arr=p.filter(x=>position(x)===group);if(!arr.length)continue;
   html+=`<div class="roster-group"><h3>${group} <span class="muted">${arr.length}</span></h3><div class="v11-roster-list">`;
   for(let pl of arr){html+=`<button class="v11-roster-player" data-v11-player="${esc(pl.id)}" data-v11-team="${esc(d.team)}" data-v11-source="${esc(pl.provider)}">${window.CANCHA_AVATARS.html(d.team,pl,'roster')}<span class="v11-player-main"><b>${esc(pl.name)}</b><small>${esc(pl.position||'')} · ${esc(pl.country||'Nacionalidad no publicada')}${pl.birth?' · '+esc(pl.birth):''}</small></span><span class="v11-player-extra">#${esc(pl.number??'—')}<small>${esc(pl.age??'—')} años</small></span><span class="arr">›</span></button>`}
   html+='</div></div>';
  }
  return html+`<div id="v11-player-detail" class="v11-player-detail" aria-live="polite"></div>`;
 }
 async function loadRoster(id,force=false){let el=document.getElementById('rosterTarget');if(!el)return;
  const gen=routeGeneration;let saved=read('roster',id);if(saved?.players?.length)el.innerHTML=rosterHtml(saved);
  if(offline){if(!saved)el.innerHTML=banner('warning','Para consultar plantillas, inicia CANCHA mediante el servidor local.');return}
  if(!saved)el.innerHTML='<div class="v11-loading">Consultando plantillas disponibles…</div>';
  try{let data=await get(`/api/roster?team=${encodeURIComponent(id)}${force?'&refresh=1':''}`);if(gen!==routeGeneration||!document.getElementById('rosterTarget'))return;
   if(data.players?.length){write('roster',id,data);el.innerHTML=rosterHtml(data)}else if(!saved)el.innerHTML=banner('warning','No se encontraron jugadores publicados para este club.');
  }catch(e){if(gen!==routeGeneration)return;if(!saved)el.innerHTML=banner('warning','La plantilla no está accesible: '+esc(e.message)+'. No se inventaron jugadores.');}
 }
 async function loadPlayer(btn){let box=document.getElementById('v11-player-detail');if(!box)return;const id=btn.dataset.v11Player,team=btn.dataset.v11Team,source=btn.dataset.v11Source;if(source==='ESPN'){location.hash='#/perfil/'+encodeURIComponent(team)+'/'+encodeURIComponent(id);return}
  let card=document.createElement('div');box.innerHTML='<div class="v11-loading">Consultando estadísticas individuales…</div>';
  try{let data=await get('/api/player-stats?team='+encodeURIComponent(team)+'&player='+encodeURIComponent(id)+'&source='+encodeURIComponent(source));if(!document.contains(box))return;
   let rows=data.rows||[];let first=rows.slice(0,5).map(r=>{
     if(data.source==='TheSportsDB')return `<div class="v11-player-metrics"><b>${esc(r.strLeague||'Competición')} · ${esc(r.strSeason||'Temporada sin confirmar')}</b>${[['PJ',r.intAppearances],['Goles',r.intGoals],['Asist.',r.intAssists]].map(([k,v])=>`<div><small>${k}</small><strong>${esc(v??'—')}</strong></div>`).join('')}</div>`;
     return `<div class="v11-player-metrics"><b>${esc(r.league||'Temporada')}</b>${[['PJ',r.appearances],['Goles',r.goals],['Asist.',r.assists],['Min.',r.minutes],['Pases',r.passes],['Nota',r.rating]].map(([k,v])=>`<div><small>${k}</small><strong>${esc(v??'—')}</strong></div>`).join('')}</div>`
   }).join('');box.innerHTML=`<h3>Estadísticas del jugador <button class="v11-close" data-v11-close>×</button></h3><p class="subdued">${esc(data.note||'')} · ${esc(data.source)}</p>${rows.length?first:banner('warning','Sin estadísticas individuales disponibles con el plan conectado. No se muestran cifras estimadas.')}`;
  }catch(e){box.innerHTML=banner('warning','No fue posible obtener estadísticas del jugador: '+esc(e.message))}
 }
 function fixtureHtml(d){
  if(!d.events?.length)return banner('info','El proveedor todavía no ofrece encuentros para estas fechas.');
  const all=d.events.filter(x=>x.homeName&&x.awayName).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  fixtureSnapshots.set(d.league,d);
  const size=36, total=Math.max(1,Math.ceil(all.length/size));
  if(!fixturePages.has(d.league)){
   const day=new Date().toISOString(); let nearest=all.findIndex(x=>x.date>=day);
   if(nearest<0)nearest=all.length-1;
   fixturePages.set(d.league,Math.max(0,Math.floor(Math.max(0,nearest-8)/size)));
  }
  const page=Math.max(0,Math.min(total-1,fixturePages.get(d.league)||0));fixturePages.set(d.league,page);
  const show=all.slice(page*size,(page+1)*size);
  const nav=total>1?`<div class="v14-calendar-nav"><button class="btn btn-outline" data-v14-fixture-page="${page-1}" data-v14-league="${esc(d.league)}" ${page===0?'disabled':''}>← Anteriores</button><span>Página ${page+1} de ${total} · ${all.length} encuentros</span><button class="btn btn-outline" data-v14-fixture-page="${page+1}" data-v14-league="${esc(d.league)}" ${page===total-1?'disabled':''}>Siguientes →</button></div>`:'';
  return `<div class="v11-subline">Datos de <b>${esc(d.source)}</b> · ${esc(date(d.updatedAt))} ${d.imported?'· Archivo importado, no en vivo':''}${d.cache?.state==='stale'||d.stale?'· No se pudo actualizar: última copia guardada':''} ${d.source==='ESPN'?'· Consulta cada 45 s; puede haber demora':''} ${esc(d.notice||d.note||'')} · ${all.length} partidos relacionados</div>${nav}<div class="row-list">${show.map(m=>window.CANCHA_MATCHES.row({...m,stale:!!d.stale||d.cache?.state==='stale'},d.league)).join('')}</div>${nav}`;
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-v14-fixture-page]');if(!b)return;
  const lid=b.dataset.v14League, d=fixtureSnapshots.get(lid);if(!d)return;
  const next=Number(b.dataset.v14FixturePage);if(!Number.isInteger(next)||next<0)return;
  fixturePages.set(lid,next);
  for(const target of ['v11-fixtures','v11-home-matches','v15-fixtures-'+lid]){
   const el=document.getElementById(target);if(el&&(target!=='v11-home-matches'||activeHomeLeague===lid))el.innerHTML=fixtureHtml(d);
  }
 });
 async function loadFixtures(lid){let el=document.getElementById('v11-fixtures');if(!el||offline)return;let gen=routeGeneration;let saved=read('fixtures',lid);if(saved?.events?.length){el.innerHTML=fixtureHtml(saved);updateFixtureCounters(lid,saved);}
  const archive=el.innerHTML;const archiveAvailable=el.querySelector('.score-row')!==null;
  if(!saved&&!archiveAvailable)el.innerHTML='<div class="v11-loading">Buscando partidos recientes y próximos…</div>';
  try{let data=await get(`/api/fixtures?league=${encodeURIComponent(lid)}`);if(gen!==routeGeneration||!document.getElementById('v11-fixtures'))return;write('fixtures',lid,data);el.innerHTML=fixtureHtml(data);updateFixtureCounters(lid,data)}catch(e){if(gen!==routeGeneration)return;if(!saved)el.innerHTML=archiveAvailable?banner('info','Se conservan los partidos documentados de la instantánea. Sin actualización automática para esta competición.')+archive:banner('warning','No hay calendario en vivo disponible: '+esc(e.message));}
 }
 async function loadHealth(){const panel=document.getElementById('v11-health');if(offline){headline('MODO ARCHIVO','No se ejecutan APIs');if(panel)panel.innerHTML=banner('warning','Para actualizar automáticamente, inicia el servidor de V12 como se explica en INSTRUCCIONES.md.');return}
  try{const d=await get('/api/health');headline(d.espn?.enabled?'ESPN HABILITADO':d.hasImportedFixtures?'DATOS IMPORTADOS':d.liveCredentialsConfigured?'SERVIDOR ACTIVO':'SERVIDOR LOCAL',d.espn?.enabled?'Consulta periódica de marcadores · cobertura según la fuente':d.hasImportedFixtures?'Resultados importados (OpenFootball / SoccerData), no en vivo':d.liveCredentialsConfigured?'Claves instaladas · cobertura por verificar':'Sin claves privadas de APIs');if(panel){panel.innerHTML=`<div class="v11-provider-grid">${[['espn','ESPN'],['footballData','football-data.org'],['apiFootball','API-Football'],['theSportsDB','TheSportsDB']].map(([k,name])=>`<div class="source-card"><h3>${name}</h3><p>${d.providers?.[k]?(k==='espn'?'Consulta pública periódica, sin clave':k==='theSportsDB'?'Acceso público limitado':'Clave configurada'):'Sin clave configurada'}${k==='theSportsDB'?' · versión pública limitada':''}</p></div>`).join('')}</div><div class="section-heading"><h2>Datos de temporadas importados</h2></div><div class="v11-provider-grid">${(d.soccerdataImports||[]).filter(x=>x.fixtures||x.standings).map(x=>`<div class="source-card"><h3>${esc(league(x.league)?.name||x.league)}</h3><p>${x.fixtures} encuentros · ${x.standings} registros de tabla ${x.tableComplete?'· tabla completa':''}</p><small>${x.lastUpdated?esc(date(x.lastUpdated)):'Sin importación'}</small></div>`).join('')}</div>${!(d.soccerdataImports||[]).some(x=>x.fixtures||x.standings)?'<p class="subdued">No hay importaciones de temporada adicionales.</p>':''}<p class="subdued">Importaciones fechadas, no marcadores en vivo. Su disponibilidad y permiso de reutilización dependen de la fuente original.</p>`;}}catch{headline('SIN SERVIDOR','Solo datos locales');if(panel)panel.innerHTML=banner('warning','El servidor no está ejecutándose.');}
 }
 let calendarLeague='todos',calendarDate='',calendarTeam='',calendarToken=0;
 function calendarAccept(m,filter){const day=m.date?.length===10?m.date:window.CANCHA_DATES.dayInPeru(new Date(m.date));return (!calendarDate||day===calendarDate)&&(!calendarTeam||m.home===calendarTeam||m.away===calendarTeam)&&(filter==='todos'||(filter==='vivo'?m.status==='EN VIVO':filter==='resultados'?m.status==='FINAL':window.CANCHA_DATES.upcoming(m)));}
 function calendarShell(filter){return `<div class="v17-calendar-controls"><label class="search-filter">Fecha en Perú <input type="date" class="filter-input" id="v17-calendar-date" value="${esc(calendarDate)}"></label><button class="btn btn-outline" id="v17-calendar-today">Hoy en Perú</button><button class="btn btn-outline" id="v17-calendar-nearby">Jornadas cercanas</button><label class="search-filter">Competición <select id="v15-calendar-league" class="filter-input">${[['todos','Todas las competiciones'],...db.leagues.map(l=>[l.id,l.name])].map(([id,name])=>`<option value="${esc(id)}" ${calendarLeague===id?'selected':''}>${esc(name)}</option>`).join('')}</select></label><label class="search-filter">Equipo <select id="v18-calendar-team" class="filter-input"><option value="">Todos los equipos</option>${Object.values(db.teams).filter(t=>calendarLeague==='todos'||league(calendarLeague).teams.includes(t.id)).sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${esc(t.id)}" ${calendarTeam===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label></div><div id="v15-calendar" data-filter="${esc(filter)}"></div>`}
 async function loadCalendar(){
  const box=document.getElementById('v15-calendar');if(!box)return;
  const token=++calendarToken,gen=routeGeneration,filter=box.dataset.filter;
  const selected=calendarLeague==='todos'?db.leagues:db.leagues.filter(l=>l.id===calendarLeague);
  box.innerHTML=selected.map(l=>`<section class="panel"><div class="panel-title">${esc(l.name)} · ${esc(l.season)}</div><div id="v15-fixtures-${esc(l.id)}"><p class="v11-loading">Consultando calendario…</p></div></section>`).join('');
  await Promise.allSettled(selected.map(async l=>{
   const el=document.getElementById('v15-fixtures-'+l.id);
   try{
    if(offline)throw Error('Inicia el servidor local para consultar importaciones.');
    const d=await get('/api/fixtures?league='+encodeURIComponent(l.id)+(calendarDate?'&date='+encodeURIComponent(calendarDate):''));
    if(gen!==routeGeneration||token!==calendarToken||!document.contains(el))return;
    const events=(d.events||[]).filter(m=>calendarAccept(m,filter));
    el.innerHTML=events.length?fixtureHtml({...d,league:l.id,events}):banner('info','No hay partidos que cumplan este filtro en la fuente disponible.')+`<p class="v13-provenance">${esc(d.source)} · ${esc(date(d.updatedAt))} · ${esc(d.notice||'')}</p>`;
   }catch(e){
    if(gen!==routeGeneration||token!==calendarToken||!document.contains(el))return;
    const local=(db.matches||[]).filter(m=>m.league===l.id&&calendarAccept(m,filter));
    el.innerHTML=banner('warning',esc(e.message))+(local.length?'<p class="v13-provenance">Catálogo histórico incluido en el ZIP.</p>'+local.map(m=>`<a class="v13-provider-row" href="#/encuentro/${encodeURIComponent(m.id)}"><span>${esc(date(m.date))}</span><strong>${esc(team(m.home)?.name)} ${esc(m.hs??'–')} : ${esc(m.as??'–')} ${esc(team(m.away)?.name)}</strong><span>${esc(window.CANCHA_DATES.statusLabel(m))}</span></a>`).join(''):'');
   }
  }));
 }
 document.addEventListener('change',async e=>{if(e.target.id==='v18-directory-team'){directoryTeam=e.target.value;if(directoryTeam){try{await get('/api/roster?team='+encodeURIComponent(directoryTeam))}catch{}}loadDirectory(directoryQuery);return}if(e.target.id==='v18-calendar-team'){calendarTeam=e.target.value;fixturePages.clear();loadCalendar();return}if(e.target.id==='v17-calendar-date'){calendarDate=e.target.value;fixturePages.clear();loadCalendar();return}if(e.target.id==='v15-calendar-league'){calendarLeague=e.target.value;calendarTeam='';fixturePages.clear();window.CANCHA_REDRAW();}});
 document.addEventListener('click',e=>{if(e.target.id==='v17-calendar-today'||e.target.id==='v17-calendar-nearby'){calendarDate=e.target.id==='v17-calendar-today'?window.CANCHA_DATES.dayInPeru():'';const input=document.getElementById('v17-calendar-date');if(input)input.value=calendarDate;fixturePages.clear();loadCalendar();}});
 function matchShell(lid,source,id){return `<div class="eyebrow">CANCHA · PARTIDO CONECTADO</div><div class="page-head"><div><h1>Centro del partido</h1><p>${esc(league(lid)?.name||'Competición')} · ${esc(source||'Proveedor')}</p></div></div><section class="panel"><div class="panel-title">Partido · datos actuales <small>${esc(id)}</small></div><div id="v11-fixture-detail" class="pad"><div class="v11-loading">Consultando el proveedor…</div></div></section>`}
 async function loadMatch(lid,source,id){const el=document.getElementById('v11-fixture-detail');if(!el)return;const gen=routeGeneration;
  if(offline){el.innerHTML=banner('warning','El partido requiere un servidor y datos del proveedor.');return}
  try{let d=await get(`/api/match-detail?league=${encodeURIComponent(lid)}&source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`);if(gen!==routeGeneration||!document.getElementById('v11-fixture-detail'))return;
   let ev=d.events||[];let stats=d.stats||[];
   el.innerHTML=`<div class="v11-match-score"><strong>${esc(d.homeName||'Local')}</strong><b>${esc(d.hs??'–')} : ${esc(d.as??'–')}</b><strong>${esc(d.awayName||'Visitante')}</strong></div><div class="v11-subline">${esc(d.status)} · ${esc(date(d.date))} · ${esc(d.source)} · ${esc(d.note||'')}</div><div class="v11-match-grid"><div><h3>Eventos</h3>${ev.length?ev.map(e=>`<div class="keyrow"><span>${esc(e.minute||'—')}' · ${esc(e.type||'Evento')}</span><strong>${esc(e.player||'')} ${e.detail?'· '+esc(e.detail):''}</strong></div>`).join(''):banner('warning','Sin cronología publicada.')}</div><div><h3>Estadísticas</h3>${stats.length?stats.map(s=>`<div class="keyrow"><span>${esc(s.name)}</span><strong>${esc(s.home??'—')} — ${esc(s.away??'—')}</strong></div>`).join(''):banner('warning','Estadísticas avanzadas no disponibles con esta fuente.')}</div></div>${d.lineups?.length?`<div class="v12-lineups"><h3>Formaciones publicadas</h3>${d.lineups.map(x=>`<section><b>${esc(x.team)} · ${esc(x.formation||'Formación sin registrar')}</b> · DT: ${esc(x.coach||'No publicado')}<p>${(x.starting||[]).map(y=>esc(y.name)).join(' · ')}</p></section>`).join('')}</div>`:''}`;
  }catch(e){if(gen!==routeGeneration)return;el.innerHTML=banner('warning','Detalles no accesibles: '+esc(e.message));}
 }

 function playerShell(teamId,playerId){return `<div class="eyebrow">CANCHA · PERFIL CONECTADO</div><div class="page-head"><div><h1>Ficha del futbolista</h1><p>Información del proveedor y temporada documentada</p></div></div><section class="panel"><div class="panel-title">Registro individual <small>Fecha y procedencia visibles</small></div><div id="v12-player-profile" class="pad"><div class="v11-loading">Consultando el índice de jugadores…</div></div></section>`}
 let directoryTeam='',directoryQuery='';
 async function loadDirectory(q='',offset=0){directoryQuery=q;
  const el=document.getElementById('v12-player-directory');if(!el)return;const gen=routeGeneration;
  if(offline){el.innerHTML=banner('warning','Inicia el servidor Node.js para consultar el directorio persistente.');return}
  try{const d=await get(`/api/players?q=${encodeURIComponent(q)}&team=${encodeURIComponent(directoryTeam)}&offset=${offset}&limit=100`);if(gen!==routeGeneration||!document.contains(el))return;
   el.innerHTML=`<p class="v12-directory-meta">${esc(d.total)} registros disponibles · ${esc(d.teamsIndexed)} plantillas consultadas o incorporadas · ${esc(d.coverage)}</p><div class="v18-directory-pages"><button class="btn btn-outline" data-directory-offset="${Math.max(0,offset-100)}" ${offset===0?'disabled':''}>← Anteriores</button><span>${offset+1}–${Math.min(offset+100,d.total)} de ${d.total}</span><button class="btn btn-outline" data-directory-offset="${offset+100}" ${offset+100>=d.total?'disabled':''}>Siguientes →</button></div>`+(d.players.length?`<div class="v12-athlete-grid">${d.players.map(p=>`<a class="v12-athlete" href="#/perfil/${encodeURIComponent(p.team)}/${encodeURIComponent(p.id)}">${window.CANCHA_AVATARS.html(p.team,p,'directory')}<span><b>${esc(p.name)}</b><small>${esc(team(p.team)?.name||p.team)} · ${esc(p.position||'Posición no disponible')}</small></span><span class="arr">›</span></a>`).join('')}</div>`:banner('info','Sin coincidencias dentro del índice disponible. Prueba consultar primero la plantilla del club.'));
  }catch(e){el.innerHTML=banner('warning','Directorio no disponible: '+esc(e.message))}
 }
 async function loadPlayerProfile(t,id){let el=document.getElementById('v12-player-profile');if(!el)return;const gen=routeGeneration;
  try{const p=await get(`/api/player-profile?team=${encodeURIComponent(t)}&id=${encodeURIComponent(id)}`);if(gen!==routeGeneration||!document.contains(el))return;
   el.innerHTML=`<div class="v12-profile-heading">${window.CANCHA_AVATARS.html(t,p,'profile')}<div><h2>${esc(p.name)}</h2><span>${esc(team(t)?.name||t)} · ${esc(p.position||'Posición no registrada')}</span></div></div><div class="v12-profile-facts">${[['Club registrado',team(t)?.name||t],['Dorsal',p.number??'No publicado'],['Nacionalidad',p.country||'No publicada'],['Fecha de nacimiento',p.birth||'No publicada'],['Fuente',p.source],['Temporada',p.season||'Sin confirmar'],['Actualización',p.snapshot?'Instantánea histórica':date(p.updatedAt)]].map(([a,b])=>`<div class="keyrow"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('')}</div>${window.CANCHA_INSIGHTS.shell('player',t,id)}<div class="v12-profile-actions"><a class="btn btn-outline" href="#/equipo/${encodeURIComponent(t)}">Ver ficha del club →</a></div>`;
  }catch(e){el.innerHTML=banner('warning','Ficha no disponible en el índice: '+esc(e.message))}finally{window.CANCHA_INSIGHTS.afterDraw('perfil',t,[id])}
 }
 let periodic=null;
 async function loadTeamSummary(tid){const el=document.getElementById('v11-team-current');if(!el)return;
  const t=team(tid);if(!t)return;let l=t.leagues.includes('per')?'per':(t.leagues.find(x=>x!=='ucl')||t.leagues[0]);
  const gen=routeGeneration;if(offline){el.innerHTML=banner('info','Abre el servidor local para consultar posiciones del equipo.');return}
  try{let data=await get('/api/standings?league='+encodeURIComponent(l));if(gen!==routeGeneration||!document.contains(el))return;
   let candidates=(data.groups||[]).map(g=>({name:g.label,row:(g.rows||[]).find(r=>r.teamId===tid)})).filter(x=>x.row&&x.row.position!=null&&x.row.pts!=null);
   if(!candidates.length){el.innerHTML=banner('info','La tabla de esta liga no incluye una posición verificable del club.');return}
   el.innerHTML=candidates.map(x=>`<div class="c-club-standing-top"><strong>${esc(league(l)?.name)} · ${esc(x.name)}</strong><a href="#/liga/${encodeURIComponent(l)}">Ver tabla →</a></div><div class="c-club-standing-grid"><div><span>Posición</span><b>${esc(x.row.position)}º</b></div><div><span>Puntos</span><b>${esc(x.row.pts)}</b><small>${esc(x.row.g??'—')} G · ${esc(x.row.e??'—')} E · ${esc(x.row.p??'—')} P</small></div><div><span>Jugados</span><b>${esc(x.row.pj??'—')}</b></div><div><span>Goles · GF / GC</span><b>${esc(x.row.gf??'—')}–${esc(x.row.gc??'—')}</b><small>DG ${x.row.dg>0?'+':''}${esc(x.row.dg??'—')}</small></div></div>`).join('')+`<p class="c-club-standing-source">${esc(data.source)} · ${esc(date(data.updatedAt||data.retrievedOn))}${data.calculated?' · Tabla calculada, no oficial':''}${data.snapshot?' · Referencia histórica':''}${data.stale||data.cache?.state==='stale'?' · Sin actualizar':''}</p>`;
  }catch(e){if(gen!==routeGeneration)return;el.innerHTML='<div class="v13-quiet">Posición actual pendiente de actualización. Los datos históricos disponibles permanecen en la ficha y puedes consultar la competición.</div>';}
 }
 function autoRefresh(route,id){if(periodic){clearInterval(periodic);periodic=null}if(offline)return;
  // El cliente consulta el caché compartido del servidor; NO solicita una API por visitante.
  if(route==='liga'||route==='partidos')periodic=setInterval(()=>{
   if(document.visibilityState==='hidden')return;
   if(route==='liga'){if(document.getElementById('v11-standings'))loadStandings(id);if(document.getElementById('v11-fixtures'))loadFixtures(id)}
   if(route==='partidos'&&document.getElementById('v15-calendar'))loadCalendar();
  },45000);
 }
 function afterDraw(route,id,params=[]){routeGeneration++;activeStandings=null;let l=route==='liga'?id:null;
  if(l){if(activeLeague!==l){standingsSearch='';standingsDetailed=false}activeLeague=l;if(document.getElementById('v11-standings'))loadStandings(l);if(document.getElementById('v11-fixtures'))loadFixtures(l);refreshLeagueCounter(l)}
  if(route==='equipo'&&document.getElementById('rosterTarget'))loadRoster(id);
  if(route==='fuentes'||route==='inicio'||!healthLoaded)loadHealth();if(route==='equipo'&&document.getElementById('v11-team-current'))loadTeamSummary(id);if(route==='partidos')loadCalendar();if(route==='jugadores')loadDirectory();if(route==='perfil')loadPlayerProfile(id,params[0]);
  if(route==='evento-v12')loadMatch(id,params[0],params[1]);autoRefresh(route,id);
 }
 let searchTimer=null;document.addEventListener('input',e=>{if(e.target.id==='v18-standings-filter'){const q=e.target.value.toLocaleLowerCase();standingsSearch=q;document.querySelectorAll('.v11-table tbody tr').forEach(r=>r.hidden=!r.querySelector('.teamcol')?.textContent.toLocaleLowerCase().includes(q));return}if(e.target.id==='v12-player-search'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadDirectory(e.target.value),250)}});
 document.addEventListener('click',async e=>{
  if(e.target.id==='v18-sync-rosters'){const button=e.target,msg=document.getElementById('v18-sync-message');button.disabled=true;let added=0,failed=0;try{for(let n=0;n<35&&document.contains(button);n++){const d=await get('/api/rosters/sync');added+=d.added;failed+=d.failed;msg.textContent=`${added} clubes actualizados · ${d.remaining} pendientes${failed?' · '+failed+' no disponibles':''}`;await loadDirectory(directoryQuery);if(!d.remaining||!d.added&&d.failed)break}}catch(e){msg.textContent=e.message}finally{button.disabled=false}return}
  let b=e.target.closest('[data-standings-detail]');if(b){standingsDetailed=!standingsDetailed;document.querySelector('.m16-table-wrap')?.classList.toggle('is-detailed',standingsDetailed);b.setAttribute('aria-pressed',String(standingsDetailed));b.textContent=standingsDetailed?'Vista resumida':'Vista detallada';return}b=e.target.closest('[data-directory-offset]');if(b){loadDirectory(directoryQuery,Number(b.dataset.directoryOffset));return}b=e.target.closest('[data-v11-group]');if(b){groupSelected=Number(b.dataset.v11Group);if(activeStandings){let el=document.getElementById('v11-standings');if(el)el.innerHTML=wrapStandings(activeStandings.groups[groupSelected],activeStandings)}return}
  b=e.target.closest('[data-v11-player]');if(b){loadPlayer(b);return}
  b=e.target.closest('[data-v11-close]');if(b){let el=document.getElementById('v11-player-detail');if(el)el.innerHTML='';return}
 });
 window.CANCHA_LIVE={calendarShell,afterDraw,matchShell,playerShell,refreshStandings,refreshRoster:id=>loadRoster(id,true),loadHealth};
})();
