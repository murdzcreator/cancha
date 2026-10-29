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

Premier League y LaLiga incluyen 380 partidos de OpenFootball por liga. Los resultados disponibles son parciales y las tablas calculadas no son clasificaciones oficiales ni un servicio en directo. Las demás competiciones y las estadísticas individuales dependen de la cobertura de las fuentes configuradas. Los datos históricos mantienen su fecha y sus límites.

Consulta el informe de revisión para conocer las correcciones, las 42 pruebas aprobadas y las verificaciones de navegador. No se han verificado como actuales todos los jugadores, entrenadores ni participantes de cada competición.

Las claves opcionales se configuran localmente siguiendo `.env.example`. No publiques tu archivo `.env`.
