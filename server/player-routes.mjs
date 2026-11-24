export function createPlayerRoutes({
  teams,
  db,
  espn,
  providers,
  cache,
  playerIndex,
  rosterFor,
  send,
  ttl,
}) {
  const rosterAttempts = new Map();
  return {
    async '/api/rosters/sync'({ res }) {
      const current = playerIndex.coverage(),
        pending = Object.keys(db.teams).filter(
          (t) =>
            !current.some(
              (r) =>
                r.team === t &&
                r.rosterSource === 'ESPN' &&
                Date.now() - Date.parse(r.rosterFetchedAt) < 24 * 3600000,
            ) && Date.now() - (rosterAttempts.get(t) || 0) > 1800000,
        ),
        batch = pending.slice(0, 6);
      const results = await Promise.allSettled(
        batch.map(async (t) => {
          rosterAttempts.set(t, Date.now());
          const d = await espn.roster(t);
          if (d.stale) throw Error('Copia antigua');
          playerIndex.addRoster(d);
          return t;
        }),
      );
      send(res, 200, {
        added: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
        remaining: Math.max(0, pending.length - batch.length),
        coverage: playerIndex.coverage().length,
      });
    },
    async '/api/players'({ res, url }) {
      const integer = (v, fallback, max) =>
        /^\d+$/.test(v || '') ? Math.min(max, Number(v)) : fallback;
      const count = Math.max(1, integer(url.searchParams.get('limit'), 80, 100));
      const offset = integer(url.searchParams.get('offset'), 0, 100000);
      send(
        res,
        200,
        playerIndex.listing({
          q: url.searchParams.get('q') || '',
          team: url.searchParams.get('team') || '',
          league: url.searchParams.get('league') || '',
          season: url.searchParams.get('season') || '',
          limit: count,
          offset,
        }),
      );
    },
    async '/api/player-profile'({ res, url }) {
      const t = url.searchParams.get('team') || '',
        id = url.searchParams.get('id') || '';
      if (!teams.has(t)) {
        send(res, 404, { error: 'Club desconocido' });
        return;
      }
      const p = playerIndex.one(t, id);
      if (!p) {
        send(res, 404, { error: 'Jugador no documentado en el índice local' });
        return;
      }
      send(res, 200, p);
    },
    async '/api/roster'({ res, url }) {
      const t = url.searchParams.get('team');
      if (!teams.has(t)) return send(res, 404, { error: 'Recurso o liga inexistente' });
      const force = url.searchParams.get('refresh') === '1';
      let d = await cache.retrieve('roster:v18:' + t, 21600000, () => rosterFor(t), { force });
      if (d.players?.length) playerIndex.addRoster(d);
      send(res, 200, d);
    },
    async '/api/player-stats'({ res, url }) {
      const t = url.searchParams.get('team');
      if (!teams.has(t)) return send(res, 404, { error: 'Recurso o liga inexistente' });

      const player = url.searchParams.get('player'),
        provider = url.searchParams.get('source');
      if (
        !/^\d{1,12}$/.test(player || '') ||
        !['TheSportsDB', 'API-Football', 'football-data.org', 'Liga1Oficial'].includes(provider)
      ) {
        send(res, 400, { error: 'Identificador de jugador incorrecto' });
        return;
      }
      let d = await cache.retrieve(
        ['player-v15', t, player, provider].join(':'),
        ttl('player'),
        () =>
          provider === 'Liga1Oficial'
            ? Promise.resolve({
                source: 'Liga 1 (ficha pública)',
                updatedAt: null,
                rows: [],
                note: 'La ficha oficial registra nombre, posición, nacimiento y nacionalidad; no publica estadísticas individuales. No se inventan cifras.',
              })
            : providers.getPlayerStats(t, player, provider),
      );
      send(res, 200, d);
    },
  };
}
