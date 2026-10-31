# CANCHA V15: datos conectados y rediseño

## Cambios de comportamiento

Se corrigieron los cuatro fallos reproducidos en la auditoría anterior: la búsqueda ya separa ruta y consulta; el texto buscado se escapa al mostrarlo; los encuentros que siguen en juego mantienen consultas cortas al cruzar la medianoche; el calendario aplica los filtros de fecha, equipo y estado también al catálogo alternativo. Inicio comunica cuándo no pudo actualizar una copia guardada.

El servidor incorpora tablas ESPN antes de las alternativas anteriores. Mantiene fase/grupo, posición y puntos publicados, incluidos ajustes: no calcula puntos oficiales desde una muestra de resultados. Se verificaron las nueve competiciones: Perú (Clausura, 18), UCL (fase de liga, 36), España (20), Inglaterra (20), Argentina (dos grupos de 15), Italia (20), Francia (18), Brasil (20), México (Apertura, 18). Esto no afirma disponer de todas las fases históricas, ni de Acumulada peruana actualizada si la fuente solo entrega Clausura.

Las plantillas se consultan mediante identidades ESPN verificadas. Equipo → Plantilla abre perfiles del mismo índice utilizado por el directorio y la búsqueda. Abrir un acta añade los jugadores observados al índice sin atribuirles una plantilla completa. El directorio permite recuperar las plantillas pendientes de forma progresiva, con límite de concurrencia y pausa de reintento. Se probaron plantillas de muestra de las nueve competiciones.

## ESPN y OpenFootball juntos

OpenFootball aporta los calendarios de Premier League y LaLiga, con 380 encuentros por competición; ESPN actualiza los cruces coincidentes. Los cruces entre fuentes se unen solo cuando coinciden clubes, localía y día en Perú, sin adivinar la identidad de encuentros ambiguos. Se conservan los identificadores de origen. Un resultado final válido no se sustituye por un programado sin marcador.

El archivo local persiste jornadas y actas ESPN por competición y temporada en `data-cache/history-v1.json`. Las fechas consultadas, estadísticas de equipos y participaciones siguen disponibles después de reiniciar. Las copias marcadas como antiguas no sobrescriben el historial verificado. Los errores conservan la última respuesta y su procedencia.

OpenFootball vuelve a sincronizarse automáticamente en segundo plano: al iniciar el servidor y en comprobaciones periódicas. El importador limita descargas a una por día y conserva archivos válidos si falla la conexión. No bloquea el inicio de la web.

## Estadísticas e historial

Equipo → Estadísticas muestra resultados analizados, victorias/empates/derrotas, goles, promedios, vallas invictas, local/visitante, últimos cinco resultados y selección de rival. El historial del partido excluye el encuentro abierto y fechas posteriores.

Competición → Estadísticas compara equipos y muestra líderes en goles, asistencias y tarjetas de los partidos con actas guardadas. Perfil → Participaciones muestra los encuentros observados y métricas publicadas. Los suplentes sin participación no suman partidos en los rankings. Las actas repetidas no duplican cifras; las métricas ausentes quedan ausentes, conservando los ceros publicados y el número de observaciones por campo.

Las acciones **Cargar jornadas anteriores** y **Ampliar estadísticas de jugadores** recuperan datos en tandas limitadas. En torneos cuyo calendario viene organizado por fases sin días publicados, utiliza Partidos → Fecha para ampliar el archivo. Las nuevas consultas amplían el historial, no fabrican temporadas completas a partir de algunas jornadas.

## Diseño y navegación

- Inicio centra la navegación en marcadores conectados y competiciones, sin destacar un partido histórico fijo.
- Tablas con filtro de equipo, columnas de identificación fijas y desplazamiento dentro de la tabla en móvil.
- Indicadores de cobertura, tarjetas de métricas, forma reciente, comparación local/visitante y rankings enlazados a perfiles.
- Filtros combinables de competición, equipo, fecha de Perú y estado En vivo.
- Perfiles conectados desde plantilla, directorio, búsqueda, acta y rankings. Se reducen los bloques duplicados de instantáneas históricas.

## Verificación

La suite registra 59 pruebas aprobadas: las 52 anteriores y siete casos adicionales sobre fases, sanciones, plantillas, medianoche, combinación de fuentes, cálculos y persistencia de actas/índice. Los recorridos de Chromium comprueban búsqueda normal y texto malicioso inocuo, tablas, plantillas, perfiles, historial, rankings, filtros, alternativa sin conexión y vistas móviles de 390 px sin desbordamiento de página.

Se comprobaron respuestas reales de las nueve tablas y plantillas de muestra, sincronización de los dos calendarios OpenFootball, carga de jornadas anteriores y ampliación de estadísticas. Los informes y capturas están en `review/v15/`. El contador de jugadores de esas comprobaciones corresponde al índice de prueba de esta máquina; una instalación nueva recupera sus propias plantillas al consultar los clubes.

## Límites que siguen vigentes

La cobertura depende de lo publicado por las fuentes. Los acumulados y rankings individuales son de las actas guardadas, no del universo de partidos de la temporada. No se agregaron mapas de calor, valoraciones propias ni métricas individuales no publicadas. La latencia de un partido real en curso no se ha medido; se comprobó el refresco y los estados en pruebas. La interfaz consulta las temporadas actuales del catálogo. No se configura alojamiento público ni se modifica el entorno en la nube con esta entrega.
