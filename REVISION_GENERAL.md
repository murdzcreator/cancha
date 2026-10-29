# Revisión general de CANCHA

Revisión del ZIP `CANCHA_V14_2_Partidos_Corregidos.zip`, realizada el 29/10/2026. Se conservaron el diseño y los 183 clubes. El ZIP original permanece separado de esta entrega.

## Cambios aplicados

- Fechas compartidas entre servidor e interfaz: un día sin hora sigue siendo un día sin hora. No se inventan las 12:00, ni se desplaza el día por la zona del navegador. Los instantes con zona se muestran en hora de Perú, con año y zona visibles. Se rechazan días imposibles y horas ambiguas sin zona.
- OpenFootball convierte correctamente los horarios de verano/invierno de Inglaterra y España. Las horas ausentes se muestran como «hora por confirmar».
- Los partidos programados cuyo horario ya pasó se señalan como «Horario vencido · estado sin actualizar». No se convierten en finalizados ni se inventan marcadores.
- El calendario general permite elegir entre las nueve competiciones y filtrar finalizados o próximos. Antes solo usaba el catálogo local de Champions. Se conserva paginación y se avisa por liga cuando falla una fuente.
- Los perfiles de club consultan todas sus competiciones y separan resultados recientes de próximos encuentros. Ya no toman simplemente los primeros ocho partidos del archivo de temporada.
- Estadísticas de partidos unidas al identificador del equipo local/visitante: el orden de respuesta de la API no debe invertirlas. Las alineaciones y las estadísticas de jugadores también se asocian por equipo, sin heredar cifras del rival por ocupar el mismo lugar en una lista.
- Las fichas de partidos rechazan competiciones o temporadas incompatibles cuando la fuente aporta esos identificadores. Las tablas también comprueban la temporada publicada cuando está presente.
- Estadísticas individuales de API-Football filtradas por club, competición y temporada. En TheSportsDB se distinguen PJ, goles y asistencias; cero goles ya no se sustituye por el número de apariciones.
- Los enteros inválidos no se truncan para convertirlos en estadísticas; se distinguen cero y dato ausente. Un «FINAL» sin dos marcadores válidos queda sin confirmar. Los programados, cancelados y aplazados no muestran un 0–0 provisional como resultado.
- Diferencia de goles reconciliada con GF − GC conservando el valor original y un aviso. Caso detectado: Juan Pablo II, acumulada peruana, GF 45 / GC 56 / DG declarada −15. Se muestra −11 como cálculo, sin alterar puntos ni posición ni afirmar cuál cifra publicó oficialmente el organizador.
- Resumen del equipo ampliado con G/E/P y GF/GC/DG y procedencia histórica o calculada. No se atribuye el estadio habitual del local al partido si la fuente no publica su sede.
- Las importaciones se leen al consultar sin quedar ocultas por un caché antiguo. Se renovaron las claves de caché de esquemas corregidos. El servidor valida parámetros de paginación de jugadores.
- El estado de conexión se consulta también al entrar directamente a una liga o ficha.

## Cobertura revisada

Se verificaron en las nueve competiciones la integridad de los clubes del catálogo, ausencia de duplicados internos y pertenencia de los equipos de los encuentros locales. Esto no certifica que todos los participantes sean los oficiales de la temporada: esa comprobación externa completa sigue pendiente.

| Competición | Clubes del catálogo | Datos disponibles en esta entrega |
| --- | ---: | --- |
| Liga 1 Perú | 18 | Instantáneas de Acumulada y Clausura; no calendario completo |
| Champions League | 36 | Tabla histórica y 36 encuentros locales; no cobertura completa |
| LaLiga | 20 | 380 partidos OpenFootball; 69 con resultado |
| Premier League | 20 | 380 partidos OpenFootball; 50 con resultado |
| Argentina | 30 | Catálogo; resultados y métricas adicionales dependen del proveedor |
| Serie A | 20 | Catálogo; resultados y métricas adicionales dependen del proveedor |
| Ligue 1 | 18 | Catálogo y un encuentro local de referencia |
| Brasil | 20 | Catálogo; resultados y métricas adicionales dependen del proveedor |
| Liga MX | 18 | Catálogo; resultados y métricas adicionales dependen del proveedor |

Premier y LaLiga se actualizaron realmente desde `raw.githubusercontent.com/openfootball/football.json/master/2026-27/`, sustituyendo los diez encuentros iniciales por liga. La fecha de descarga no significa que todos los resultados estén al día: la fuente conserva encuentros vencidos sin marcador. La clasificación calculada usa únicamente los resultados disponibles, no es una tabla oficial ni un servicio en vivo.

Las plantillas de referencia y los datos históricos del ZIP conservan sus limitaciones. OpenFootball no suministra alineaciones, eventos ni métricas individuales. Las claves privadas no están configuradas; una prueba real del proveedor público TheSportsDB terminó en `fetch failed`. No se verificó cobertura actual externa de las otras siete competiciones ni de todos los jugadores. Los entrenadores y las alineaciones de referencia no se han certificado como actuales.

## Validación

- 42 pruebas automatizadas ejecutadas y aprobadas: 32 existentes y 10 nuevas. Resultado en `review/pruebas.txt`.
- Las nuevas pruebas cubren fechas imposibles, zonas horarias, hora desconocida, verano/invierno, selección de partidos cercanos, integridad de las nueve ligas, enteros, marcadores incompletos, inversión de estadísticas y alineaciones, temporada/competición y diferencia de goles.
- HTTP real: portada, archivo de fechas, salud, calendarios de Inglaterra y España, tabla peruana, índice de jugadores y detalle importado. Verificados los 380 partidos que entrega el servidor por liga después de actualizar. Archivos `.env`, datos internos y módulos del servidor permanecen bloqueados por HTTP.
- Chromium: navegación por calendarios de las nueve ligas, selector general, enlace a ficha importada, pestaña Estadísticas sin romper la ruta y separación de resultados del club. Sin errores JavaScript. En móvil de 390 × 844 no se detectó desbordamiento horizontal.
- En esas pruebas de interfaz, Inglaterra y España usan la API local real; los fallos de los calendarios externos de las otras ligas se simulan para comprobar su manejo. No constituyen una validación de sus proveedores.
- Capturas: `review/partido-desktop.png` y `review/calendario-mobile.png`.
- No se probó el lanzador Windows en Windows ni se publicaron cambios en GitHub o un sitio en producción.

## Cómo usar esta entrega

Extrae el ZIP completo en una carpeta nueva. En Windows ejecuta `INICIAR_CANCHA_WINDOWS.bat`, con Node.js 20 o superior. El inicio conserva la sincronización OpenFootball existente. No copies un archivo `.env` de otra persona ni lo publiques.

En una terminal: `npm start`. Para las pruebas: `npm test`. No hay dependencias npm externas que instalar. En un entorno de nube que suministra proxy HTTP a Node.js 24, usa `NODE_USE_ENV_PROXY=1 npm start` y `NODE_USE_ENV_PROXY=1 node scripts/sincronizar-openfootball.mjs --forzar` para respetar ese proxy. No desactives TLS.

Para completar calendarios, plantillas y métricas de todas las ligas se requiere una fuente con cobertura comprobada de cada temporada y conectividad operativa. Las claves se introducen de forma local y segura mediante `.env`, según `.env.example`. Esta entrega no incluye secretos ni promete cobertura que las fuentes actuales no entregan.
