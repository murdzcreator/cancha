# Validación de CANCHA V19

- `pruebas.txt`: 108 pruebas aprobadas de normalización, caché, persistencia, coherencia de resultados, temporadas, estadísticas y empaquetado.
- `regresiones.json`: 30 regresiones de navegador aprobadas. Incluye fuentes caídas, consultas pendientes, filtros, foco/cursor, selección de jugador, recargas, módulos por página, carga diferida de rankings, resumen de club y marcador al desplazarse.
- `recorrido.json`: 180 comprobaciones aprobadas, sin fallos ni errores de JavaScript. Nueve ligas y sus pestañas en escritorio, clubes de muestra, 37 partidos históricos, fuentes, búsquedas, directorios y perfiles; recorridos adicionales a 390 y 320 px.
- `espacios.json`: 36 verificaciones de seis páginas en 1920, 1440, 1280, 768, 390 y 320 px. Sin desbordamiento horizontal del documento.
- `interacciones.json`: seis comprobaciones adicionales. Paginación de los 183 clubes sin duplicados, filtros combinados, jugadores/plantilla/perfil, calendario semanal y alineaciones en móvil.
- `rendimiento.json`: mediciones de peticiones en frío con respuestas controladas, tamaños del archivo consultado y conservación de nodos durante un refresco. Los datos controlados se usan exclusivamente en pruebas.
- Capturas `*-1440.png` y `*-390.png`: vistas reales de Inicio, Premier League, Arsenal, jugadores, calendario y partido histórico. Una captura de página completa puede mostrar la barra inferior fija en la altura del primer encuadre.

Comandos reproducibles:

```sh
npm test
npm run build:check
CANCHA_PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs CANCHA_CHROMIUM=/ruta/a/chromium CANCHA_REVIEW_DIR=review/v19 npm run test:browser
```

Playwright y Chromium son herramientas opcionales de desarrollo. El uso normal no requiere instalarlos. La navegación y las capturas consultaron fuentes reales; las regresiones de errores/directo usan respuestas controladas en el navegador de pruebas. El tamaño y la cobertura de los archivos ESPN cambian con las consultas posteriores.
