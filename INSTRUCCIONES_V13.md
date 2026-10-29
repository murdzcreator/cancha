# CANCHA V13 · Centro Deportivo Universal

## Instalación en Windows

1. Extrae **todo** el ZIP en una carpeta nueva `CANCHA_V13`.
2. Instala Node.js 20 o posterior si aún no lo tienes.
3. Cierra el servidor anterior de CANCHA V12.4 (ventana de CMD).
4. Abre `INICIAR_CANCHA_WINDOWS.bat`. Visita `http://127.0.0.1:4173/`.
5. Puedes consultar los 183 clubes y 37 encuentros documentados sin claves. Los escudos locales se conservan.

## Novedades

- Un **componente universal de partido** para todos los encuentros documentados y los que lleguen de un proveedor. Las alineaciones no se inventan: se muestran solo si están documentadas.
- **Cancha horizontal más compacta**, dorsales más grandes, panel de jugador separado y métricas reales cuando las trae la API.
- Fichas de clubes: ciudad, estadio, entrenador y datos de referencia cuando se hayan comprobado. Hay enlaces a la fuente. En caso contrario, se indican como pendientes.
- Endpoint `/api/club-profile?team=slug` para recuperar datos complementarios públicos de TheSportsDB y, opcionalmente, football-data.org. Filtra nombre y país para evitar equipos homónimos. Se guarda en caché hasta 72 horas.
- Los calendarios adicionales de clubes se consultan a las APIs opcionales si hay una clave instalada y hay datos disponibles.

## Cómo activar datos externos gratuitos

Copia `.env.example` como `.env` y agrega **tus propias claves** gratuitas de proveedores (revisa cobertura y condiciones). Reinicia el servidor.

- `FOOTBALL_DATA_KEY` para resultados y tablas de las competiciones incluidas en ese plan.
- `API_FOOTBALL_KEY` para calendarios, alineaciones y estadísticas individuales, siempre que el plan y la liga lo permitan. El plan gratuito tiene restricciones fuertes de consultas.
- `THESPORTSDB_KEY=123` es acceso público básico. Puede no entregar varias fichas; no garantiza estadísticas individuales.

**No compartas `.env` ni claves de API.** La página jamás debe mostrar una estadística ficticia como real. Las instantáneas incluidas están fechadas; por sí solas no se actualizan en vivo.

## Limitaciones honestas

- Hay **183 clubes en la base inicial**, pero solo algunos tienen ciudad, estadio y entrenador documentados dentro de la entrega. Otros podrán enriquecerse al consultar la ficha externa (dependiendo de la disponibilidad).
- **37 partidos históricos documentados** tienen ficha universal. Solo el ejemplo PSG–Barcelona incluye una alineación de referencia; no constituye una validación independiente del acta. Los demás aparecen con cancha neutral cuando faltan alineaciones.
- Ninguna combinación de APIs gratuitas garantiza estadísticas detalladas para todos los partidos de todas las ligas; sin acceso autorizado, las métricas individuales permanecen vacías.
- Los escudos siguen siendo los de la biblioteca local de V12.4; antes de republicar las imágenes en Internet deben comprobarse sus derechos de uso.

## Pruebas

Desde la carpeta del proyecto, ejecuta `npm test`. También se hizo una comprobación visual aislada de escritorio y móvil.

Fuentes para fichas: consulta `FUENTES_CLUBES.md`.
