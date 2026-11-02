# CANCHA V18.2 · Revisión funcional

Se conserva el diseño compacto de V18.1: fondo morado liso, sombras discretas, avatares por club, tamaños de escudos y distribución de secciones. La revisión corrige comportamientos al navegar, filtrar y actualizar datos.

## Correcciones

| Apartado | Fallo observado y corrección |
| --- | --- |
| Navegación | Un fragmento de URL con una codificación incompleta podía detener la página. Ahora muestra la página no encontrada y permite seguir navegando. |
| Clasificación | Una respuesta parcial con varios grupos podía rellenar cada grupo con participantes de toda la competición. Cada grupo conserva únicamente sus clubes publicados. |
| Clasificación | La búsqueda admite nombres sin tilde. Las actualizaciones conservan el foco y la posición del cursor del buscador, el desplazamiento horizontal y la ayuda o fuente desplegadas. |
| Estadísticas | «Ver más» de asistencias o tarjetas abría goles. Cada tarjeta abre su métrica; ampliar la muestra mantiene la métrica seleccionada. |
| Inicio | Cada consulta automática convertía temporalmente los datos vigentes en copias antiguas y hacía desaparecer el destacado en vivo. Los datos vigentes se conservan mientras llega la respuesta; una consulta fallida sí se marca sin actualizar. Al volver a Inicio se verifica la copia guardada. |
| Calendario | Al cambiar de fecha podían quedar visibles los encuentros del día anterior mientras se esperaba la respuesta. Se separan las consultas por rango y competición, con un estado de carga explícito. |
| Calendario | Vaciar la fecha activa Hoy y sincroniza el campo. Una respuesta fallida puede conservar una copia de la misma consulta, rotulada sin actualizar, sin arrastrarla a otra fecha. Una consulta antigua deja de anunciar directos antes de verificarse. |
| Jornada lateral | El marcador lateral no se actualizaba junto a la clasificación. Ahora consulta la fecha seleccionada en el ciclo de actualización e informa si falla. Vaciar su fecha restaura la selección válida. |
| Centro del partido | Un marcador guardado o una actualización fallida podían conservar la etiqueta EN VIVO. Se retira esa etiqueta y se mantiene el último resultado con su aviso. |
| Cronología | Las tarjetas rojas tenían icono amarillo. Se distinguen expulsiones y amonestaciones, incluida la segunda amarilla. Un minuto ausente muestra un guion. |
| Alineaciones | Una actualización perdía el resaltado del jugador seleccionado. Se conserva, junto con el foco en la pestaña o camiseta y la posición de lectura. |
| Jugadores | Una entrada de club sin confirmar podía dejar resultados del club anterior. Se pide seleccionar una sugerencia y se ignoran las consultas que ya no corresponden a la selección. |
| Buscador global | Podía declarar que no había coincidencias y, a la vez, mostrar un futbolista del directorio. El mensaje final depende también de esa consulta. Una búsqueda vacía muestra instrucciones. |
| Menú móvil | El menú cerrado permitía enfocar enlaces fuera de pantalla y Escape no lo cerraba. Se gestiona la apertura, el teclado, el foco y el fondo mientras está abierto. |
| Fuentes | Se actualiza el texto que todavía describía V14 para reflejar ESPN como fuente principal y las otras integraciones como opcionales. |

## Verificación

- **91 pruebas automáticas** aprobadas: regresiones de datos, identidad, fuentes, caché, fechas, agenda, escudos, avatares y estados de marcadores.
- **23 pruebas de navegador con respuestas controladas**: errores y demoras de red, filtros, navegación inválida, copias antiguas, refrescos, foco y selección. Los datos de esos casos se simulan únicamente dentro del navegador de pruebas; no se incorporan al catálogo ni a la entrega.
- **180 comprobaciones de navegación** con las fuentes de la aplicación: apartados principales, las cuatro pestañas de las nueve competiciones, clubes de muestra, perfiles individuales y los 37 encuentros históricos. Recorridos de escritorio, 390 y 320 px; sin errores de JavaScript ni fallos pendientes en esos recorridos.
- Interacciones adicionales: acceso paginado a los **183 clubes** sin duplicarlos; filtros combinados; paginación, consulta de plantilla y apertura de perfil; calendario semanal y filtro por competición.
- Verificación del aspecto a **1920, 1440, 768, 390 y 320 px**, conservando el fondo, las sombras y la densidad de las tablas; sin desbordamientos de página.
- Comprobación de respuestas de error para fechas, rangos, clubes, ligas e identificadores de partido inválidos.

Evidencia en `review/v18-2/`: `fallos-reproducidos.json`, `regresiones.json`, `recorrido.json`, `interacciones.json`, `entrega.json`, `tests.txt` y capturas. La cobertura deportiva sigue dependiendo de las fuentes gratuitas; estas pruebas verifican el tratamiento de la información disponible y de sus fallos.

## Reproducir las pruebas

`npm test` ejecuta las pruebas de datos sin dependencias adicionales. `npm run test:browser` ejecuta las regresiones de interfaz contra un servidor CANCHA iniciado en otro terminal; requiere una instalación opcional de Playwright y Chromium. Se puede elegir la instalación existente con `CANCHA_PLAYWRIGHT_MODULE` y `CANCHA_CHROMIUM`, el servidor con `CANCHA_BASE_URL` y la carpeta de informes con `CANCHA_REVIEW_DIR`.

Para usar esta entrega, extrae el ZIP en una carpeta nueva, cierra el servidor anterior e inicia `INICIAR_CANCHA_WINDOWS.bat` o `npm start`. El pie y el lateral deben indicar **V18.2**. Los recursos llevan una versión nueva para evitar que el navegador reutilice los scripts anteriores.
