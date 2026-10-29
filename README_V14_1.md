# CANCHA V14.1 · Premier League y LaLiga con datos abiertos reales

**Fecha de preparación: 27 de octubre de 2026.** Esta edición incorpora el primer paso real que faltaba en V14: resultados documentados y un mecanismo para importar sin claves dos temporadas completas **desde OpenFootball (CC0)**.

## Qué incluye el ZIP al abrirlo sin Internet

- Una instantánea real **histórica de la primera jornada** de Premier League 2026/27 (10 resultados) y LaLiga 2026/27 (10 resultados), transcritos y contrastados con los conjuntos abiertos de OpenFootball. Son datos de agosto y **NO** reflejan la situación actual al 27 de octubre.
- Clasificaciones **calculadas** exclusivamente con esos resultados de la primera jornada (20 clubes por competición). No son tablas oficiales ni actuales.
- 183 clubes, 179 escudos locales y nueve competiciones del proyecto previo; otros datos de V14 sin alterar.

## Cómo obtener el calendario completo real de 2026/27 (requiere Internet)

Al ejecutar `INICIAR_CANCHA_WINDOWS.bat`, el programa descarga **dos archivos JSON CC0** del repositorio [openfootball/football.json](https://github.com/openfootball/football.json):

- Premier League: `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json`
- LaLiga: `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json`

El script mapea inequívocamente los 20 clubes de cada liga, detecta partidos duplicados, distingue marcadores confirmados de futuros encuentros, prepara tablas **calculadas** con los resultados disponibles, y guarda las importaciones en `data-imports/soccerdata`. Las páginas **Clasificación, Calendario y Partido** utilizan esos datos automáticamente y permiten recorrer calendarios largos con paginación.

**La actualización no es en vivo**. El repositorio regenera su JSON diariamente, pero su fuente subyacente se actualiza manualmente y puede tener retraso. Las horas de los partidos son orientativas. Revisa las fechas oficiales si vas a desplazarte o publicar el servicio.

El sincronizador solo consulta esos dos URL permitidos, como máximo una vez cada 24 horas cuando ya existe una copia válida. No necesita instalar Python ni SoccerData ni introducir claves. Si la conexión falla, conserva la última información correcta disponible y el servidor sigue abriendo CANCHA.

Puedes forzar una actualización con `ACTUALIZAR_DATOS_WINDOWS.bat`, sin ejecutar búsquedas masivas. **Cierra y vuelve a abrir CANCHA** después de forzar la descarga. Para evitar confusiones con versiones antiguas, extrae V14.1 en una carpeta independiente y cierra previamente otros servidores CANCHA.

## Qué sigue faltando

OpenFootball no aporta por sí solo todas las alineaciones, las sustituciones ni las estadísticas de cada futbolista. Las fichas de partido incluidas permiten entrar a todos los encuentros registrados, pero no inventan nombres de jugadores, tiros o pases. Las siete competiciones restantes conservan la cobertura anterior, salvo otras importaciones autorizadas que realices con las herramientas de V14.

## Permiso y procedencia

Esta importación usa el repositorio [openfootball/football.json](https://github.com/openfootball/football.json) que declara sus datos en **dominio público CC0** y atribuye los formatos derivados al proyecto openfootball. Puedes consultar su archivo LICENSE y la fecha de modificación de sus fuentes para decidir si republicar los registros de CANCHA. **No utiliza automáticamente SoccerData ni extrae datos de ESPN/Opta/Sofascore.**

Si el sitio GitHub no está disponible o está bloqueado, podrás usar la instantánea de la primera jornada incluida. Los datos de prueba generados por las pruebas unitarias NO se incorporan al catálogo.
