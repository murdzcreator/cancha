# CANCHA V17 · Inicio local

1. Instala Node.js 20 o superior desde https://nodejs.org/.
2. Extrae todo el ZIP en una carpeta nueva.
3. Abre la carpeta extraída que contiene `server.mjs` y ejecuta `INICIAR_CANCHA_WINDOWS.bat`.
4. Si el navegador no se abre, visita http://127.0.0.1:4173/.
5. Mantén abierta la consola mientras uses CANCHA.

En macOS o Linux, abre una terminal dentro de la carpeta y ejecuta `npm start`.
No hay dependencias npm que instalar. Los archivos deben abrirse a través del servidor para consultar las fuentes.

ESPN se consulta por internet, sin clave de pago. OpenFootball sincroniza sus calendarios en segundo plano; puedes forzar su actualización con `ACTUALIZAR_DATOS_WINDOWS.bat`. Las copias personales se guardan en `data-cache/` y no se incluyen en esta entrega.

Guía y novedades: `README.md` y `NOVEDADES_V17.md`. Capturas y pruebas: `review/v17/`.
