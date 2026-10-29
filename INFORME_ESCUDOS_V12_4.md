# CANCHA V12.4 — Informe de escudos integrados

**Fecha del lote:** 27/10/2026. **Archivo proporcionado por el usuario:** `COLECCION_ELNINE_IMAGENES.zip`.

- Clubes de CANCHA: **183**.
- Emblemas locales instalados en el ZIP: **179**.
- Logos de competiciones locales instalados: **9 de 9**.
- Clubes sin coincidencia inequívoca en el catálogo: **4**.
- Descargas manuales, sincronización y selección de escudos: **ninguna**.
- Formato instalado: **WebP sin pérdida**, 384 × 384 px con transparencia conservada.
- Las rutas son relativas y funcionan directamente desde la carpeta, sin red externa para los 179 clubes cubiertos.

## Escudos pendientes

- **central-cordoba**: No identificado con seguridad en la colección entregada
- **gimnasia-mendoza**: No identificado con seguridad en la colección entregada
- **velez-sarsfield**: No identificado con seguridad en la colección entregada
- **atletico-tucuman**: No identificado con seguridad en la colección entregada

Para estos cuatro, la página seguirá intentando mostrar su referencia externa anterior si funciona. **No se creó un escudo inventado ni se asignó el de otro equipo**.

## Controles efectuados

1. Integridad SHA-256 verificada contra `CATALOGO.csv` de la colección.
2. Cruce exacto con país o competición; revisión de alias y homónimos (Barcelona de España frente al de Ecuador; Universitario de Perú frente a Bolivia/Panamá).
3. Revisados mosaicos de las imágenes seleccionadas, incluida una comprobación de escudos de equipos femeninos y reservas que usan la misma marca del club.
4. Un falso positivo de «Central» (Rosario Central ≠ Central Córdoba) fue descartado.
5. Todas las imágenes instaladas se convierten a WebP local y se pueden abrir con Pillow.
6. El frontend carga la copia local primero y ya no ejecuta reemplazos automáticos.
7. El servidor admite archivos `.webp`.

## Derechos y publicación

Las imágenes originales proceden de la colección personal facilitada por el usuario, que las recopiló de ELNINE. La identificación visual de un escudo no acredita permiso para redistribuir su diseño o una recopilación de imágenes. El paquete es una copia de trabajo para revisión privada de CANCHA. Antes de compartirlo o publicarlo como sitio abierto, comprobar los derechos de uso de los escudos o reemplazar los no autorizados; la procedencia individual consta en `CATALOGO_VERIFICACION.csv`.

**No se modificaron** estadísticas, clasificaciones, calendarios ni el integrador de proveedores deportivos.
