# CANCHA V19.3 · Cifras por equipo y goles destacados

Las estadísticas del partido identifican el lado local y visitante con escudo, nombre y etiqueta. El local conserva el acento lavanda y el visitante usa un verde suave; las cifras y sus barras siguen ese mismo orden en Resumen y Estadísticas.

En **Últimos momentos**, los goles tienen fondo y borde destacados, escudo del equipo, minuto y autor. La asistencia aparece en una línea separada cuando la fuente identifica al asistente. El marcador tras el gol se muestra únicamente cuando está publicado en el evento. Los cambios y las tarjetas conservan su información con una presentación más discreta.

El filtro **Todos** muestra los cuatro eventos más recientes; **Goles** permite consultar todos los tantos publicados del partido, sin incluir penales de una tanda. El historial completo utiliza las mismas tarjetas. El filtro, el foco y la posición de lectura se conservan durante las actualizaciones del partido.

Se corrigió una ambigüedad del proveedor: los participantes de un gol podían aparecer unidos por una barra sin distinguir autor y asistente. Ahora se utilizan los papeles explícitos o el comentario del evento para separarlos. Una lista de participantes por sí sola no permite asignar una asistencia. Cuando el autor no está identificado se muestra esa condición; no se reconstruye un marcador contando eventos que podrían estar incompletos.

El fondo morado, las sombras discretas de los escudos y el modo de consulta de diez segundos durante el juego se conservan. La nueva clave de caché del detalle permite volver a consultar actas guardadas con el formato anterior.

## Verificación

- 125 pruebas de lógica aprobadas, incluidas siete de normalización de eventos.
- 38 regresiones de navegador aprobadas, incluidas la identidad de los lados, la conservación del filtro durante los avisos en vivo, los datos ambiguos y los nombres largos a 320 px.
- Comprobación de la ficha de ESPN del ejemplo a 1920, 1440, 768, 390 y 320 px: seis goles accesibles con el filtro, autor/asistencia y marcador publicados, sin errores de JavaScript ni desbordamiento del documento.

Evidencia: [review/v19-3/VALIDACION.md](review/v19-3/VALIDACION.md).

## Instalar

Cierra la consola anterior, extrae el ZIP de la edición ligera en una carpeta nueva y ejecuta `INICIAR_CANCHA_WINDOWS.bat` o `npm start`. El pie de página debe indicar **V19.3**. Si ya tienes un servicio en Render, utiliza **Manual Deploy → Deploy latest commit** para cargar esta versión.
