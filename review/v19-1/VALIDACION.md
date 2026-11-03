# Verificación de V19.1

- `pruebas.txt`: 110 pruebas aprobadas, incluidos contenido, dependencias, escudos y protección de carpetas de salida de la edición ligera.
- `regresiones.json`: 30 regresiones aprobadas en el servidor de la edición ligera.
- `recorrido.json`: 24 comprobaciones, ocho rutas en tres tamaños. Sin errores de JavaScript, recursos locales ausentes ni desbordamientos.
- `docker.json`: contenedor de producción con Node 22, servidor V19.1, selección de Champions en el día actual y clasificación ESPN de 36 equipos. Se usó el proxy y la CA del entorno de pruebas; no se incorporaron a la imagen ni a la entrega.

El Dockerfile del proyecto completo construye primero la edición ligera. El Dockerfile entregado en esa edición la arranca directamente. El plan de alojamiento y su URL pública se configuran en la cuenta del proveedor; no se verificó un despliegue en Render.

La edición mantiene los escudos originales. El ahorro de peso procede del contenido de distribución; no modifica la calidad de las imágenes.
