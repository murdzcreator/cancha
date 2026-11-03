# CANCHA V19.2

Centro de fútbol con nueve competiciones y 183 clubes del catálogo. Combina calendarios abiertos de OpenFootball con clasificaciones, plantillas y actualizaciones de partidos de ESPN, sin claves de pago.

## Edición ligera y web compartible

Para usar y enviar por ZIP, descarga la edición ligera de la rama `cancha-ligera`. Conserva las funciones, escudos y fuentes; deja las capturas, pruebas, informes históricos y fuentes duplicadas en la rama de desarrollo. Generador: `npm run package:runtime`; la salida se crea en una carpeta nueva dentro de `output/`.

Para que los visitantes entren solo con un enlace, el servidor debe estar alojado. La configuración Node/Docker y la guía están en [PUBLICAR_WEB.md](PUBLICAR_WEB.md). [Publicar la prueba gratuita en Render](https://render.com/deploy?repo=https://github.com/murdzcreator/cancha/tree/cancha-ligera). `render.yaml` prepara ese servicio; descargar este proyecto no crea ni publica un servicio. El modo rápido y su verificación están en [NOVEDADES_V19_2.md](NOVEDADES_V19_2.md). Las novedades de empaquetado están en [NOVEDADES_V19_1.md](NOVEDADES_V19_1.md).

## Descargar y ejecutar

1. Pulsa **Code → Download ZIP** y extrae todo en una carpeta nueva.
2. Instala Node.js 20 o superior.
3. Ejecuta `INICIAR_CANCHA_WINDOWS.bat` y mantén abierta la consola.

También puedes ejecutar `npm start`. No se necesitan dependencias npm adicionales ni Python. La dirección que aparece es local: descargar el proyecto no publica un sitio web en internet.

## Qué puedes consultar

- **Inicio:** partidos del día en hora de Perú, fecha elegible, filtros de estado y competición, destacado de esa jornada y grupos por liga.
- **Diseño:** fondo morado oscuro, superficies violeta y acentos lavanda. Portada sin título grande, logo lateral, destacado con escudos de 88 px en escritorio y 66 px en móvil, paneles compactos y navegación inferior en teléfono. La cabecera de cada partido tiene ancho máximo de 920 px y escudos de 96 px en escritorio. Las fichas de club muestran filas de próximos/resultados con escudos, fechas breves, filtro por competición y paginación. Se conservan las pestañas y apartados anteriores. Los escudos llevan sombras discretas, Premier League conserva su marca morada y el bloque de competiciones mantiene otra tonalidad. El fondo recupera el morado liso de V17.2.

- **Competiciones → Clasificación:** tablas ESPN con fase/grupo, puntos y orden publicados por la fuente. Puntos destacados, ayuda en las cabeceras y leyenda de las zonas publicadas por la fuente. Rachas V/E/D de los cinco últimos resultados disponibles, con detalle al pulsar. En teléfono, puntos/PJ/DG y rachas debajo del equipo; **Vista detallada** permite consultar todas las columnas. La tabla usa filas, columnas y cabecera compactas. A su lado aparece la jornada por fecha, y debajo los cuatro rankings a lo ancho de la página; en móvil se elige una métrica. Las actas se consultan al acercarse al bloque. Cambiar la fecha de los partidos conserva la clasificación actual.
- **Partidos:** abre en **Hoy**, con accesos **Mañana**, **Próximos 7 días** y fecha libre; 24 encuentros por página agrupados por día y competición. Filtros por competición, equipo y estado; los filtros secundarios se pliegan en móvil. Premier League y LaLiga conservan sus 380 partidos de OpenFootball y reciben los horarios y marcadores de ESPN. Las fechas reprogramadas sustituyen al horario provisional sin duplicar el encuentro.
- **Equipo → Resumen:** franja compacta de posición/puntos, próximo partido y último resultado en paralelo. Las listas completas y su paginación están en **Partidos**.
- **Equipo → Plantilla:** jugadores de temporada consultados desde ESPN. Avatares ilustrados uniformes con colores, patrón y escudo de cada club; dorsal publicado o iniciales. Cada jugador abre su perfil. El mismo diseño se utiliza en el directorio y las fichas; consulta [AVATARES_CLUBES.md](AVATARES_CLUBES.md).
- **Equipo → Estadísticas:** resultados, G/E/P, goles, promedios, vallas invictas, local/visitante, forma y rivales, dentro de la muestra disponible.
- **Competiciones → Estadísticas:** comparación de equipos y rankings de goles, asistencias y tarjetas de las actas analizadas.
- **Equipos:** búsqueda y filtro por competición; 24 clubes por página.
- **Jugadores:** búsqueda por nombre, competición y club con sugerencias; 25 por página y opción **Consultar más clubes**. Tarjetas en tres columnas amplias, dos en tablet y una en teléfono. Las plantillas se recuperan de forma progresiva, no se presentan todas como precargadas.
- **Perfil:** participaciones y métricas publicadas en las actas guardadas. Un campo ausente no se convierte en cero.

**Cargar jornadas anteriores** amplía el historial con fechas publicadas por la fuente. **Ampliar estadísticas de jugadores** analiza más actas de los resultados disponibles. La cobertura y las cifras pendientes permanecen visibles; estos rankings no se anuncian como clasificaciones individuales oficiales de toda la temporada.

Prueba: Partidos → Perú → 25/10/2026 → Comerciantes Unidos–Cienciano. Después abre un futbolista o consulta las estadísticas de esos clubes.

## Actualizaciones y límites

En las fichas en juego, el modo rápido comparte una consulta cada 10 segundos y envía avisos al navegador al detectar cambios. La caché de directo se limita a 5 segundos. Si los avisos no están disponibles, se usan consultas de respaldo. Las previas se consultan cada 30–60 segundos y el final confirmado detiene el seguimiento. Inicio y calendario usan 10 segundos con partidos en juego y 30 segundos en los demás casos, con la página visible. Los próximos combinan las jornadas recientes con la agenda ESPN por club (`schedule?season=…&fixture=true`), reutilizada durante una hora; se validan el club, la liga y la temporada antes de combinar los datos. Los resultados por club (`fixture=false`) se reutilizan hasta seis horas para construir las rachas de cada competición. Las tablas se reutilizan hasta cinco minutos y las plantillas hasta seis horas. OpenFootball se sincroniza en segundo plano al arrancar y se comprueba periódicamente, con un intervalo mínimo de un día entre descargas.

La cobertura de resultados, actas y métricas depende del origen. No se garantiza latencia de transmisión en vivo. La interfaz usa las temporadas del catálogo actual; no incorpora todas las temporadas históricas ni mapas de calor o valoraciones inventadas.

Los archivos personales de caché e historial están en `data-cache/`, que no se publica en GitHub. Puedes configurar fuentes opcionales en `.env` siguiendo `.env.example`; no compartas ese archivo. `CANCHA_ESPN=0` desactiva las consultas ESPN; `CANCHA_OPENFOOTBALL=0` desactiva su sincronización automática.

## Validación

Ejecuta `npm test` (118 pruebas). La validación de V19 está en [NOVEDADES_V19.md](NOVEDADES_V19.md) y `review/v19/`. La auditoría anterior de V18.2 está en [AUDITORIA_V18_2.md](AUDITORIA_V18_2.md) y `review/v18-2/`, con 23 regresiones de navegador y 180 comprobaciones de navegación. El ajuste visual y su validación están en [AJUSTE_VISUAL_V18_1.md](AJUSTE_VISUAL_V18_1.md) y `review/v18-1/`. Las novedades de base están en [NOVEDADES_V18.md](NOVEDADES_V18.md) y `review/v18/`. La corrección de las fichas de club y del marcador está en [CORRECCION_PARTIDOS_17_2.md](CORRECCION_PARTIDOS_17_2.md) y `review/partidos-17-2/`. Las novedades anteriores y su evidencia están en [NOVEDADES_V17.md](NOVEDADES_V17.md) y `review/v17/`. El rediseño, sus límites y los recorridos de navegador están en [REDISENO_V16.md](REDISENO_V16.md) y `review/v16/`. Los detalles de las correcciones, verificación de las nueve tablas, plantillas de muestra y recorridos de escritorio/móvil están en [MEJORAS_V15.md](MEJORAS_V15.md) y `review/v15/`.

## Desarrollo

Los módulos siguen siendo JavaScript vanilla. Después de editar fuentes JS/CSS, ejecuta `npm run build`; `npm run build:check` verifica que los paquetes entregados están al día. El ZIP incluye los paquetes y arranca directamente con `npm start`. La entrada `client/bootstrap.js` carga cada sección bajo demanda, y `cancha.css` reúne las hojas en su orden de cascada.
