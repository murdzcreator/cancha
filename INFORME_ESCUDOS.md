# Estado de la biblioteca de escudos — CANCHA V12.3

## Alcance

- Clubes distintos de las nueve competiciones actuales: **183**.
- Referencias originales del catálogo heredado: **59 clubes aproximadamente** (no son una prueba de que el servidor remoto responda).
- El paquete anterior contenía intentos de búsqueda por nombre de Wikimedia sin un control de correspondencia suficientemente estricto. Esta versión **no aprueba ni utiliza** dichas descargas.
- La versión actual busca coincidencias exactas de club y país en una colección distinta, las recupera automáticamente al iniciar el servidor y guarda copias locales.

## Criterios de aceptación

1. País coincidente entre club y carpeta del repositorio.
2. Nombre normalizado idéntico o alias explícito del club. **Nunca coincidencia aproximada**.
3. Si hay más de un nombre candidato diferente sin preferencia inequívoca: se rechaza, no se adivina.
4. Imagen SVG/PNG válida, tamaño controlado y sin etiquetas SVG activas peligrosas.
5. Fuente, fecha y huella SHA-256 registradas cuando se descarga.
6. Los escudos originales ya configurados conservan prioridad como primera opción.

## Restricción pendiente

**No se debe declarar una cobertura total de 183/183 hasta ejecutar el importador con una red accesible y revisar los resultados.** El usuario no tendrá que seleccionar imágenes desde la web. Las identidades sin correspondencia exacta se indican como pendientes.

La referencia a los escudos o a la licencia MIT de un repositorio público **no implica** permiso de marca o reutilización comercial de los clubes.

## Reporte de ejecución

Al iniciar CANCHA, consulta `http://127.0.0.1:4173/api/branding/status`. Campos esperados: `state`, `matched`, `downloaded`, `already`, `unmatched`, `ambiguous`, `remaining` y `errors`.
