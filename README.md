# CANCHA · Revisión general

Página de fútbol con nueve competiciones y 183 clubes del catálogo. Incluye las correcciones de fechas, calendarios, fichas de equipos y estadísticas descritas en [REVISION_GENERAL.md](REVISION_GENERAL.md).

## Descargar y ejecutar en Windows

1. En este repositorio, pulsa **Code → Download ZIP**.
2. Extrae todo el ZIP en una carpeta nueva.
3. Instala Node.js 20 o superior si aún no lo tienes.
4. Ejecuta `INICIAR_CANCHA_WINDOWS.bat`.
5. Mantén abierta la consola mientras usas la página.

También puedes iniciar desde una terminal con `npm start`. Abre la dirección que indique el servidor. No hay dependencias npm externas que instalar. Para comprobar las pruebas: `npm test`.

## Datos y cobertura

La conexión nueva de ESPN consulta marcadores por fecha en hora de Perú y abre fichas con alineaciones, suplentes, eventos, estadísticas comparativas y métricas individuales del partido cuando la fuente las publica. Calendarios y fichas se consultan cada 45 segundos mientras la página está visible. Es una consulta periódica, no una garantía de transmisión instantánea. No necesita Python ni una clave de pago.

En **Partidos**, elige competición y fecha. Ejemplo comprobado: Perú, 25/10/2026 → Comerciantes Unidos–Cienciano. Los datos sin disponibilidad quedan ausentes. Esta entrega no completa estadísticas individuales de temporada ni actualiza las clasificaciones desde ESPN.

Consulta [CONEXION_ESPN.md](CONEXION_ESPN.md) para cobertura, pruebas y cómo volver al modo anterior. Los dominios autorizados del entorno no publican automáticamente la web.

Premier League y LaLiga incluyen 380 partidos de OpenFootball por liga. Los resultados disponibles son parciales y las tablas calculadas no son clasificaciones oficiales ni un servicio en directo. Las demás competiciones y las estadísticas individuales dependen de la cobertura de las fuentes configuradas. Los datos históricos mantienen su fecha y sus límites.

Consulta el informe de revisión para conocer las correcciones y verificaciones anteriores. La conexión ESPN tiene pruebas adicionales descritas en su documento. No se han verificado como actuales todos los jugadores, entrenadores ni participantes de cada competición.

Las claves opcionales se configuran localmente siguiendo `.env.example`. No publiques tu archivo `.env`.
