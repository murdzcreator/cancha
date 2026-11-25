/* app.js */
(() => {
  'use strict';
  const D = window.CANCHA_DB,
    leagues = D.leagues,
    teams = D.teams,
    match = D.matches;
  const byId = (id) => document.getElementById(id),
    E = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x],
      );
  const norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const leg = (id) => leagues.find((l) => l.id === id),
    team = (id) => teams[id],
    n = (id) => teams[id]?.name || id;
  const path = (...a) => '#/' + a.map(encodeURIComponent).join('/');
  const dateHuman = (d) => window.CANCHA_DATES.format(d);
  const safeURL = (u) => (/^https:\/\//.test(u || '') ? E(u) : '');
  const leagueImg = (l, cls = '') => window.CANCHA_BRAND.leagueHTML(l.id, cls);
  const logo = (tid, cls = '') => window.CANCHA_BRAND.teamHTML(tid, cls);
  let S = {
    side: false,
    leagueTab: 'tabla',
    leagueMetric: 'goals',
    teamTab: 'resumen',
    matchPlayer: null,
    query: '',
    matchFilter: 'todos',
    day: '2026-10-20',
  };
  const main = byId('main');
  let liveCache = {};
  function nav() {
    byId('sideLeagues').innerHTML = leagues
      .map(
        (l) =>
          `<a href="${path('liga', l.id)}" title="${E(l.name)}">${leagueImg(l)}<span>${E(l.name)}</span></a>`,
      )
      .join('');
  }
  function active() {
    let hash = location.hash || '#/inicio';
    try {
      hash = decodeURI(hash);
    } catch {}
    document
      .querySelectorAll('.sidebar a')
      .forEach((a) =>
        a.classList.toggle(
          'active',
          hash.startsWith(decodeURI(a.getAttribute('href'))) &&
            a.getAttribute('href') !== '#/inicio',
        ),
      );
    document
      .querySelector('.nav a[data-path="inicio"]')
      ?.classList.toggle('active', hash === '#/inicio' || hash === '#/');
  }
  function go(h) {
    location.hash = h;
  }
  function makeTitle(k, t, sub = '', ico = '', right = '') {
    return `<div class="eyebrow">${E(k)}</div><div class="page-head">${ico}<div><h1>${E(t)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right}</div>`;
  }
  function notice(txt) {
    return `<div class="notice">${txt}</div>`;
  }
  function form(v) {
    return `<span class="form">${[...v].map((x) => `<i class="${x}">${x}</i>`).join('')}</span>`;
  }
  function teamAnchor(id) {
    return `<a class="team-link" href="${path('equipo', id)}">${logo(id)}<span>${E(n(id))}</span></a>`;
  }
  function fixture(m) {
    const h = m.home,
      a = m.away,
      final = m.status === 'FINAL';
    return `<a class="score-row" href="${m.id === 'ucl-j3-7' ? path('partido', 'psg-barca') : path('encuentro', m.id)}"><span class="kick">${dateHuman(m.date)}<br><span class="muted">${final ? 'FINAL' : 'POR JUGAR'}</span></span><span class="t-name" style="justify-content:flex-end;text-align:right"><span>${E(n(h))}</span>${logo(h)}</span><span class="score">${final ? m.hs + ' – ' + m.as : '– : –'}<small>${final ? 'Final' : 'Programado'}</small></span><span class="t-name">${logo(a)}<span>${E(n(a))}</span></span><span class="arrow">›</span></a>`;
  }
  function leagueMatchCard(l, items) {
    return `<section class="panel"><div class="league-banner"><a href="${path('liga', l.id)}">${leagueImg(l)}<span>${E(l.name)}</span> <small>›</small></a><small>${items.length} encuentros</small></div><div class="row-list">${items.map(fixture).join('')}</div></section>`;
  }
  function smallCard(l) {
    return `<a class="league-card" href="${path('liga', l.id)}">${leagueImg(l)}<div><b>${E(l.name)}</b><small>${E(l.country)} · ${l.teams.length} equipos · ${E(l.season)}</small></div><span class="arr">›</span></a>`;
  }
  function home() {
    return window.CANCHA_HOME.shell();
  }
  function leaguesPage() {
    return `<div class="page-head"><h1>Competiciones</h1></div><div class="grid-cards">${leagues.map(smallCard).join('')}</div>`;
  }
  function leaguePage(id) {
    const l = leg(id);
    if (!l) return notFound();
    const selected = S.leagueTab;
    const content =
      selected === 'tabla'
        ? `<section class="panel c-classification" style="--table-rows:${l.teams.length}"><div id="v11-standings"><p class="v11-loading">Consultando clasificación publicada…</p></div></section>`
        : selected === 'equipos'
          ? `<section class="panel"><div class="panel-title">Equipos participantes</div><div class="team-grid pad">${l.teams.map(teamTile).join('')}</div></section>`
          : selected === 'calendario'
            ? `<section class="panel"><div class="panel-title">Calendario ${E(l.season)} <small data-v14-fixture-summary="${E(id)}">Consultando…</small></div><div id="v11-fixtures"><p class="v11-loading">Consultando calendario…</p></div></section>`
            : window.CANCHA_INSIGHTS.shell('league', id, '', S.leagueMetric);
    return `${makeTitle('COMPETICIÓN · ' + l.country, l.name, `Temporada ${l.season} · ${l.teams.length} equipos`, leagueImg(l, 'head-logo'))}<div class="tabs">${[
      ['tabla', 'Clasificación'],
      ['calendario', 'Calendario'],
      ['equipos', 'Equipos'],
      ['lideres', 'Estadísticas'],
    ]
      .map(
        ([k, label]) =>
          `<button class="tab ${selected === k ? 'active' : ''}" data-league-tab="${k}">${label}</button>`,
      )
      .join(
        '',
      )}</div>${selected === 'tabla' ? '<button class="c-round-jump btn btn-outline" data-jump-round>Partidos de la jornada ↓</button>' : ''}<div class="c-league-layout"><div class="c-league-primary">${content}</div><aside class="c-league-context">${selected === 'tabla' ? window.CANCHA_COMPETITION.contextShell(id) : ''}<section class="panel"><div class="panel-title">La competición</div><div class="c-competition-facts"><span><b data-v14-league-counter="${E(id)}">…</b> encuentros disponibles</span><span>${E(l.country)} · ${E(l.season)}</span></div><a class="c-mini-more" href="${safeURL(l.source)}" target="_blank" rel="noopener noreferrer">Fuente de participantes ↗</a></section></aside>${selected === 'tabla' ? '<div class="c-league-rankings" id="c-competition-rankings"><p class="v11-loading">Consultando partidos analizados…</p></div>' : ''}</div>`;
  }
  function teamTile(id) {
    return `<a class="team-tile" href="${path('equipo', id)}">${logo(id)}<div><b>${E(n(id))}</b></div></a>`;
  }
  function teamsPage() {
    return window.CANCHA_DIRECTORY.teamsShell();
  }
  function playersPage() {
    return window.CANCHA_DIRECTORY.playerShell();
  }
  function matchList() {
    return `${makeTitle('PARTIDOS', 'Calendario de competiciones', 'Horarios de Perú.')}<div class="tabs">${[
      ['todos', 'Todos'],
      ['vivo', 'En vivo'],
      ['resultados', 'Finalizados'],
      ['proximos', 'Próximos'],
    ]
      .map(
        ([k, label]) =>
          `<button class="tab ${S.matchFilter === k ? 'active' : ''}" data-match-filter="${k}">${label}</button>`,
      )
      .join('')}</div>${window.CANCHA_LIVE.calendarShell(S.matchFilter)}`;
  }

  function teamPage(id) {
    const t = team(id);
    if (!t) return notFound();
    const included = t.leagues.map((l) => leg(l)).filter(Boolean),
      tab = S.teamTab,
      info = window.CANCHA_UNIVERSAL.clubInfoRows(id, t);
    const squad = `<div id="rosterTarget">${renderCachedRoster(id)}</div>`;
    let content = '';
    if (tab === 'resumen' || tab === 'partidos')
      content = `<div id="c-club-fixture-tools" data-club-view="${tab}"></div><section class="panel c-club-fixture-panel"><div class="panel-title"><span id="c-club-next-title">Próximos partidos</span><small id="v17-team-next-count">Consultando…</small></div><div id="v13-team-schedule"><p class="c-club-empty" role="status">Consultando próximos partidos…</p></div></section><section class="panel c-club-fixture-panel"><div class="panel-title"><span>Resultados recientes</span><small id="v17-team-results-count">Consultando…</small></div><div id="v15-team-results"><p class="c-club-empty" role="status">Consultando resultados disponibles…</p></div></section>`;
    if (tab === 'resumen')
      content =
        `<section class="panel c-club-standing"><div class="panel-title">Situación en la liga <small>Clasificación publicada</small></div><div id="v11-team-current" class="pad"><div class="v11-loading">Consultando clasificación…</div></div></section>` +
        `<div class="c-club-summary-matches">${content}</div>`;
    if (tab === 'plantilla')
      content = `<section class="panel"><div class="panel-title"><span>Plantilla del club <small id="c-roster-asof"></small></span><button class="btn btn-outline" data-fetch-roster="${id}">Actualizar plantilla</button></div><div class="pad">${squad}</div></section>`;
    if (tab === 'estadisticas') content = window.CANCHA_INSIGHTS.shell('team', id);
    if (tab === 'informacion')
      content = `<section class="panel"><div class="panel-title">Datos del club</div><div class="pad">${info}</div></section>`;
    return `${makeTitle('PERFIL DE CLUB', t.name, `${included.map((x) => `<a href="${path('liga', x.id)}">${E(x.name)}</a>`).join(' · ')} · ${[...new Set(included.map((x) => x.season))].join(' / ')}`, logo(id, 'head-logo'))}<div class="tabs">${[
      ['resumen', 'Resumen'],
      ['partidos', 'Partidos'],
      ['plantilla', 'Plantilla'],
      ['estadisticas', 'Estadísticas'],
      ['informacion', 'Información'],
    ]
      .map(
        ([k, v]) =>
          `<button class="tab ${k === tab ? 'active' : ''}" data-team-tab="${k}">${v}</button>`,
      )
      .join(
        '',
      )}</div><div class="split c-club-layout ${tab === 'resumen' ? 'c-club-layout--summary' : ''} ${tab === 'partidos' ? 'c-club-layout--calendar' : ''}"><div>${content}</div><aside class="stack c-club-context" ${tab === 'resumen' ? 'hidden' : ''}><section class="panel"><div class="panel-title">Competiciones</div><div class="leader-list">${included.map((l) => `<a class="leader" href="${path('liga', l.id)}">${leagueImg(l)}<strong>${E(l.name)}</strong><span class="num">›</span></a>`).join('')}</div></section>${tab !== 'informacion' ? `<details class="panel c-club-info"><summary>Información del club <span aria-hidden="true">⌄</span></summary><div class="pad">${info}<button class="btn btn-outline" data-team-tab="plantilla">Consultar futbolistas →</button></div></details>` : ''}</aside></div>`;
  }
  const cacheKey = (id) => 'cancha-v10-roster-' + id;
  function renderCachedRoster(id) {
    try {
      let c = JSON.parse(localStorage.getItem(cacheKey(id)) || 'null');
      if (c?.players?.length)
        return rosterHtml(c.players, `Datos en línea consultados: ${c.when || 'sin fecha'}`, id);
    } catch {}
    return '<div class="blank">Plantilla actual no cargada. Consulta al proveedor para obtener futbolistas y posiciones publicados por la fuente.</div>';
  }
  function rosterHtml(players, date, teamId) {
    let order = ['Porteros', 'Defensas', 'Mediocampistas', 'Delanteros', 'Otros'];
    let grouped = {};
    order.forEach((x) => (grouped[x] = []));
    for (let p of players) {
      let pos = norm(p.position);
      let g =
        pos.includes('goal') || pos.includes('arquero') || pos.includes('porter')
          ? 'Porteros'
          : pos.includes('defens') || pos.includes('back')
            ? 'Defensas'
            : pos.includes('mid') || pos.includes('medi') || pos.includes('centroc')
              ? 'Mediocampistas'
              : pos.includes('forw') || pos.includes('ata') || pos.includes('delanter')
                ? 'Delanteros'
                : 'Otros';
      grouped[g].push(p);
    }
    return `<div class="subdued" style="margin:12px 0">${E(date)} · ${players.length} futbolistas disponibles en la fuente</div>${order
      .filter((g) => grouped[g].length)
      .map(
        (g) =>
          `<div class="roster-group"><h3>${g} · ${grouped[g].length}</h3>${grouped[g].map((p) => `<div class="roster-player">${window.CANCHA_AVATARS.html(teamId || p.team, p, 'compact')}<strong>${E(p.name)}</strong><span class="roster-extra">${E(p.country || p.position || '')}</span><span>${E(p.age || '—')}</span></div>`).join('')}</div>`,
      )
      .join('')}`;
  }
  function playerPage(id) {
    let p = D.matchPlayers[id];
    if (!p) return notFound();
    return `${makeTitle('FICHA HISTÓRICA', p.name, `${E(window.CANCHA_VIEW.positionName(p.position))} · Dorsal ${E(p.number)} · <a href="${path('equipo', p.team)}">${E(n(p.team))}</a>`, window.CANCHA_AVATARS.html(p.team, p, 'profile'))}<section class="panel"><div class="panel-title">Partido documentado</div><div class="pad"><a href="${path('partido', 'psg-barca')}">PSG 4–2 Barcelona →</a><p class="subdued">20 de octubre de 2026 · Referencia visual de la alineación. Estadísticas individuales pendientes de verificación.</p></div></section>`;

  }
  function findPage(q) {
    q = String(q || '').trim();
    if (!q)
      return `${makeTitle('BUSCADOR', 'Buscar en CANCHA', 'Escribe un club, competición o futbolista en el buscador.')}<p class="blank">Puedes buscar por nombre completo o por parte del nombre.</p>`;
    let query = norm(q);
    let li = leagues.filter((l) => norm(l.name).includes(query)),
      ts = Object.keys(teams).filter((id) => norm(n(id)).includes(query)),
      p = Object.values(D.matchPlayers).filter((p) => norm(p.name).includes(query));
    return `${makeTitle('BUSCADOR', 'Resultados de búsqueda', `Para: ${E(q)}`)}${li.length ? `<div class="section-heading"><h2>Competiciones</h2></div><div class="grid-cards">${li.map(smallCard).join('')}</div>` : ''}${ts.length ? `<div class="section-heading"><h2>Equipos (${ts.length})</h2></div><div class="team-grid">${ts.map(teamTile).join('')}</div>` : ''}${p.length ? `<section id="c-search-historical"><div class="section-heading"><h2>Fichas de partido</h2></div><div class="team-grid">${p.map((p) => `<a class="team-tile" data-historical-id="${E(p.id)}" href="${path('jugador', p.id)}">${window.CANCHA_AVATARS.html(p.team, p, 'directory')}<b>${E(p.name)}</b></a>`).join('')}</div></section>` : ''}<section class="panel"><div class="panel-title">Futbolistas del directorio</div><div class="pad" id="v18-search-players" data-query="${E(q)}" data-has-local="${Boolean(li.length || ts.length || p.length)}">Buscando futbolistas…</div></section><div class="blank" id="v18-search-empty" hidden>No encontramos coincidencias en los registros disponibles.</div>`;
  }
  function sourcesPage() {
    const urls = leagues
      .map(
        (l) =>
          `<div class="source-card"><h3>${E(l.name)}</h3><p>${l.teams.length} equipos · ${E(l.season)} · lista consultada para ${E(l.checked || '26/10/2026')}</p><a href="${safeURL(l.source)}" target="_blank" rel="noopener noreferrer">Consultar lista de participantes ↗</a></div>`,
      )
      .join('');
    return `${makeTitle('TRANSPARENCIA', 'Fuentes y actualizaciones', 'Qué es real, qué se puede consultar y qué sigue pendiente.')} ${notice('ESPN aporta clasificaciones, plantillas y actualizaciones de partidos. OpenFootball completa los calendarios de Premier League, LaLiga y Bundesliga y se sincroniza en segundo plano. Las estadísticas individuales y de equipos indican cuántos partidos del archivo cubren. Cada tabla identifica su fase y fecha; las referencias históricas conservan su procedencia.')}<div class="section-heading"><h2>Estado de las conexiones</h2></div><div id="v11-health"></div><details class="panel c-options"><summary>Estado de los escudos</summary>${window.CANCHA_BRAND.auditHTML()}</details><details class="panel c-options"><summary>Participantes y referencias por competición</summary><div class="sources-grid">${urls}</div></details><details class="panel c-options"><summary>Referencias históricas y cobertura</summary><div class="sources-grid"><div class="source-card"><h3>UEFA · Calendario</h3><p>Jornadas 3 y 4, resultados y próximos cruces. Fuente oficial.</p><a href="https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--2026-27-champions-league-all-the-phase-fixtures/" target="_blank" rel="noopener noreferrer">UEFA ↗</a></div><div class="source-card"><h3>Clasificación · Sky Sport</h3><p>36 equipos, puntos, goles, diferencia y forma al 21/10/2026.</p><a href="${safeURL(D.snapshotUCL.source)}" target="_blank" rel="noopener noreferrer">Sky Sport ↗</a></div><div class="source-card"><h3>Plantillas y posiciones</h3><p>ESPN aporta las plantillas consultadas. API-Football, football-data.org y TheSportsDB son fuentes opcionales; cada registro conserva su procedencia y cobertura.</p><a href="https://www.api-football.com/documentation-v3" target="_blank" rel="noopener noreferrer">Documentación de API-Football ↗</a></div><div class="source-card"><h3>Alcance de las actualizaciones</h3><p>Los marcadores se consultan periódicamente desde el servidor. La demora y el detalle dependen de la fuente; las estadísticas individuales cubren únicamente las actas analizadas.</p></div></div></details>`;
  }
  function notFound() {
    return `${makeTitle('CANCHA', 'Página no encontrada', 'Regresa a las competiciones y selecciona un club del catálogo.')}<a class="btn" href="${path('inicio')}">Volver al inicio</a>`;
  }
  let drawToken = 0;
  // Separate visits to the same URL can have different tabs and reading positions.
  history.scrollRestoration = 'manual';
  const visits = new Map();
  function entryKey() {
    if (!history.state?.canchaVisit) {
      history.replaceState({...history.state, canchaVisit:crypto.randomUUID?.() || String(Math.random())}, '');
    }
    return history.state.canchaVisit;
  }
  let entry = entryKey();
  let stopRestoring = () => {};
  function restoreScroll(y) {
    stopRestoring();
    if (!y) { window.scrollTo({top:0,behavior:'instant'}); return; }
    const observer = new ResizeObserver(move);
    const timer = setTimeout(stop, 15000);
    const interruptions = ['wheel','touchstart','pointerdown','keydown'];
    function stop() {
      observer.disconnect();
      clearTimeout(timer);
      interruptions.forEach(type => window.removeEventListener(type, stop, true));
    }
    function move() {
      window.scrollTo({top:y, behavior:'instant'});
      if (Math.abs(window.scrollY - y) <= 1) stop();
    }
    stopRestoring = stop;
    interruptions.forEach(type => window.addEventListener(type, stop, {capture:true, passive:true}));
    observer.observe(main);
    move();
  }
  async function draw(saved = null) {
    const generation = ++drawToken;
    let parts = (location.hash.replace(/^#\/?/, '').split('?')[0] || 'inicio')
        .split('/')
        .map((value) => {
          try {
            return decodeURIComponent(value);
          } catch {
            return null;
          }
        }),
      route = parts[0],
      id = parts[1],
      out = '';
    try {
      await window.CANCHA_LOAD_PAGE(route);
    } catch {
      if (generation === drawToken)
        main.innerHTML =
          '<p class="blank">No se pudo cargar esta sección. <button class="btn" data-retry-page>Reintentar</button></p>';
      return;
    }
    if (generation !== drawToken) return;
    if (saved) {
      Object.assign(S, saved.view);
      if (route === 'partidos') window.CANCHA_CALENDAR?.restore(saved.calendar);
      if (route === 'inicio') window.CANCHA_HOME?.restore(saved.home);
      if (route === 'equipos' || route === 'jugadores') window.CANCHA_DIRECTORY?.restore(saved.directory);
    }
    if (['evento', 'partido', 'encuentro'].includes(route)) window.CANCHA_UNIVERSAL.prepare(saved?.match);
    if (route === 'inicio') out = home();
    else if (route === 'competiciones') out = leaguesPage();
    else if (route === 'liga') {
      if (S.pageLeague !== id) S.leagueMetric = 'goals';
      const opensStandings =
        document.body.dataset.route !== 'liga' &&
        new URLSearchParams(location.hash.split('?')[1]).get('vista') === 'tabla';
      if (S.pageLeague !== id || (!saved && opensStandings)) S.leagueTab = 'tabla';
      S.pageLeague = id;
      out = leaguePage(id);
    } else if (route === 'equipos') out = teamsPage();
    else if (route === 'equipo') {
      S.teamTab = S.pageTeam === id ? S.teamTab : 'resumen';
      S.pageTeam = id;
      out = teamPage(id);
    } else if (route === 'jugadores') out = playersPage();
    else if (route === 'jugador') out = playerPage(id);
    else if (route === 'perfil') out = window.CANCHA_LIVE?.playerShell(id, parts[2]) || notFound();
    else if (route === 'partidos') out = matchList();
    else if (route === 'partido') {
      out = window.CANCHA_UNIVERSAL.staticMatch('ucl-j3-7');
    } else if (route === 'encuentro') out = window.CANCHA_UNIVERSAL.staticMatch(id);
    else if (route === 'evento')
      out = window.CANCHA_UNIVERSAL.remoteMatchShell(id, parts[2], parts[3]);
    else if (route === 'buscar') {
      out = findPage(
        new URLSearchParams(location.hash.split('?')[1] || '').get('q') || S.query || '',
      );
    } else if (route === 'fuentes') out = sourcesPage();
    else if (route === 'escudos') out = sourcesPage();
    else out = notFound();
    document.body.dataset.route = route;
    main.innerHTML = out;
    active();
    document.querySelectorAll('.m16-bottom-nav a').forEach((a) => {
      const section = ['competiciones', 'liga', 'equipo', 'equipos'].includes(route)
        ? 'competiciones'
        : ['jugadores', 'jugador', 'perfil'].includes(route)
          ? 'jugadores'
          : ['evento', 'encuentro', 'partido', 'partidos'].includes(route)
            ? 'partidos'
            : route;
      a.classList.toggle('active', a.dataset.section === section);
      if (a.dataset.section === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    window.CANCHA_LIVE?.afterDraw(route, id, parts.slice(2));
    window.CANCHA_UNIVERSAL?.afterDraw(route, id, parts.slice(2));
    window.CANCHA_INSIGHTS?.afterDraw(route, id, parts.slice(2));
    window.CANCHA_HOME?.afterDraw(route);
    window.CANCHA_DIRECTORY?.afterDraw(route);
    if (route === 'liga' && S.leagueTab === 'tabla') window.CANCHA_COMPETITION.load(id);
    window.CANCHA_ICONS?.upgrade(main);
    document.querySelectorAll('.tabs,.v13-match-tabs').forEach((t) => {
      const active = t.querySelector('.active,[aria-selected="true"]');
      if (active) t.scrollLeft = Math.max(0, active.offsetLeft - t.offsetLeft - 16);
    });
    document.title =
      (route === 'inicio'
        ? 'Tu centro de fútbol'
        : document.querySelector('h1')?.textContent || 'CANCHA') + ' · CANCHA V19.6';
    if (saved) restoreScroll(saved.y);
    else if (!S.keepScroll) window.scrollTo({top:0,behavior:'instant'});
    S.keepScroll = false;
    closeSide();
  }
  function refresh() {
    S.keepScroll = true;
    draw();
  }
  const mobileMenu = window.matchMedia('(max-width:900px)');
  function closeSide(restore = false) {
    const sidebar = byId('sidebar'),
      wasOpen = sidebar.classList.contains('open');
    sidebar.classList.remove('open');
    byId('backdrop').classList.remove('show');
    sidebar.inert = mobileMenu.matches;
    sidebar.setAttribute('aria-hidden', String(mobileMenu.matches));
    byId('menuButton').setAttribute('aria-expanded', 'false');
    document.querySelector('.workspace').inert = false;
    document.querySelector('.m16-bottom-nav').inert = false;
    document.body.style.removeProperty('overflow');
    if (wasOpen && mobileMenu.matches)
      (restore ? byId('menuButton') : main).focus({ preventScroll: true });
  }
  function openSide() {
    const sidebar = byId('sidebar');
    sidebar.inert = false;
    sidebar.setAttribute('aria-hidden', 'false');
    sidebar.classList.add('open');
    byId('backdrop').classList.add('show');
    byId('menuButton').setAttribute('aria-expanded', 'true');
    if (mobileMenu.matches) {
      document.querySelector('.workspace').inert = true;
      document.querySelector('.m16-bottom-nav').inert = true;
      document.body.style.overflow = 'hidden';
      byId('hideSidebar').focus({ preventScroll: true });
    }
  }
  mobileMenu.addEventListener('change', () => closeSide());

  window.CANCHA_REDRAW = () => {
    const sy = window.scrollY;
    S.keepScroll = true;
    nav();
    draw();
    window.scrollTo(0, sy);
  };
  window.addEventListener('hashchange', () => {
    stopRestoring();
    const route = document.body.dataset.route;
    visits.set(entry, {
      y:window.scrollY,
      view:{pageLeague:S.pageLeague, leagueTab:S.leagueTab, leagueMetric:S.leagueMetric, teamTab:S.teamTab, pageTeam:S.pageTeam, matchFilter:S.matchFilter},
      match:window.CANCHA_UNIVERSAL?.navigationState(),
      calendar:route === 'partidos' && window.CANCHA_CALENDAR?.snapshot(),
      home:route === 'inicio' && window.CANCHA_HOME?.snapshot(),
      directory:window.CANCHA_DIRECTORY?.snapshot(),
    });
    entry = entryKey();
    S.matchPlayer = null;
    draw(visits.get(entry));
  });
  byId('menuButton').setAttribute('aria-controls', 'sidebar');
  byId('menuButton').addEventListener('click', openSide);
  byId('hideSidebar').addEventListener('click', () => closeSide(true));
  byId('backdrop').addEventListener('click', () => closeSide(true));
  document.addEventListener('keydown', (e) => {
    if (!mobileMenu.matches || !byId('sidebar').classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSide(true);
      return;
    }
    if (e.key === 'Tab') {
      const items = [...byId('sidebar').querySelectorAll('a[href],button')].filter(
          (el) => !el.disabled && el.getClientRects().length,
        ),
        first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  byId('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    S.query = byId('searchInput').value;
    go('#/buscar?q=' + encodeURIComponent(S.query));
  });
  document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-retry-page]')) {
      draw();
      return;
    }
    const sc = e.target.closest('[data-scroll-target]');
    if (sc) {
      byId(sc.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const b = e.target.closest('[data-league-tab]');
    if (b) {
      S.leagueTab = b.dataset.leagueTab;
      S.leagueMetric = b.dataset.leagueMetric || 'goals';
      refresh();
      return;
    }
    const t = e.target.closest('[data-team-tab]');
    if (t) {
      S.teamTab = t.dataset.teamTab;
      refresh();
      return;
    }
    const f = e.target.closest('[data-match-filter]');
    if (f) {
      S.matchFilter = f.dataset.matchFilter;
      refresh();
      return;
    }
    const p = e.target.closest('[data-pitch-player]');
    if (p) {
      S.matchPlayer = p.dataset.pitchPlayer;
      refresh();
      return;
    }
    if (e.target.closest('[data-close-player]')) {
      S.matchPlayer = null;
      refresh();
      return;
    }
    if (e.target.closest('[data-jump-round]')) {
      const panel = document.querySelector('.c-round-panel');
      panel.tabIndex = -1;
      panel.focus({preventScroll:true});
      panel.scrollIntoView();
      return;
    }
    const r = e.target.closest('[data-fetch-roster]');
    if (r) {
      if (window.CANCHA_LIVE) window.CANCHA_LIVE.refreshRoster(r.dataset.fetchRoster);
      return;
    }
    const s = e.target.closest('[data-fetch-standings]');
    if (s) {
      if (window.CANCHA_LIVE) window.CANCHA_LIVE.refreshStandings(s.dataset.fetchStandings);
      return;
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'teamFilter') {
      S.query = e.target.value;
      let q = norm(S.query);
      document
        .querySelectorAll('.team-grid .team-tile')
        .forEach((a) => (a.style.display = norm(a.textContent).includes(q) ? '' : 'none'));
    }
  });
  nav();
  draw();
})();
