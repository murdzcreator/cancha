// CANCHA V19.5 · Node.js 20+ · sin dependencias externas
import http from 'node:http';
import { reconcileStandings } from './server/standings.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheLayer } from './server/cache.mjs';
import { makeProviders } from './server/providers.mjs';
import { createPlayerIndex } from './server/player-index.mjs';
import { readBranding } from './server/branding.mjs';
import { createSoccerDataImports } from './server/soccerdata-import.mjs';
import { createEspnProvider } from './server/espn.mjs';
import { createMatchRoutes } from './server/match-routes.mjs';
import { createPlayerRoutes } from './server/player-routes.mjs';
import { createHistory } from './server/history.mjs';
import { createFootballService } from './server/football-service.mjs';
import { createLiveChannel } from './server/live-channel.mjs';
import { respond, serveFile } from './server/http-response.mjs';
import { downloadOpenFootball } from './server/openfootball.mjs';
// Node 24 utiliza el proxy administrado cuando está presente; Node 20 no lo necesita en uso local.
if (
  (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) &&
  typeof http.setGlobalProxyFromEnv === 'function'
)
  http.setGlobalProxyFromEnv();
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const crestCount = Object.keys(
  readBranding(path.dirname(fileURLToPath(import.meta.url))).teams || {},
).length;
let crestStatus = {
  state: 'complete',
  local: crestCount,
  source: 'biblioteca local del ZIP aportado',
};
function loadEnv() {
  let filename = path.join(ROOT, '.env');
  if (!fs.existsSync(filename)) return;
  for (let row of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const m = row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv();
const raw = fs.readFileSync(path.join(ROOT, 'db.js'), 'utf8');
const db = JSON.parse(
  raw
    .slice(raw.indexOf('=') + 1)
    .trim()
    .replace(/;\s*$/, ''),
);
process.env.CANCHA_USAGE_PATH = path.join(ROOT, 'data-cache', 'api-football-quota.json');
const providers = makeProviders({ db }),
  cache = cacheLayer(path.join(ROOT, 'data-cache'));
const verifiedSnapshots = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'server', 'public-snapshots.json'), 'utf8'),
);
verifiedSnapshots.standings = reconcileStandings(verifiedSnapshots.standings);
const soccerdata = createSoccerDataImports(ROOT, db);
const espn = createEspnProvider({ db, enabled: process.env.CANCHA_ESPN !== '0' });
const history = createHistory(ROOT, db);
const dataKeysPresent = Boolean(process.env.FOOTBALL_DATA_KEY || process.env.API_FOOTBALL_KEY);
const playerIndex = createPlayerIndex(path.join(ROOT, 'data-cache'), {
  db,
  snapshots: verifiedSnapshots,
});
const football = createFootballService({ db, espn, soccerdata, history, cache, playerIndex });
const liveChannel = createLiveChannel({
  load: (key) => {
    const [lid, id] = key.split(':');
    return football.detail(lid, id);
  },
});
async function standingsFor(l) {
  try {
    return await espn.standings(l);
  } catch {}
  const local = soccerdata.standings(l);
  if (local?.quality.complete && !dataKeysPresent) return local;
  if (l === 'per' && !dataKeysPresent)
    return local?.quality?.complete ? local : verifiedSnapshots.standings;
  try {
    const live = await providers.getStandings(l);
    if (
      local &&
      ((local.quality.complete && !live.quality?.complete) ||
        local.quality.found > (live.quality?.found || 0))
    )
      return local;
    if (l === 'per' && !live.quality?.complete)
      return local?.quality.complete ? local : verifiedSnapshots.standings;
    return live;
  } catch (e) {
    if (local) return l === 'per' && !local.quality.complete ? verifiedSnapshots.standings : local;
    if (l === 'per') return verifiedSnapshots.standings;
    throw e;
  }
}
async function rosterFor(t) {
  try {
    return await espn.roster(t);
  } catch {}
  if (t === 'alianza-lima' && !dataKeysPresent) return verifiedSnapshots.roster;
  try {
    const live = await providers.getRoster(t);
    if (
      t === 'alianza-lima' &&
      (live.players || []).length < verifiedSnapshots.roster.players.length
    )
      return verifiedSnapshots.roster;
    return live;
  } catch (e) {
    if (t === 'alianza-lima') return verifiedSnapshots.roster;
    throw e;
  }
}
const leagues = new Set(db.leagues.map((x) => x.id));
const teams = new Set(Object.keys(db.teams));
function send(res, status, data) {
  respond(res.req, res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
  }).catch(() => res.destroy());
}
function ttl(kind) {
  return {
    standings: 60 * 60_000,
    fixtures: 5 * 60_000,
    roster: 7 * 24 * 60 * 60_000,
    player: 12 * 60 * 60_000,
  }[kind];
}
const mimes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};
const featureRoutes = {
  ...createMatchRoutes({
    leagues,
    db,
    cache,
    football,
    providers,
    soccerdata,
    liveChannel,
    send,
    ttl,
  }),
  ...createPlayerRoutes({ teams, db, espn, providers, cache, playerIndex, rosterFor, send, ttl }),
};
async function router(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') {
    send(res, 405, { error: 'Método no permitido' });
    return;
  }
  if (url.pathname === '/api/branding/status') {
    send(res, 200, crestStatus);
    return;
  }
  if (url.pathname === '/api/branding/manifest') {
    send(res, 200, readBranding(ROOT));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/health') {
      send(res, 200, {
        version: '19.5',
        server: true,
        asOf: new Date().toISOString(),
        providers: { ...providers.status, espn: espn.status().enabled },
        espn: espn.status(),
        liveCredentialsConfigured: dataKeysPresent,
        soccerdataImports: soccerdata.status(),
        hasImportedFixtures: soccerdata.status().some((x) => x.fixtures > 0),
        calendarCoverage: db.leagues.map((l) => ({
          league: l.id,
          count: history.fixtures(l.id, soccerdata.fixtures(l.id)).length,
        })),
        playerCoverage: playerIndex.coverage(),
        snapshotFallbacks: ['per', 'alianza-lima'],
        competitions: db.leagues.map((x) => ({ id: x.id, name: x.name, season: x.season })),
      });
      return;
    }
    if (url.pathname === '/api/club-profile') {
      const id = url.searchParams.get('team');
      if (!teams.has(id)) {
        send(res, 404, { error: 'Club desconocido' });
        return;
      }
      try {
        const data = await cache.retrieve('club-profile:' + id, 72 * 60 * 60_000, () =>
          providers.getClubProfile(id),
        );
        send(res, 200, data);
      } catch (err) {
        send(res, 503, { error: 'Ficha pública adicional no disponible', detail: err.message });
      }
      return;
    }
    const l = url.searchParams.get('league'),
      t = url.searchParams.get('team'),
      force = url.searchParams.get('refresh') === '1';
    try {
      const handle = featureRoutes[url.pathname];
      if (handle) {
        await handle({ req, res, url });
        return;
      }
      if (
        ['/api/analytics', '/api/enrich', '/api/head-to-head', '/api/history/load'].includes(
          url.pathname,
        )
      ) {
        if (!leagues.has(l)) {
          send(res, 400, { error: 'Competición no válida' });
          return;
        }
        const local = soccerdata.fixtures(l);
        if (url.pathname === '/api/history/load') {
          const current = await espn.fixtures(l);
          history.observe(l, current);
          const today = globalThis.CANCHA_DATES.dayInPeru(),
            dates = (current.availableDates || [])
              .filter((d) => d < today && !history.days(l).includes(d))
              .slice(-4);
          const result = await Promise.allSettled(
            dates.map(async (day) => {
              const d = await espn.fixtures(l, day);
              history.observe(l, d);
              return d.events.length;
            }),
          );
          send(res, 200, {
            added: result.filter((r) => r.status === 'fulfilled').reduce((n, r) => n + r.value, 0),
            days: result.filter((r) => r.status === 'fulfilled').length,
            failed: result.filter((r) => r.status === 'rejected').length,
            remaining: (current.availableDates || []).filter(
              (d) => d < today && !history.days(l).includes(d),
            ).length,
          });
          return;
        }
        if (url.pathname === '/api/enrich') {
          if (t && !db.leagues.find((x) => x.id === l).teams.includes(t)) {
            send(res, 400, { error: 'Equipo no válido' });
            return;
          }
          send(res, 200, await football.enrich(l, t || ''));
          return;
        }
        const a = history.analytics(l, local);
        if (url.pathname === '/api/head-to-head') {
          const home = url.searchParams.get('home'),
            away = url.searchParams.get('away'),
            members = db.leagues.find((x) => x.id === l).teams;
          if (home === away || !members.includes(home) || !members.includes(away)) {
            send(res, 400, { error: 'Rivales no válidos' });
            return;
          }
          send(res, 200, {
            league: l,
            season: a.season,
            events: a.events.filter(
              (m) =>
                m.status === 'FINAL' &&
                ((m.home === home && m.away === away) || (m.home === away && m.away === home)),
            ),
            scope: a.scope,
          });
          return;
        }
        const view = url.searchParams.get('view') || 'full';
        if (
          !['full', 'league', 'team', 'player'].includes(view) ||
          (t && !db.leagues.find((x) => x.id === l).teams.includes(t))
        ) {
          send(res, 400, { error: 'Ámbito no válido' });
          return;
        }
        send(
          res,
          200,
          football.analytics(l, {
            view,
            team: t || '',
            player: url.searchParams.get('player') || '',
          }),
        );
        return;
      }
      if (url.pathname === '/api/competition' && leagues.has(l)) {
        const view = url.searchParams.get('view') || 'summary';
        if (
          !['summary', 'results', 'rankings'].includes(view) ||
          (t && !db.leagues.find((x) => x.id === l).teams.includes(t))
        ) {
          send(res, 400, { error: 'Ámbito no válido' });
          return;
        }
        send(res, 200, await football.overview(l, view, t || ''));
        return;
      }
      if (url.pathname === '/api/standings' && leagues.has(l)) {
        const local = soccerdata.standings(l);
        let d = await cache.retrieve('standings:zones:v18:' + l, 300000, () => standingsFor(l), {
          force,
        });
        send(res, 200, d);
        return;
      }
      send(res, 404, { error: 'Recurso o liga inexistente' });
    } catch (err) {
      send(res, 503, {
        error: 'No hay respuesta verificable disponible',
        detail: err.message,
        canRetry: true,
      });
    }
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (
    pathname === '/' ||
    pathname === '/centro.html' ||
    pathname === '/partido-psg-barcelona-2026.html'
  )
    pathname = '/index.html';
  const file = path.resolve(ROOT, '.' + pathname),
    relative = path.relative(ROOT, file);
  if (
    relative.startsWith('..') ||
    path.isAbsolute(relative) ||
    relative.startsWith('server/') ||
    relative.startsWith('data-cache/') ||
    relative.startsWith('data-imports/') ||
    relative.startsWith('scripts/') ||
    relative.startsWith('work/') ||
    relative.startsWith('output/') ||
    pathname.split('/').some((part) => part.startsWith('.')) ||
    pathname.startsWith('/test/') ||
    path.extname(file) === '.mjs'
  ) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }
  try {
    const type = mimes[path.extname(file).toLowerCase()];
    if (!type) {
      res.writeHead(403);
      res.end();
      return;
    }
    await serveFile(req, res, file, type, path.extname(file) === '.html');
  } catch {
    if (!res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Archivo no encontrado');
    }
  }
}
export function startServer(
  port = Number(process.env.PORT || 4173),
  host = process.env.HOST || '127.0.0.1',
) {
  const server = http.createServer((req, res) => {
    router(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, { error: 'Error interno' });
    });
  });
  server.on('close', () => {
    liveChannel.close();
    Promise.all([history.flush(), playerIndex.flush()]).catch(() => {});
  });
  server.listen(port, host, () =>
    console.log(`CANCHA V19.5: http://${host}:${server.address().port}`),
  );
  if (process.env.CANCHA_OPENFOOTBALL !== '0') {
    const sync = () => downloadOpenFootball(ROOT, db, { timeoutMs: 8000 }).catch(() => {});
    sync();
    const timer = setInterval(sync, 6 * 3600000);
    timer.unref();
    server.on('close', () => clearInterval(timer));
  }
  // Escudos locales empaquetados: sin descarga automática, ni cambios silenciosos.
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = startServer();
  const close = async () => {
    liveChannel.close();
    server.close();
    await Promise.all([history.flush(), playerIndex.flush()]);
  };
  process.once('SIGINT', () => close().catch(() => {}));
  process.once('SIGTERM', () => close().catch(() => {}));
}
