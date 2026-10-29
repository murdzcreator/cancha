# CANCHA V14 · Conector opcional SoccerData

## Qué se hizo
CANCHA V14 conserva la identidad y escudos de V13, integra calendarios y clasificaciones **importados desde archivos locales** generados por SoccerData y permite explorar temporadas largas mediante paginación. Las fichas de partido reutilizan la cancha universal. La base del servidor sigue siendo Node.js; Python solo se necesita para obtener/exportar nuevos datos con SoccerData.

**Importante**: SoccerData es un proyecto de extracción (scraping), **no una API con licencia de retransmisión**. Su licencia Apache-2.0 cubre el código, no los derechos sobre los datos de ESPN, Sofascore, FBref, etc. El acceso y la publicación solo deben realizarse cuando los términos del origen los permitan. No se ejecutan extracciones automáticamente al arrancar CANCHA.

## Empezar
1. Extrae el ZIP, cierra versiones previas y abre `INICIAR_CANCHA_WINDOWS.bat`. Sin configuración, las fichas históricas y los escudos siguen visibles.
2. Si dispones de un CSV **obtenido legalmente** desde una fuente compatible con SoccerData, puedes importarlo sin instalar la biblioteca. Abre PowerShell/CMD en la carpeta CANCHA V14:

```powershell
py scripts\soccerdata_export.py --league eng --season 2026/27 --dataset fixtures --provider espn --csv C:\ruta\calendario.csv
```

3. Alternativamente, si has comprobado que una fuente permite las consultas y reutilización que quieres, instala Python 3.10–3.14 y SoccerData:

```powershell
py -m pip install soccerdata
py scripts\soccerdata_export.py --league eng --season 2026/27 --dataset fixtures --provider espn --acknowledge-source-terms
py scripts\soccerdata_export.py --league eng --season 2026/27 --dataset standings --provider sofascore --acknowledge-source-terms
```

Estos comandos **son opciones** y pueden fallar o estar prohibidos según la fuente; no se recomienda ejecutarlos sin comprobar sus reglas. Otros códigos incluidos de fábrica: `esp` (LaLiga), `ita` (Serie A), `fra` (Ligue 1). Las otras ligas necesitan configuración y cobertura comprobadas: `--source-league` permite indicar el ID exacto de la fuente después de investigarlo, sin inventar códigos.

4. El exportador guarda JSON normalizados en `data-imports/soccerdata`. Reinicia CANCHA para evitar reutilizar cachés anteriores. **No se incluyen datos falsos ni un calendario masivo de ensayo en la entrega.**

## Qué valida el servidor
- Liga y temporada deben coincidir con `db.js`.
- Los dos clubes de cada partido deben identificarse **sin ambigüedad** dentro de la liga.
- Los partidos con IDs duplicados, fechas inválidas o equipos desconocidos quedan excluidos.
- La tabla comprueba `PJ = G + E + P`, diferencia de goles y participantes completos antes de mostrar posiciones como completas.
- Las tablas parciales muestran cobertura parcial. Los datos importados indican fuente y fecha; **no se anuncian como en vivo**.
- Los partidos importados abren la ficha universal. Sin acta válida no se inventan alineaciones, mapas de calor, cambios ni estadísticas individuales.
- Los archivos de importación no se sirven públicamente. Para publicación, se requiere una revisión de permisos y seguridad.

## Dónde ver la cobertura
Abre `Fuentes y cobertura` dentro de CANCHA. El servidor publica el resumen en `/api/health` → `soccerdataImports`, sin dar acceso a los archivos internos.

## Si no se carga nada
SoccerData no se incluye como dependencia automática; la configuración predeterminada no intenta extraer información de terceros. Verifica conexión, permisos, código de liga, temporada, versión del paquete y los mensajes de la terminal del exportador. En ausencia de nuevas fuentes, CANCHA conserva el catálogo previo de 183 clubes y 37 encuentros documentados, con las mismas limitaciones de cobertura de V13.

## Estadísticas individuales
La exportación de alineaciones de ESPN está implementada como posibilidad experimental `--dataset match --match-id ID --provider espn`, y requiere disponer de ese partido en un calendario compatible y de datos públicos con permiso de uso. Las métricas se presentan únicamente si están en el archivo. No se ha validado en vivo con SoccerData en este entorno.

## Fuentes técnicas
- https://soccerdata.readthedocs.io/en/stable/
- https://soccerdata.readthedocs.io/en/stable/reference/sofascore.html
- https://soccerdata.readthedocs.io/en/latest/datasources/ESPN.html
- https://pypi.org/project/soccerdata/
