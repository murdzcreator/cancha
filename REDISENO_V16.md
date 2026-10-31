# CANCHA V16 · La jornada en primer plano

El inicio anterior mezclaba una presentación estática con un calendario de temporada. V16 centra la pantalla en los partidos de la fecha elegida, aumenta el tamaño de lectura y agrupa las estadísticas en filas compactas.

## Portada

- Consulta las nueve competiciones para el día actual en **America/Lima**. Los instantes de madrugada UTC se asignan al día correspondiente de Perú; una fecha sin hora conserva su día civil.
- Selector de fecha, día anterior/siguiente, botón Hoy y selección de competición.
- Filtros Todos, En vivo, Próximos y Finalizados con contadores de la fecha y competición seleccionadas.
- Grupos de liga plegables. El destacado se elige entre los partidos visibles: directo vigente, próximo encuentro o último resultado final. No se rellena una jornada vacía con encuentros de otra fecha.
- Columna de clasificación y accesos en escritorio. La clasificación conserva la fase y fecha de su propia fuente: elegir una jornada pasada no la convierte en una tabla histórica de ese día.
- Consulta cada 45 segundos mientras la pestaña está visible. Hoy cambia de día al pasar medianoche en Perú; una fecha elegida manualmente permanece fija.
- Los errores y las copias guardadas se identifican. Un estado EN VIVO guardado y sin actualizar no entra en el contador de directos ni recibe su resaltado.

## Lectura y navegación

- Fondo verde muy oscuro, superficies discretas y lima reservado para acciones y cifras relevantes. Se conserva la identidad y los escudos locales de CANCHA.
- Texto base de 16 px, nombres de equipos de 16–17 px, tablas de 14–15 px y marcadores más destacados.
- En teléfono cada partido muestra los dos equipos apilados y sus marcadores alineados a la derecha. La navegación principal queda en la parte inferior.
- Las ocho métricas principales se agrupan en dos bloques de filas, con etiquetas y valores alineados. La cobertura parcial sigue visible; la explicación y las acciones para ampliar datos se despliegan a pedido.
- Las clasificaciones móviles muestran Equipo, PTS, PJ y DG, además del puesto. **Vista detallada** recupera G/E/P/GF/GC/Forma con desplazamiento dentro de la tabla. El filtro y el modo se conservan al actualizar la misma competición.
- La ficha del partido tiene pestañas Resumen, Alineaciones, Estadísticas, Historial e Información. Admiten teclado y mantienen la ruta del partido. El refresco conserva la pestaña seleccionada.
- Las alineaciones usan una lista legible en teléfono. Seleccionar un futbolista abre un diálogo inferior con sus métricas disponibles y enlace al perfil. Admite cierre, Escape, fondo y devolución del foco al jugador.

## Datos y límites

Se mantienen ESPN, OpenFootball y las importaciones existentes. Este rediseño no añade una fuente ni amplía por sí solo la cobertura estadística. No transforma las actas de muestra en estadísticas oficiales de toda la temporada ni estima los campos ausentes.

Las fuentes gratuitas pueden responder con demora o no publicar determinados encuentros. La distribución de jugadores sobre la cancha es esquemática; no representa posiciones observadas ni seguimiento en tiempo real. No se ha desplegado un sitio público como parte del rediseño.

La referencia visual fue el análisis previo de elNine: jerarquía de información, filas alineadas, contexto lateral y detalles progresivos. La interfaz utiliza componentes y estilos propios; no incorpora capturas ni código de esa página.

## Verificación

- **63 pruebas automatizadas:** las 59 comprobaciones previas más cuatro casos de jornada, prioridad del destacado, estados antiguos, zona horaria, escape y fechas ausentes. La comprobación antigua de navegación ahora inspecciona el HTML renderizado de las pestañas.
- **Chromium:** portada, filtros, controles de fecha, clasificación, buscador, calendario, métricas agrupadas, pestañas por teclado y apertura de perfiles; sin errores JavaScript en los recorridos registrados.
- Pantallas de **360, 390, 768, 1024 y 1440 px**, sin desbordamiento horizontal de la página en los recorridos registrados. La tabla completa conserva su propio desplazamiento.
- Respuestas reales: jornada del 25/10/2026, cuatro partidos de Perú y ficha Comerciantes Unidos–Cienciano con 22 titulares y 19 estadísticas.
- Respuestas simuladas exclusivamente en pruebas: medianoche peruana, fecha fija, fuente caída, exclusión de partidos de otro día, directo antiguo y fallo de refresco de ficha.

El registro está en [review/v16/navegador.json](review/v16/navegador.json); las capturas de escritorio y teléfono están en la misma carpeta. Para repetir la suite de datos: `npm test`.
