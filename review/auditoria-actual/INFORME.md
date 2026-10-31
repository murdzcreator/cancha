# Auditoría de CANCHA publicada en GitHub

> Informe histórico de la versión `168a62b`. Sus cuatro fallos reproducidos están corregidos en V15; ver `MEJORAS_V15.md` y `review/v15/`.

Versión examinada: commit `168a62bd162a8b773fd6031d79e65bdf3df47589` de `main`. Revisión del 30 de octubre de 2026, hora de Perú. Se inspeccionaron las rutas, servidor, adaptador ESPN, índice de jugadores y caché; se reprodujeron recorridos de navegador y casos controlados. No se modificó código de aplicación ni se publicó esta auditoría.

## Resultado

La conexión de partidos permite consultar marcadores, eventos, alineaciones, suplentes y algunas métricas individuales. No equivale todavía a un sistema completo de temporadas, plantillas, clasificaciones y rankings como elNine. En la versión publicada, Estadísticas de liga sigue siendo un aviso; Estadísticas de equipo combina una instantánea UCL con otro aviso y datos de clasificación cuando existen.

## Fallos confirmados, por prioridad

### 1. Texto de búsqueda interpretado como HTML — alta

`app.js:58` entrega la consulta al subtítulo de `makeTitle`; `app.js:15` inserta ese subtítulo sin escape en HTML. La ruta `/buscar/?q=...` permite llegar al renderizador. En navegador se insertó una imagen local inexistente con un manejador que solo establece una variable de prueba. La variable se ejecutó. No se enviaron datos a terceros ni se utilizaron credenciales.

Impacto: una URL manipulada puede ejecutar JavaScript en el contexto de la página. Corregir el tratamiento del texto de búsqueda antes de publicar más funciones. La prueba está registrada en `casos-adicionales.json`.

### 2. Marcadores nocturnos pueden dejar de actualizarse — alta

`server/espn.mjs:82` decide la vigencia de un día según su fecha: ayer se conserva seis horas. No examina si todavía contiene un encuentro en curso.

Reproducción controlada: 23:55 de Perú, marcador 0; tras pasar a las 00:15, la fuente de prueba tiene 1, pero CANCHA conserva 0 y `stale:false`. Se solicitó el día del partido una sola vez. Es un caso reproducido con fuente simulada, no la medición de un encuentro real. Los encuentros no finalizados deben conservar un intervalo corto de consulta aunque cambie el día.

Evidencia: `medianoche.json`.

### 3. Buscador general no funciona con su ruta habitual — alta

Formulario en `app.js:74`: genera `#/buscar?q=Arsenal`. El analizador de `app.js:68` toma `buscar?q=Arsenal` como nombre de ruta y no entra a `buscar`. Buscar Arsenal en el encabezado lleva a «Página no encontrada». Deben separarse ruta y consulta antes de resolver la vista, y unificarse la búsqueda con el índice de jugadores.

Evidencia: `navegador.json` y `busqueda.png`.

### 4. Al fallar la fuente se pierde el filtro de fecha — media/alta

`live.js:162` recupera el catálogo histórico filtrando liga y estado, pero omite la fecha seleccionada. Con 25/10/2026 y Champions seleccionados, al simular una respuesta 503 se mostraron 36 encuentros, incluidos partidos del 20/10. Hay aviso de fuente fallida, pero los encuentros contradicen el filtro elegido. Aplicar el mismo filtro al origen remoto y a la alternativa local, y mostrar vacío cuando corresponda.

Evidencia: `casos-adicionales.json` y `filtro-sin-conexion.png`.

### 5. Falta aviso consistente cuando Inicio conserva una copia — media

En `live.js:197-198`, si hay copia en localStorage y la petición falla, el bloque `catch` no agrega aviso. La fecha anterior queda visible, pero no se comunica explícitamente el fallo. Hallazgo por lectura del código, pendiente de reproducción específica en navegador.

## Datos y funciones que todavía faltan

| Área | Comprobación actual | Trabajo necesario |
| --- | --- | --- |
| Clasificaciones | Perú usa instantánea. Inglaterra usa tabla calculada desde solo 50 resultados del archivo | Conectar tablas de la temporada y fase elegidas; actualizar fecha y origen sin mezclar Apertura, Clausura y Acumulada |
| Plantillas/directorio | 55 jugadores en tres clubes: Alianza 33, PSG 11, Barcelona 11. Antes y después de abrir la ficha ESPN, el total siguió en 55 | Conectar plantillas ESPN al servidor y persistir identidades; distinguir plantilla del club y participantes de un encuentro |
| Perfil individual | Muestra datos personales del índice; no consulta estadísticas ESPN de temporada | Registrar participaciones por partido, temporada y club, con acumulados, promedios y cobertura |
| Estadísticas de equipos | Aviso de datos pendientes; solo instantáneas y clasificación parcial | Agregar rendimiento de temporada, local/visitante, forma, promedios y comparativas con una muestra explícita |
| Rankings de competición | Pestaña Estadísticas muestra aviso, sin listas | Goleadores, asistentes y disciplina con temporada, fase y partidos cubiertos |
| Calendario e historial | Día elegido y ventana cercana; en torneos por fases, la ventana inicial puede limitarse a hoy y mañana | Calendario completo por jornada, historial persistente y enfrentamientos previos entre clubes |
| Estadísticas del partido | Ejemplo peruano confirmado: dos alineaciones, 19 eventos y 19 métricas comparativas | Mejorar representación de cambios, ingreso/salida y parámetros adicionales cuando la fuente los publique |
| Experiencia de uso | Sin filtro exclusivo de En vivo ni filtro de equipo en calendario general | Agregar filtros y estado de actualización coherentes; después favoritos y otras mejoras opcionales |

Las métricas de pases, precisión, minutos, valoraciones y mapas de calor no deben darse por disponibles para todos los jugadores o ligas. El adaptador actual deja varios campos ausentes deliberadamente.

## Oportunidades gratuitas ya comprobadas

Se consultaron endpoints HTTPS del mismo host ESPN ya autorizado, sin clave ni servicio de pago:

- Clasificación de Perú 2026: HTTP 200, grupo Clausura con 18 equipos.
- Clasificación de Inglaterra 2026/27: HTTP 200, grupo de 20 equipos.
- Plantilla Alianza Lima 2026: HTTP 200, 31 futbolistas. La instantánea local tiene 33; requiere conciliar fecha/alcance, no reemplazar por cantidad sin validación.

Esto confirma muestras de disponibilidad, no una garantía permanente ni cobertura completa de las nueve ligas. Esos endpoints aún no alimentan las secciones correspondientes del servidor CANCHA; `rosterFor` y `standingsFor` siguen utilizando los proveedores previos.

Evidencia: `fuentes-disponibles.json`.

## Orden de trabajo recomendado

1. Corregir los cuatro fallos reproducidos y agregar verificaciones que fallen antes de corregirlos. Unificar avisos y fechas de las copias guardadas.
2. Integrar las tablas y plantillas gratuitas verificadas; conciliar clubes, temporada, fase y futbolistas. Hacer que directorio, búsqueda y perfiles utilicen los mismos registros.
3. Crear un almacén por partido, club, jugador y temporada. Completar la carga histórica con límites de consulta; una caché de ventanas no sustituye un historial de temporada.
4. Desarrollar acumulados, comparativas de equipos, rankings y perfiles de temporada a partir de esa cobertura. No extrapolar una temporada desde las últimas jornadas.
5. Después completar filtros En vivo/equipo, representación de cambios, accesibilidad y navegación móvil. Si se quiere abrir desde cualquier teléfono sin el PC encendido, preparar alojamiento del servidor y una URL pública; descargar el ZIP no publica un sitio web.

## Qué está validado y qué no

La entrega anterior registró 52 pruebas aprobadas y un recorrido de escritorio/móvil. Esta auditoría demuestra que esas verificaciones no cubrían todos los casos: buscador, URL de consulta como HTML, filtro alternativo y cruce de medianoche. No se afirma que la latencia de un partido real en curso esté medida. Las pruebas de navegador de esta auditoría no registraron excepciones JavaScript; los fallos descritos son de comportamiento y de tratamiento de entrada.
