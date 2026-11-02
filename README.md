# CANCHA V18.2

Centro de fútbol con nueve competiciones y 183 clubes del catálogo. Combina calendarios abiertos de OpenFootball con clasificaciones, plantillas y actualizaciones de partidos de ESPN, sin claves de pago.

## Descargar y ejecutar

1. Pulsa **Code → Download ZIP** y extrae todo en una carpeta nueva.
2. Instala Node.js 20 o superior.
3. Ejecuta `INICIAR_CANCHA_WINDOWS.bat` y mantén abierta la consola.

También puedes ejecutar `npm start`. No se necesitan dependencias npm adicionales ni Python. La dirección que aparece es local: descargar el proyecto no publica un sitio web en internet.

## Qué puedes consultar

- **Inicio:** partidos del día en hora de Perú, fecha elegible, filtros de estado y competición, destacado de esa jornada y grupos por liga.
- **Diseño V18.1:** fondo morado oscuro, superficies violeta y acentos lavanda. Portada sin título grande, logo lateral, destacado con escudos de 88 px en escritorio y 66 px en móvil, paneles compactos y navegación inferior en teléfono. La cabecera de cada partido tiene ancho máximo de 920 px y escudos de 96 px en escritorio. Las fichas de club muestran filas de próximos/resultados con escudos, fechas breves, filtro por competición y paginación. Se conservan las pestañas y apartados anteriores. Los escudos llevan sombras discretas, Premier League conserva su marca morada y el bloque de competiciones mantiene otra tonalidad. El fondo recupera el morado liso de V17.2.

- **Competiciones → Clasificación:** tablas ESPN con fase/grupo, puntos y orden publicados por la fuente. Puntos destacados, ayuda en las cabeceras y leyenda de las zonas publicadas por la fuente. Rachas V/E/D de los cinco últimos resultados disponibles, con detalle al pulsar. En teléfono, puntos/PJ/DG y rachas debajo del equipo; **Vista detallada** permite consultar todas las columnas. La tabla usa filas, columnas y cabecera compactas. A su lado aparece la jornada por fecha, y debajo cuatro tarjetas compactas de líderes de las actas analizadas. Cambiar la fecha de los partidos conserva la clasificación actual.
- **Partidos:** abre en **Hoy**, con accesos **Mañana**, **Próximos 7 días** y fecha libre; 24 encuentros por página agrupados por día y competición. Filtros por competición, equipo y estado. Premier League y LaLiga conservan sus 380 partidos de OpenFootball y reciben los horarios y marcadores de ESPN. Las fechas reprogramadas sustituyen al horario provisional sin duplicar el encuentro.
- **Equipo → Plantilla:** jugadores de temporada consultados desde ESPN. Avatares ilustrados uniformes con colores, patrón y escudo de cada club; dorsal publicado o iniciales. Cada jugador abre su perfil. El mismo diseño se utiliza en el directorio y las fichas; consulta [AVATARES_CLUBES.md](AVATARES_CLUBES.md).
- **Equipo → Estadísticas:** resultados, G/E/P, goles, promedios, vallas invictas, local/visitante, forma y rivales, dentro de la muestra disponible.
- **Competiciones → Estadísticas:** comparación de equipos y rankings de goles, asistencias y tarjetas de las actas analizadas.
- **Equipos:** búsqueda y filtro por competición; 24 clubes por página.
- **Jugadores:** búsqueda por nombre, competición y club con sugerencias; 25 por página y opción **Consultar más clubes**. Las plantillas se recuperan de forma progresiva, no se presentan todas como precargadas.
- **Perfil:** participaciones y métricas publicadas en las actas guardadas. Un campo ausente no se convierte en cero.

**Cargar jornadas anteriores** amplía el historial con fechas publicadas por la fuente. **Ampliar estadísticas de jugadores** analiza más actas de los resultados disponibles. La cobertura y las cifras pendientes permanecen visibles; estos rankings no se anuncian como clasificaciones individuales oficiales de toda la temporada.

Prueba: Partidos → Perú → 25/10/2026 → Comerciantes Unidos–Cienciano. Después abre un futbolista o consulta las estadísticas de esos clubes.

## Actualizaciones y límites

Los marcadores se consultan cada 45 segundos mientras la página está visible. Los próximos combinan las jornadas recientes con la agenda ESPN por club (`schedule?season=…&fixture=true`), reutilizada durante una hora; se validan el club, la liga y la temporada antes de combinar los datos. Los resultados por club (`fixture=false`) se reutilizan hasta seis horas para construir las rachas de cada competición. Las tablas se reutilizan hasta cinco minutos y las plantillas hasta seis horas. OpenFootball se sincroniza en segundo plano al arrancar y se comprueba periódicamente, con un intervalo mínimo de un día entre descargas.

La cobertura de resultados, actas y métricas depende del origen. No se garantiza latencia de transmisión en vivo. La interfaz usa las temporadas del catálogo actual; no incorpora todas las temporadas históricas ni mapas de calor o valoraciones inventadas.

Los archivos personales de caché e historial están en `data-cache/`, que no se publica en GitHub. Puedes configurar fuentes opcionales en `.env` siguiendo `.env.example`; no compartas ese archivo. `CANCHA_ESPN=0` desactiva las consultas ESPN; `CANCHA_OPENFOOTBALL=0` desactiva su sincronización automática.

## Validación

Ejecuta `npm test` (91 pruebas). La auditoría de esta entrega está en [AUDITORIA_V18_2.md](AUDITORIA_V18_2.md) y `review/v18-2/`, con 23 regresiones de navegador y 180 comprobaciones de navegación. El ajuste visual y su validación están en [AJUSTE_VISUAL_V18_1.md](AJUSTE_VISUAL_V18_1.md) y `review/v18-1/`. Las novedades de base están en [NOVEDADES_V18.md](NOVEDADES_V18.md) y `review/v18/`. La corrección de las fichas de club y del marcador está en [CORRECCION_PARTIDOS_17_2.md](CORRECCION_PARTIDOS_17_2.md) y `review/partidos-17-2/`. Las novedades anteriores y su evidencia están en [NOVEDADES_V17.md](NOVEDADES_V17.md) y `review/v17/`. El rediseño, sus límites y los recorridos de navegador están en [REDISENO_V16.md](REDISENO_V16.md) y `review/v16/`. Los detalles de las correcciones, verificación de las nueve tablas, plantillas de muestra y recorridos de escritorio/móvil están en [MEJORAS_V15.md](MEJORAS_V15.md) y `review/v15/`.
