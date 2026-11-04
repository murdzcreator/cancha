# Verificación de CANCHA V19.3

- `pruebas.txt`: 125 pruebas de lógica aprobadas. Los siete casos nuevos verifican roles de goleador/asistente independientes del orden, ambigüedad, ausencia de asistencia, papeles explícitos, validación del marcador, tandas/autogoles y pertenencia del equipo.
- `regresiones.json`: 38 regresiones de navegador. Las cuatro nuevas verifican encabezados de equipos en ambas vistas, todos los goles y conservación de filtro/foco al recibir avisos, ausencia de atribuciones inventadas y presentación segura a 320 px con nombres largos y tiempo añadido.
- `fuente-real.json`: recorrido de la ficha ESPN del ejemplo a 1920, 1440, 768, 390 y 320 px, incluyendo Resumen, Estadísticas e Historial. Se comprobaron seis goles, el último autor y su asistencia, el marcador accesible y ausencia de errores de JavaScript o desbordamiento del documento.
- `resumen-1440.png`, `resumen-390.png`, `goles-1440.png` y `goles-390.png`: capturas de las vistas. Los marcadores corresponden al acta consultada durante la prueba.

Los datos simulados de las regresiones se limitan a las pruebas. La aplicación utiliza los eventos del proveedor y no asigna funciones a partir del orden de los participantes. El marcador de cada gol procede del evento; no se calcula contando una cronología potencialmente incompleta. La comprobación de un acta concreta no garantiza igual cobertura en todos los partidos.
