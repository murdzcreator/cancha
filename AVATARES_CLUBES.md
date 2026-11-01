# Avatares con identidad de cada club

Las plantillas, el directorio, los perfiles y las fichas de jugador de las alineaciones utilizan un mismo avatar ilustrado. Se aplica a todos los jugadores, incluso cuando la fuente ofrece una fotografía, para mantener una presentación uniforme.

- **183 clubes:** paleta local propia y escudo de la biblioteca existente.
- **Personalidad:** camisetas con colores y patrones representativos; por ejemplo, franjas azul/blanco para Alianza Lima, crema para Universitario, franja central para PSG y azul/grana para Barcelona.
- **Identificación:** dorsal publicado; si falta, iniciales del nombre. El cero se conserva. Los campos ausentes no se sustituyen por un dorsal inventado.
- **Consistencia:** avatar mayor en el perfil y tamaños ajustados para plantilla, directorio y panel del partido.
- **Sin consultas adicionales al visitar la página:** ilustración SVG y escudos locales, sin descargar retratos ni añadir claves o servicios de pago.

Las ilustraciones expresan la identidad visual del club; no representan el rostro del futbolista ni una equipación oficial de una temporada. Los colores proceden de los listados públicos de equipos de ESPN (`site.api.espn.com/apis/site/v2/sports/soccer/{liga}/teams?limit=100`), con ajustes de diseño locales para clubes destacados. Se recuperaron las 183 paletas el 1 de noviembre de 2026.

## Implementación

- `assets/club-avatar-themes.js`: paletas y patrones por club.
- `player-avatars.js`: componente SVG compartido, con texto escapado y colores validados.
- `player-avatars.css`: tamaños, integración y adaptación móvil.

Las fotografías permanecen en los datos recibidos; las vistas utilizan el avatar ilustrado elegido para esta versión.

## Verificación

75 pruebas funcionales correctas, incluidas cuatro sobre cobertura del catálogo, identidad por club, dorsal cero, campos ausentes y entradas no válidas. Registro: `review/avatares/pruebas.txt`.

Chromium a 1440, 390 y 320 px: 12 plantillas, 12 perfiles y 3 directorios. Comprobados PSG, Alianza Lima, Manchester United y Real Madrid. Todos los jugadores visibles usan el club correcto; sin peticiones a fotos de jugadores, errores JavaScript ni desbordamientos horizontales. También se verificó el avatar en fichas estáticas y paneles de alineación a 1440 y 390 px.

Capturas y resultados: `review/avatares/`. La lámina `identidades.png` muestra ejemplos de diseño con el dorsal ilustrativo 9.
