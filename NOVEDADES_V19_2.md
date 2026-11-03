# CANCHA V19.2 · Modo rápido y avisos del servidor

La ficha de un partido en juego comparte una consulta cada **10 segundos** entre sus espectadores conectados a la misma instancia. El servidor envía un aviso al navegador cuando cambian el marcador, minuto, eventos, alineaciones o estadísticas. Si la respuesta solo confirma los mismos datos, envía una comprobación pequeña y conserva los nodos de la ficha.

## Qué cambia

- La caché de directo pasa de 45 a **5 segundos**, tanto en el servicio como en el proveedor. Esto permite que cada ciclo de 10 segundos pueda obtener una respuesta nueva.
- El servidor usa avisos SSE nativos. No necesita instalar paquetes npm ni una fuente de pago. Las conexiones se renuevan periódicamente para funcionar también con alojamientos gratuitos.
- Si los avisos no están disponibles o se pierde la conexión, el cliente utiliza consultas de respaldo. Los fallos conservan el último marcador y muestran **Sin actualizar**.
- La ficha incorpora **Última consulta hace X s**, con el intervalo de consulta y un aviso si la comprobación se retrasa. La hora de procedencia también se actualiza al recibir una comprobación nueva.
- La previa usa 30 segundos cerca del inicio y 60 segundos si está lejos. El final confirmado detiene el seguimiento continuo. Ocultar o abandonar la ficha cierra su conexión; volver a verla la reanuda.
- Inicio y calendario usan 10 segundos cuando su consulta contiene partidos en juego y 30 segundos en los demás casos. Las solicitudes largas no se apilan y los cambios de ruta descartan las respuestas anteriores.
- Las actualizaciones conservan la pestaña, el jugador seleccionado, el foco, la posición de lectura y el historial ya cargado. La clasificación sigue teniendo su caché de cinco minutos.
- Se corrigió la respuesta de detalle para que un error de actualización no pierda la marca de copia antigua al recuperar el historial guardado.

## Verificación

**118 pruebas de lógica** y **34 regresiones de navegador** aprobadas. Las ocho nuevas pruebas cubren frecuencias/caché, consultas compartidas, mensajes de comprobación, finales, desconexiones, límites de conexiones, errores y recuperación de la copia antigua. Las cuatro nuevas regresiones prueban avisos, respaldo, pausa/reanudación y cierre al finalizar.

Además, dos navegadores reales —escritorio y móvil— se conectaron al mismo servidor de avisos con un partido controlado exclusivamente para pruebas. Compartieron una consulta inicial. Un cambio del marcador llegó a ambos en unos **9 segundos**, conservando foco y selección; se verificaron la comprobación sin cambios, el fallo de fuente y el cierre después del final. Esa medida es una prueba del circuito de CANCHA, no una garantía de latencia de ESPN.

Se construyó y arrancó el contenedor con Node 22. La ficha real de Villarreal–PSG abrió por SSE con ESPN y mostró su comprobación de diez segundos. Otras 24 comprobaciones de ocho vistas a 1440, 390 y 320 px no detectaron recursos locales ausentes, errores de JavaScript ni desbordamiento del documento.

Evidencia en [review/v19-2](review/v19-2/VALIDACION.md).

## Alcance

Los 10 segundos son la frecuencia de consulta durante el juego. La demora total también depende del tiempo que tarde ESPN en publicar y distribuir cada evento y de la conexión. CANCHA no inventa goles, minutos ni estadísticas para aparentar actividad.

El paquete sigue siendo la edición ligera, de aproximadamente 9,5 MB, con todas las secciones y escudos. La configuración gratuita de Render sigue preparada en [PUBLICAR_WEB.md](PUBLICAR_WEB.md); esta entrega no crea una cuenta ni publica un servicio allí.

## Instalar

Cierra la consola de la versión anterior, extrae el ZIP nuevo en una carpeta distinta y ejecuta `INICIAR_CANCHA_WINDOWS.bat` o `npm start`. El pie debe indicar **V19.2**. La ficha en juego mostrará el contador de la última consulta y el intervalo de 10 segundos.

Si ya tienes CANCHA alojada en Render con la configuración entregada, usa **Manual Deploy → Deploy latest commit** para cargar el código de V19.2. Los partidos de días posteriores no necesitan un despliegue nuevo.
