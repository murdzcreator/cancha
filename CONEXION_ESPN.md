# CANCHA V17: conexión pública ESPN

La agenda futura se consulta por club con:

```text
https://site.api.espn.com/apis/site/v2/sports/soccer/{liga}/teams/{id}/schedule?season={año}&fixture=true
```

La respuesta se valida por club, temporada y competición de cada evento. Se eliminan duplicados por ID entre las agendas de los dos rivales. Las jornadas recientes de `scoreboard` tienen prioridad para el estado y marcador del mismo partido; una agenda se reutiliza hasta una hora y el marcador reciente se vuelve a consultar cada 45 segundos. Se comparten peticiones simultáneas, se limitan a cuatro conexiones y se conservan respuestas fechadas ante fallos.

Premier League y LaLiga se combinan con sus 380 partidos OpenFootball CC0. Como esas ligas juegan una vez por cada localía de una pareja en la temporada, ESPN puede sustituir la fecha provisional de OpenFootball aunque haya cambiado el día. Esa regla no se aplica a otras copas o ligas con posibles repeticiones. La jornada se filtra al final por la fecha de Perú; una fecha sin hora sigue siendo una fecha civil.

En **Partidos**, selecciona **Próximos** y **Jornadas cercanas** para consultar la agenda disponible, o fija una fecha. Las fichas de club muestran sus próximos encuentros de las competiciones del catálogo. La cobertura sigue siendo parcial: no se promete una temporada completa para todas las ligas ni estadísticas de cada partido.

No requiere claves de pago, dependencias npm ni SoccerData. Los escudos se sirven desde la biblioteca local. Las tablas, plantillas, fichas y fuentes existentes se conservan. Las métricas ausentes no se convierten en cero.

ESPN es un origen público, sin disponibilidad o latencia garantizadas; OpenFootball es CC0. No se verificó la latencia de un partido en vivo real. Para desactivar las consultas, usa `CANCHA_ESPN=0`; para desactivar la sincronización OpenFootball, `CANCHA_OPENFOOTBALL=0`.

En entornos con proxy, Node 24 utiliza la configuración heredada mediante `http.setGlobalProxyFromEnv`, manteniendo TLS. Fuera de ese entorno, Node 20 o superior puede consultar directamente.

Pruebas y cobertura real del 1 de noviembre de 2026: [NOVEDADES_V17.md](NOVEDADES_V17.md) y `review/v17/`.
