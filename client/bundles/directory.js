/* directory.js */
/* Directorios filtrables; 24 equipos y 25 jugadores por página. */
(()=>{'use strict';
 const V=globalThis.CANCHA_VIEW,E=V.escape,D=()=>globalThis.CANCHA_DB;
 const teams={query:'',league:'todos',page:0},players={query:'',league:'todos',club:'',team:'',page:0,token:0};let timer;
 const options=selected=>`<option value="todos">Todas las competiciones</option>`+D().leagues.map(l=>`<option value="${l.id}" ${selected===l.id?'selected':''}>${E(l.name)}</option>`).join('');
 const clubs=()=>Object.values(D().teams).filter(t=>players.league==='todos'||t.leagues.includes(players.league)).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 function teamsShell(){return `<div class="eyebrow">DIRECTORIO</div><div class="page-head"><div><h1>Equipos</h1><p>Explora los ${Object.keys(D().teams).length} clubes del catálogo.</p></div></div><div class="c-directory-filters"><label>Nombre del club<input type="search" id="c-team-query" placeholder="Busca un equipo" value="${E(teams.query)}"></label><label>Competición<select id="c-team-league">${options(teams.league)}</select></label></div><div id="c-team-directory"></div>`;}
 function renderTeams(){
  const root=document.getElementById('c-team-directory');if(!root)return;
  const list=Object.values(D().teams).filter(t=>(teams.league==='todos'||t.leagues.includes(teams.league))&&V.normalize(t.name).includes(V.normalize(teams.query))).sort((a,b)=>a.name.localeCompare(b.name,'es')),p=V.page(list,teams.page,24);teams.page=p.index;
  root.innerHTML=`<p class="c-directory-count" role="status">${p.total} ${p.total===1?'equipo':'equipos'} encontrados</p>${V.pagination(p,'teams')}<div class="team-grid">${p.items.map(t=>`<a class="team-tile" href="#/equipo/${encodeURIComponent(t.id)}">${globalThis.CANCHA_BRAND.teamHTML(t.id)}<div><b>${E(t.name)}</b><small>${E(t.country)} · Ver perfil →</small></div></a>`).join('')}</div>${!list.length?'<p class="c-directory-empty">No hay equipos con estos filtros.</p>':''}${V.pagination(p,'teams')}`;
 }
 function playerShell(){return `<div class="eyebrow">DIRECTORIO</div><div class="page-head"><div><h1>Jugadores</h1><p>Busca futbolistas por nombre, club o competición.</p></div></div><section class="panel"><div class="panel-title">Explorar futbolistas <small>25 por página</small></div><div class="pad"><div class="c-directory-filters c-player-filters"><label>Competición<select id="c-player-league">${options(players.league)}</select></label><label>Club<input type="search" id="c-player-club" list="c-player-clubs" value="${E(players.club)}" placeholder="Escribe o elige un club" autocomplete="off"><datalist id="c-player-clubs">${clubs().map(t=>`<option value="${E(t.name)}"></option>`).join('')}</datalist></label><label>Nombre<input type="search" id="c-player-query" value="${E(players.query)}" placeholder="Busca un futbolista" autocomplete="off"></label></div><div class="c-directory-actions"><button type="button" class="btn btn-outline" data-directory-clear>Limpiar filtros</button><button type="button" class="btn btn-outline" data-directory-sync>Consultar más clubes</button><span id="c-directory-message" role="status"></span></div><div id="c-player-directory"><p class="v11-loading">Consultando jugadores…</p></div></div></section>`;}
 const json=url=>window.CANCHA_API.get(url);
 async function loadPlayers(roster=false){
  const root=document.getElementById('c-player-directory');if(!root)return;const mark=++players.token;if(players.club&&!players.team){root.innerHTML='<p class="c-directory-empty">Elige un club de las sugerencias para consultar su plantilla.</p>';return}
  const msg=document.getElementById('c-directory-message');if(roster&&players.team){if(msg)msg.textContent='Consultando plantilla del club…';try{await json('/api/roster?team='+encodeURIComponent(players.team))}catch{if(mark===players.token&&document.contains(root)&&msg)msg.textContent='No se pudo actualizar la plantilla. Se muestran los registros disponibles.'}}
  if(mark!==players.token||!document.contains(root))return;
  try{const q=new URLSearchParams({q:players.query,team:players.team,league:players.league==='todos'?'':players.league,limit:'25',offset:String(players.page*25)}),d=await json('/api/players?'+q);if(mark!==players.token||!document.contains(root))return;
   const p={index:players.page,pages:Math.max(1,Math.ceil(d.total/25)),start:d.total?players.page*25+1:0,end:Math.min(d.total,(players.page+1)*25),total:d.total};
   if(players.page>=p.pages){players.page=p.pages-1;loadPlayers();return}
   root.innerHTML=`<p class="c-directory-count" role="status">${d.total} jugadores disponibles · ${d.teamsIndexed} clubes consultados <button type="button" class="c-help-inline" data-directory-coverage>¿Qué incluye?</button></p><p class="c-directory-explanation" hidden>El directorio contiene plantillas consultadas y registros fechados. Elegir un club recupera su plantilla disponible; no equivale a un censo completo de todas las ligas.</p>${V.pagination(p,'players')}${d.players.length?`<div class="v12-athlete-grid">${d.players.map(p=>`<a class="v12-athlete" href="#/perfil/${encodeURIComponent(p.team)}/${encodeURIComponent(p.id)}">${globalThis.CANCHA_AVATARS.html(p.team,p,'directory')}<span><b>${E(p.name)}</b><small>${E(D().teams[p.team]?.name)} · ${E(p.position||'Posición no publicada')}${p.scope==='match-observation'?' · Registro de acta':''}</small></span><span class="arr">›</span></a>`).join('')}</div>`:'<p class="c-directory-empty">No hay coincidencias en los registros disponibles. Elige un club para consultar su plantilla.</p>'}${V.pagination(p,'players')}`;
   if(roster&&msg&&msg.textContent==='Consultando plantilla del club…')msg.textContent='Plantilla consultada';
  }catch{if(mark===players.token&&document.contains(root))root.innerHTML='<p class="c-directory-empty">No se pudo consultar el directorio. Vuelve a elegir un club para reintentar.</p>'}
 }
 function chooseClub(value){players.token++;clearTimeout(timer);players.club=value;const exact=clubs().find(t=>V.normalize(t.name)===V.normalize(value));players.team=exact?.id||'';players.page=0;const msg=document.getElementById('c-directory-message');if(msg)msg.textContent='';loadPlayers(!!exact)}
 document.addEventListener('input',e=>{
  if(e.target.id==='c-team-query'){teams.query=e.target.value;teams.page=0;renderTeams()}
  if(e.target.id==='c-player-query'){players.query=e.target.value;players.page=0;clearTimeout(timer);timer=setTimeout(()=>loadPlayers(),250)}
  if(e.target.id==='c-player-club'){players.token++;clearTimeout(timer);players.club=e.target.value;players.team='';players.page=0;if(!e.target.value)chooseClub('');else loadPlayers();}
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='c-team-league'){teams.league=e.target.value;teams.page=0;renderTeams()}
  if(e.target.id==='c-player-league'){players.league=e.target.value;players.club='';players.team='';players.page=0;document.getElementById('c-player-club').value='';document.getElementById('c-player-clubs').innerHTML=clubs().map(t=>`<option value="${E(t.name)}"></option>`).join('');loadPlayers()}
  if(e.target.id==='c-player-club')chooseClub(e.target.value);
 });
 document.addEventListener('keydown',e=>{if(e.target.id==='c-player-club'&&e.key==='Enter'){e.preventDefault();chooseClub(e.target.value)}});
 document.addEventListener('click',async e=>{
  const p=e.target.closest('[data-view-page]');if(p&&['teams','players'].includes(p.dataset.viewPage)&&!p.disabled){const n=Number(p.dataset.pageIndex);if(!Number.isInteger(n)||n<0)return;if(p.dataset.viewPage==='teams'){teams.page=n;renderTeams()}else{players.page=n;loadPlayers()}return}
  if(e.target.closest('[data-directory-coverage]')){const p=document.querySelector('.c-directory-explanation');if(p)p.hidden=!p.hidden}
  if(e.target.closest('[data-directory-clear]')){players.query='';players.league='todos';players.club='';players.team='';players.page=0;globalThis.CANCHA_REDRAW();return}
  const b=e.target.closest('[data-directory-sync]');if(b){b.disabled=true;const msg=document.getElementById('c-directory-message');if(msg)msg.textContent='Consultando más clubes…';try{const d=await json('/api/rosters/sync');if(msg)msg.textContent=`${d.added} clubes actualizados · ${d.remaining} pendientes${d.failed?' · '+d.failed+' sin respuesta':''}`;loadPlayers()}catch{if(msg)msg.textContent='No se pudieron consultar más clubes.'}finally{if(b.isConnected)b.disabled=false}}
 });
 globalThis.CANCHA_DIRECTORY={teamsShell,playerShell,afterDraw:route=>{if(route==='equipos')renderTeams();if(route==='jugadores')loadPlayers()}};
})();
