# CANCHA V17 · Noche violeta

Implementado desde `origin/main`, commit `77f70440cc767b39f9ad7c3bc4eac870b2002c06`, comprobado con el remoto antes de editar. La versión se entrega en la rama `cancha-v17` con descarga ZIP de GitHub, autorizada por el usuario. No se publica un sitio web.

## Diseño

- Fondo morado oscuro, paneles berenjena/violeta y acentos lavanda en todos los apartados.
- Se elimina la cabecera grande encima de la portada; el logo CANCHA se conserva en el lateral.
- Destacado de la jornada con escudos de 88 px en escritorio y 66 px en teléfono. Sin partidos válidos para la fecha/filtro, conserva el estado vacío existente.
- Filas compactas, clasificación contextual, navegación lateral y navegación inferior en móvil. Se mantienen Inicio, Competiciones, Partidos, Equipos, Jugadores y Fuentes, junto con sus pestañas.

## Próximos partidos

Se consulta la agenda ESPN por cada club con `fixture=true` y la temporada del catálogo, junto con las jornadas recientes de `scoreboard`. Se validan club, temporada y liga de cada evento; se deduplican los IDs y se da prioridad al marcador reciente. Las agendas se reutilizan una hora; los marcadores mantienen su consulta periódica de 45 segundos. No se añaden claves de pago ni dependencias de ejecución.

Premier y LaLiga se combinan con los 380 encuentros OpenFootball de cada temporada. Se sustituye la fecha provisional por la publicada en ESPN aunque cambie el día, conservando los dos orígenes. Esa reconciliación por localía se limita a estas dos ligas; otras competiciones mantienen sus posibles repeticiones. El filtro de jornada se aplica después de combinar, en hora de Perú.

Las cifras de próximos de la ficha de club se actualizan con la consulta, en vez de conservar el contador del catálogo estático.

## Validación

- 71 pruebas funcionales correctas, incluidas 8 nuevas sobre agendas, temporadas, otras copas, deduplicación, caché, fallos, Perú y reprogramaciones. Registro: `review/v17/pruebas.txt`. En este entorno Node 24 se ejecutó `node --test --test-isolation=none test/*.test.mjs`; el comando habitual sigue siendo `npm test`.
- Chromium a 1440×1000, 768×1024, 390×844 y 320×740: portada, filtros, menú y clasificación sin errores JavaScript ni desbordamiento horizontal.
- Recorridos adicionales a 1440 y 390 px: competiciones, búsqueda de equipos, Manchester United y su próximo ante Aston Villa, plantilla ESPN, perfil, directorio, filtros del calendario y las cinco pestañas de un partido real, además de Fuentes.
- Arranque en una carpeta limpia sin caché ni historial: portada HTTP 200, rechazo de fecha inválida HTTP 400, 380 partidos por cada liga abierta y exclusión del Barcelona–Alavés ya finalizado del domingo. Registro: `review/v17/inicio-limpio.json`.
- Consultas reales a las nueve competiciones el **1 de noviembre de 2026, hora de Perú**. Todas respondieron HTTP 200, con todas las agendas de club y cero parejas duplicadas en la muestra. Premier y LaLiga mantienen exactamente 380 partidos.

| Competición | Partidos disponibles | Próximos vigentes | Agendas con respuesta |
| --- | ---: | ---: | ---: |
| per | 29 | 25 | 18/18 |
| ucl | 90 | 90 | 36/36 |
| esp | 380 | 275 | 20/20 |
| eng | 380 | 292 | 20/20 |
| arg | 30 | 23 | 30/30 |
| ita | 292 | 287 | 20/20 |
| fra | 234 | 230 | 18/18 |
| bra | 52 | 50 | 20/20 |
| mex | 28 | 21 | 18/18 |

Los recuentos son una captura de la consulta, no una garantía de cobertura futura ni de calendario completo en todas las ligas. No se midió la latencia durante un partido en vivo. Se mantienen los avisos de cobertura y los datos ausentes.

Las capturas y los resultados estructurados están en `review/v17/`. Para iniciar, extrae todo y ejecuta `INICIAR_CANCHA_WINDOWS.bat`, o `npm start` en macOS/Linux, con Node.js 20+. No requiere `npm install`.
