import { serveMatchStream } from './live-channel.mjs';
import { normalize } from './dates.mjs';
export function createMatchRoutes({
  leagues,
  db,
  cache,
  football,
  providers,
  soccerdata,
  liveChannel,
  send,
  ttl,
}) {
  return {
    async '/api/match-stream'({ req, res, url }) {
      const l = url.searchParams.get('league');
      const id = url.searchParams.get('id');
      if (!leagues.has(l) || !/^\d{1,12}$/.test(id || '')) {
        send(res, 400, { error: 'Partido no válido' });
        return;
      }
      serveMatchStream(req, res, liveChannel, l + ':' + id);
    },
    async '/api/fixtures'({ res, url }) {
      const l = url.searchParams.get('league');
      const t = url.searchParams.get('team');
      if (!leagues.has(l)) return send(res, 404, { error: 'Recurso o liga inexistente' });
      const force = url.searchParams.get('refresh') === '1';

      if (t) {
        if (!db.leagues.find((x) => x.id === l).teams.includes(t)) {
          send(res, 400, { error: 'Equipo no válido' });
          return;
        }
        send(res, 200, await football.fixtures(l, null, t));
        return;
      }
      const from = url.searchParams.get('from'),
        to = url.searchParams.get('to');
      if (from || to) {
        if (
          !from ||
          !to ||
          from.length !== 10 ||
          to.length !== 10 ||
          normalize(from) !== from ||
          normalize(to) !== to ||
          to < from ||
          Date.parse(to) - Date.parse(from) > 6 * 864e5
        ) {
          send(res, 400, { error: 'Rango no válido; elige hasta siete días' });
          return;
        }
        const d = await cache.retrieve(
          'fixtures:combined:v19-fast:' + l,
          (d) => (globalThis.CANCHA_LIVE_POLICY.eventsInterval(d?.events) === 10000 ? 5000 : 20000),
          () => football.fixtures(l),
        );
        send(res, 200, {
          ...d,
          events: d.events.filter((m) => {
            const day =
              m.date.length === 10 ? m.date : globalThis.CANCHA_DATES.dayInPeru(new Date(m.date));
            return day >= from && day <= to;
          }),
          range: { from, to },
        });
        return;
      }
      const day = url.searchParams.get('date');
      if (day && (day.length !== 10 || normalize(day) !== day)) {
        send(res, 400, { error: 'Fecha no válida; utiliza AAAA-MM-DD' });
        return;
      }
      if (day) {
        send(res, 200, await football.fixtures(l, day));
        return;
      }
      if (process.env.CANCHA_ESPN === '0') {
        const local = soccerdata.fixtures(l);
        if (local?.events.length) {
          send(res, 200, local);
          return;
        }
        send(
          res,
          200,
          await cache.retrieve(
            'fixtures:v15:' + l,
            ttl('fixtures'),
            () => providers.getFixtures(l),
            { force },
          ),
        );
        return;
      }
      const d = await cache.retrieve(
        'fixtures:combined:v19-fast:' + l,
        (d) => (globalThis.CANCHA_LIVE_POLICY.eventsInterval(d?.events) === 10000 ? 5000 : 20000),
        () => football.fixtures(l),
      );
      send(res, 200, d);
    },
    async '/api/match-detail'({ res, url }) {
      const l = url.searchParams.get('league');
      if (!leagues.has(l)) return send(res, 404, { error: 'Recurso o liga inexistente' });

      const id = url.searchParams.get('id'),
        source = url.searchParams.get('source');
      if (
        !/^\d{1,12}$/.test(id || '') ||
        !['API-Football', 'football-data.org', 'TheSportsDB', 'SoccerData', 'ESPN'].includes(source)
      ) {
        send(res, 400, { error: 'Origen o identificador no válido' });
        return;
      }
      if (source === 'ESPN') {
        send(res, 200, await football.detail(l, id));
        return;
      }
      if (source === 'SoccerData') {
        const local = soccerdata.match(l, id);
        if (!local) {
          send(res, 404, { error: 'Partido importado no encontrado' });
          return;
        }
        send(res, 200, local);
        return;
      }
      let d = await cache.retrieve(
        ['fixture-detail-v15', l, source, id].join(':'),
        10 * 60_000,
        () => providers.getMatchDetail(l, source, id),
      );
      send(res, 200, d);
    },
  };
}
