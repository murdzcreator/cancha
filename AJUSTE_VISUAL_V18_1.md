# CANCHA V18.1 · Sombras y tablas compactas

Ajuste de V18 a partir de la revisión visual del usuario. Se conserva la información y navegación incorporadas en V18.

- Los contornos blancos añadidos a los escudos y logos se sustituyen por sombras suaves. Premier mantiene su morado y una sombra difusa lavanda que ayuda a distinguirlo sobre el fondo oscuro.
- Se retira el balón superpuesto. El fondo y la paleta base vuelven al aspecto liso de V17.2 (`#100c1a`), sin cambiar los tonos de los datos ni los estados de los partidos.
- La página de competición limita su ancho, reduce la altura de la cabecera y ajusta las columnas y filas de clasificación. Se mantienen puntos destacados, escudos, nombres completos, zonas, leyenda y rachas.
- La ayuda de cada abreviatura aparece al pulsar la cabecera; también está en su etiqueta accesible y en el título que se muestra al pasar el cursor. El texto de ayuda deja de ocupar una fila permanente.
- Las tarjetas de líderes, las tablas de estadísticas y las filas del panel de jornada usan menos relleno. En móvil se conserva la tabla resumida con rachas, además del desplazamiento interno de la vista detallada.
- El panel lateral pasa debajo de la tabla cuando el ancho no permite mostrar todas las columnas con comodidad.

La densidad se inspira en la referencia de elnine aportada por el usuario; CANCHA conserva sus colores, componentes e identidad.

## Medidas de navegador

Misma competición y datos antes y después, con Chromium:

| Elemento | V18 | V18.1 |
| --- | ---: | ---: |
| Fila de clasificación en escritorio | 53 px | 38,4 px |
| Ancho de la tabla a 1920 px | 1138 px | 822 px |
| Cabecera de clasificación en escritorio | 80,8 px | 46 px |
| Fila resumida a 390 px | 79,5 px | 61,1 px |

Las filas ocupan aproximadamente un 28 % menos de alto en escritorio y un 23 % menos en móvil. Las alturas pueden variar si un nombre necesita una segunda línea.

## Verificación

- 90 pruebas existentes aprobadas. No cambia la obtención ni la interpretación de datos.
- Recorridos a 1920, 1440, 1280, 768, 390 y 320 px, con comprobación de desbordamientos, ayuda, búsqueda, rachas y vista detallada.
- Revisión de los apartados de competiciones, equipos, jugadores, calendario, club y marcador a escritorio y móvil; Champions y grupos de Argentina conservan sus filas.
- Evidencia y medidas en `review/v18-1/`. Las capturas de `review/v18/` se conservan como registro de la entrega anterior.

Para ejecutar esta revisión, extraer en una carpeta nueva, cerrar el servidor anterior e iniciar el de esa carpeta. El lateral y el pie deben indicar **V18.1**. Las referencias a CSS y JavaScript usan una versión nueva para evitar cargar los estilos anteriores desde la caché del navegador.
