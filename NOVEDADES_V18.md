# CANCHA V18

Actualización sobre V17.2 que mantiene el diseño morado, los nueve torneos, los 183 clubes, los apartados existentes y las fuentes gratuitas. Conserva los avatares uniformes por club y el marcador compacto con escudos grandes.

## Cambios

1. **Marcas:** Premier League en morado; contorno blanco fino en los escudos para separar sus siluetas del fondo. Navegación y tarjetas de competiciones con una superficie violeta diferente.
2. **Fondo:** balón de fútbol dibujado como marca de agua, parcialmente recortado y con poca opacidad en escritorio. Se oculta en teléfono para favorecer la lectura.
3. **Clasificación:** fase y temporada visibles, puntos destacados, explicación de las abreviaturas al pulsar la cabecera, posiciones coloreadas y leyenda. Las ligas usan las notas de clasificación publicadas por ESPN; cuando no hay zonas publicadas se indica, sin trasladar las reglas de otro torneo. Champions usa las bandas 1–8, 9–24 y 25–36 del formato de fase de liga.
4. **Forma reciente:** cinco últimos resultados disponibles de esa competición, de antiguo a reciente. V/E/D conservan texto además del color. Pulsar abre un diálogo con fecha, clubes, marcador y enlace al partido. Una muestra menor se indica como 1/5, 2/5, etc.
5. **Jornada:** panel de partidos por fecha a la derecha de la clasificación; en móvil pasa inmediatamente debajo. Cambiar el día consulta encuentros de esa fecha, sin presentar la tabla actual como una tabla histórica.
6. **Líderes:** cuatro tarjetas de goles, asistencias, amarillas y rojas con acceso a estadísticas. El encabezado declara cuántas actas se analizaron. Se pueden consultar más actas en lotes de cuatro. Son líderes de la muestra, no un ranking individual oficial de toda la temporada.
7. **Directorios:** equipos con nombre y competición, 24 por página y ajuste del ancho en móvil. Jugadores con competición, club buscable y nombre, 25 por página y estados sin coincidencias. Se mantienen los avatares ilustrados con personalidad de cada equipo.
8. **Calendario:** Hoy por defecto, Mañana, siete días y fecha libre; filtros por torneo, club y estado. Agrupación por fecha y competición, 24 encuentros por página. Horarios de Perú y fecha civil conservada cuando no se publicó hora.
9. **Claridad:** cobertura separada para competición, club y jugador; las métricas ausentes conservan su ausencia. Fuentes extensas dentro de detalles desplegables, textos más breves e iconos SVG locales coherentes.

## Datos y funcionamiento

- Los próximos siguen combinando OpenFootball con la agenda ESPN por club `fixture=true`, validando club, torneo y temporada.
- Las rachas añaden los resultados por club `fixture=false`, con caché de seis horas y deduplicación antes de seleccionar cinco encuentros.
- La clasificación y sus zonas tienen una fuente independiente de los rankings de las actas. Las sanciones y puntos publicados se conservan.
- La muestra estadística consulta hasta cuatro actas nuevas al abrir una competición, y permite ampliarla. La información del club y del jugador usa su propia cobertura, sin repetir el total global.
- Las consultas pueden ser parciales o fallar. Se indican las fuentes disponibles y las copias pendientes de actualización. La entrega no incluye cachés personales ni credenciales.
- El cambio no añade un sistema de favoritos; quedó como posible mejora posterior.

## Marcas gráficas

Premier League: trazado monocromo de [Simple Icons](https://github.com/simple-icons/simple-icons/blob/develop/icons/premierleague.svg), con color de marca `#37003c`. Procedencia y hash en `assets/branding-manifest.json`. El balón de fondo y los iconos de interfaz son SVG locales.

## Verificación

- 90 pruebas automáticas: datos, caché, ESPN, OpenFootball, identidad, fechas, avatares, próximos y resultados, zonas, rachas, paginación y cobertura por entidad.
- Navegador Chromium a 1920, 1440, 768, 390 y 320 píxeles; comprobación de anchos, navegación y funcionamiento de filtros, fechas, paginación, diálogos y vista detallada.
- Consulta real de clasificación y resultados de las nueve competiciones; resumen en `review/v18/datos.json`.
- Evidencia de interfaz y registro de comprobaciones en `review/v18/`.

Para ejecutar: extraer en una carpeta nueva, cerrar el servidor anterior e iniciar `INICIAR_CANCHA_WINDOWS.bat` o `npm start`. El lateral y el pie deben indicar **V18**.
