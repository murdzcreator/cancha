# CANCHA: marcadores y fichas de ESPN

Esta entrega añade una lectura directa del mismo origen público que utiliza el conector ESPN de SoccerData. No se instaló Python ni SoccerData: su consulta `read_schedule` omite los marcadores, y el servidor de CANCHA puede aprovechar directamente los campos de la respuesta JSON. La documentación de Read the Docs sigue devolviendo 403; el repositorio oficial permite consultar el funcionamiento del conector.

## Cómo usarlo

Ejecuta `INICIAR_CANCHA_WINDOWS.bat` con Node.js 20 o superior. Abre **Partidos**, selecciona la competición y una fecha en hora de Perú. **Hoy en Perú** consulta el día actual; **Jornadas cercanas** usa los días cercanos publicados por ESPN, sin afirmar que sea una temporada completa. En competiciones cuyo calendario está organizado por fases, la ventana inicial puede contener solo hoy y mañana; utiliza el selector de fecha para otras jornadas.

Ejemplo probado: Perú, 25/10/2026, Comerciantes Unidos–Cienciano: 3–1. La ficha incluye 22 titulares, suplentes, eventos y estadísticas comparativas. Pulsa una camiseta o un suplente para consultar sus métricas del encuentro. Las ubicaciones en cancha son esquemáticas. Las métricas ausentes quedan con «—»: no se inventan minutos, pases ni valoraciones. Los ceros publicados se conservan.

## Actualización y fallos

- Inicio, calendarios y fichas ESPN consultan cada 45 segundos mientras están visibles. El minuto y estado proceden de ESPN, no de un reloj generado por CANCHA.
- Las consultas se comparten en el servidor; las peticiones simultáneas no multiplican una misma consulta. Se limitan a cuatro conexiones de origen simultáneas y existe una pausa de reintento ante fallos.
- El día elegido se cruza con el día siguiente del origen para incluir encuentros nocturnos; el filtro final usa la fecha de Perú. Las fechas sin hora conservan su día civil.
- Si falla la fuente, se conserva la última respuesta con su fecha y aviso de falta de actualización. Sin copia disponible se muestra el error; los archivos existentes se conservan como alternativa fechada para las consultas de jornadas cercanas.
- Las temporadas, identificadores y clubes se validan antes de abrir una ficha. No se mezclan alineaciones ni estadísticas local/visitante por orden de las filas.

Las identidades de las nueve competiciones se comprobaron con el listado público de equipos: 200 inscripciones correspondientes a los 183 clubes únicos del catálogo. Esto valida las correspondencias, no demuestra que cada jugador ni cada partido tenga estadísticas completas.

ESPN es un origen público consultado sin clave, no un servicio contratado con disponibilidad o latencia garantizadas. La cobertura depende del partido y las condiciones de reutilización corresponden al origen. Esta implementación no incorpora datos de elNine.

## Alcance pendiente

Esta entrega no completa las estadísticas individuales por temporada, rankings ni nuevas clasificaciones de ESPN. Las tablas existentes mantienen su procedencia. No se comprobó la demora durante un partido real en curso: se verificó la consulta periódica en navegador y los estados en pruebas automatizadas.

Para desactivar ESPN, configura `CANCHA_ESPN=0` en `.env` y reinicia. El servidor vuelve a los archivos y proveedores previos. No se requieren dependencias npm adicionales.

En entornos que necesitan proxy, Node 24 utiliza la configuración heredada mediante `http.setGlobalProxyFromEnv`; no se desactiva la verificación TLS. Fuera de este entorno, Node 20 o superior puede consultar normalmente sin proxy. Los dominios necesarios son `site.api.espn.com` para los datos y, opcionalmente, `soccerdata.readthedocs.io` para documentación.

## Verificación

`npm test` ejecuta la suite existente y pruebas de identidades, localía, ceros, fechas, temporadas, titulares/suplentes, campos ausentes, caché compartida y conservación de la copia al fallar. La evidencia de consultas de las nueve competiciones y de navegador se guarda en `review/espn/`.

Fuentes técnicas: https://github.com/probberechts/soccerdata/blob/master/soccerdata/espn.py y https://soccerdata.readthedocs.io/en/latest/.
