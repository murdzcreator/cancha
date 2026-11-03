# Verificación del modo rápido

- `pruebas.txt`: 118 pruebas aprobadas; incluye ocho de política de directo, cachés, avisos compartidos, estados de error, cierre y transporte SSE.
- `regresiones.json`: 34 regresiones de navegador aprobadas. Los casos de consultas HTTP usan el respaldo; los cuatro nuevos casos cubren el cliente de avisos, su recuperación y su pausa al ocultar la ficha.
- `avisos-servidor.json`: prueba con dos navegadores conectados por SSE real al mismo servidor. Datos controlados solo en el servidor de pruebas: una consulta inicial para dos espectadores, cambio recibido en ambos en unos nueve segundos, selección/foco conservados, comprobación sin cambios, fallo de fuente y detención al confirmar el final.

Los intervalos se probaron también con reloj controlado en el servicio y en el proveedor; las dos cachés permiten datos nuevos en un ciclo de diez segundos. Las pruebas de errores conservan el marcador y su fecha de origen.

La prueba controlada no mide el retraso que pueda añadir ESPN. El servidor de prueba no se incluye en el paquete de uso.

- `fuente-real.json`: ficha real de ESPN, SSE HTTP 200, V19.2 y contador de comprobación después de un ciclo de diez segundos, en contenedor Node 22.
- `recorrido.json`: 24 comprobaciones de ocho vistas a 1440, 390 y 320 px, sin errores de JavaScript, recursos locales ausentes ni desbordamiento.
- `partido-escritorio.png` y `partido-movil.png`: captura de la ficha real durante la verificación. El marcador corresponde al momento de la captura.
