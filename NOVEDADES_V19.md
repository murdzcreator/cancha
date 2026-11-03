# CANCHA V19 · Carga progresiva, datos coherentes y mejor distribución

Se conserva el morado liso de V17.2, la tabla compacta, las sombras discretas de los escudos, la Premier League morada y los avatares ilustrados. Siguen disponibles las nueve competiciones, los 183 clubes y las secciones anteriores.

## Cambios visibles

- **Inicio:** al elegir una competición, las siguientes consultas se limitan a ella. Las filas y el destacado se actualizan conservando sus nodos y el foco. El panel lateral enlaza al calendario y la ficha de esa competición.
- **Liga:** clasificación y jornada primero; los cuatro rankings ocupan el ancho inferior en escritorio, dos columnas en tablet y una métrica elegible en teléfono. Se reserva espacio durante la carga de la tabla para evitar saltos. Las rachas se completan después de la primera vista; las actas esperan a que el bloque de rankings se acerque a la pantalla.
- **Club:** el resumen reúne posición/puntos y un próximo partido y último resultado en paralelo. Las listas completas, sus filtros y la paginación permanecen en **Partidos**. Las competiciones del encabezado son enlaces.
- **Centro del partido:** la previa explica horario, estadio y disponibilidad de alineaciones. Durante el juego muestra marcador, minuto o estado y eventos/estadísticas publicados. En las pestañas largas aparece un marcador compacto cuando la cabecera sale de la pantalla. Al fallar la actualización, conserva la copia e indica **Sin actualizar**.
- **Jugadores:** tres columnas en pantallas amplias, dos en tablet y una en móvil. Las fichas distinguen jugadores de plantilla, referencias y registros de actas; separan la fecha de consulta de plantilla de la observación del jugador.
- **Calendario móvil:** fecha, estado y conteo permanecen a mano; competición/equipo se agrupan en filtros plegables.

## Correcciones y organización del código

- Una respuesta anterior no puede degradar un marcador verificado. Se admiten correcciones posteriores del resultado; un acta en vivo o desfasada sigue pendiente de análisis final.
- El índice de jugadores conserva club y temporada, migra los registros anteriores y excluye otras temporadas del listado actual.
- La caché libera las consultas fallidas, incluso con errores síncronos, y respeta el plazo de reintento. Las consultas simultáneas comparten trabajo.
- Historial e índice usan colas de escritura asíncrona y reemplazo atómico. Las actualizaciones idénticas no reescriben todo el historial. Un archivo pequeño conserva las fechas de verificación para proteger también después de reiniciar.
- Se reutilizan los cálculos de estadísticas y se envía únicamente el ámbito solicitado: liga, club o jugador. Las solicitudes del día y de detalle tienen prioridad sobre las agendas pendientes; se conserva el límite de cuatro consultas ESPN simultáneas.
- El servidor separa servicio de fútbol, presentación de respuestas, persistencia y entrega HTTP. Los recursos de texto se comprimen con gzip; los estáticos admiten ETag y revalidación.
- `client/bootstrap.js` carga paquetes por sección; `client/api.js` comparte consultas y `client/ui.js` conserva nodos al actualizar. Se retiraron rutas de presentación y consultas remotas antiguas que ya no se utilizaban.
- `npm run build` genera los paquetes vanilla y la hoja `cancha.css`; `npm run build:check` comprueba su correspondencia. El ZIP incluye lo generado y sigue arrancando con `npm start`, sin instalar dependencias.

## Medidas y validación

En las consultas controladas en frío, sin incluir actas, abrir una liga requiere **2 consultas diarias**. Al completar resultados, Premier League pasa de 42 a 22 consultas y Champions de 74 a 38. Las agendas futuras completas se consultan al abrir su calendario. Estos conteos no representan la latencia de ESPN.

La entrada de Inicio pasa de 26 archivos JS/CSS a 5; su conjunto ocupa aproximadamente **83 KB con gzip**. En el archivo de Premier usado para medir, la respuesta de estadísticas pasa de unos 538 KB completos a 2,4 KB para un club o 1,4 KB para un jugador. Los tamaños dependen de la muestra guardada. En la prueba de refresco, se conservaron la fila enfocada y el destacado, sin retirarlos del DOM; con Premier elegida se consultó una sola liga.

Se aprobaron **108 pruebas de lógica**, **30 regresiones de navegador**, **180 comprobaciones de navegación**, **36 verificaciones de espacio en seis anchos (320–1920 px)** y seis interacciones adicionales de paginación, filtros y perfiles. Evidencia y capturas en [review/v19](review/v19/VALIDACION.md).

## Alcance del directo

Los partidos activos se consultan cada **45 segundos** con la pestaña visible. ESPN puede publicar con demora; minuto, alineaciones, sustituciones, tarjetas y estadísticas aparecen cuando la fuente los aporta. Los resultados finales dejan de sondearse continuamente. Las estadísticas individuales siguen siendo una muestra de actas analizadas: **no se presentan como rankings completos de temporada**. Una copia antigua no se anuncia como directo verificado.

## Uso

Extrae el ZIP en una carpeta nueva, cierra el servidor anterior y ejecuta `INICIAR_CANCHA_WINDOWS.bat` o `npm start`. El lateral, el pie y la consola deben indicar **V19**. No se incluyen claves, cachés personales ni dependencias npm.
