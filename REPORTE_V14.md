# CANCHA V14 · Resultados de implementación y comprobaciones

**Fecha:** 27/10/2026. **Base:** CANCHA V13.

## Qué se añadió realmente

1. `scripts/soccerdata_export.py`: conversor en Python de DataFrames obtenidos con SoccerData a un JSON validable por CANCHA. También acepta CSV ya obtenidos con permiso, sin conectarse a sitios externos.
2. `server/soccerdata-import.mjs`: importa calendarios y clasificaciones, valida temporada, clubes, nombres ambiguos y consistencia de goles y resultados. No asigna una posición oficial a tablas parciales. Rechaza partidos con dos clubes que no se identifican inequívocamente.
3. `server.mjs`: reconoce los archivos autorizados y los suministra a las rutas existentes `/api/fixtures`, `/api/standings` y `/api/match-detail`. Expone estado resumido de importaciones en `/api/health`. No publica archivos internos ni contiene claves nuevas.
4. `live.js`: paginación del calendario (36 encuentros por página), con selección inicial alrededor de la fecha consultada y fecha/fuente visibles. Estado de las importaciones en «Fuentes y cobertura».
5. `universal.js`: acepta calendarios importados y no exige clave privada si la competición ya cuenta con datos importados. No inventa alineaciones ni estadísticas individuales.
6. `server/providers.mjs`: se corrigió la clasificación de estados `APLAZADO`, `CANCELADO`, `SUSPENDIDO`, `FINAL`, `EN VIVO` y `SIN CONFIRMAR`.

## Pruebas

- **23/23 pruebas de Node.js superadas**, incluidas cinco nuevas para la importación.
- Prueba E2E HTTP en una **copia temporal**: `/api/health`, `/api/fixtures?league=eng`, `/api/standings?league=eng`, `/api/match-detail?...source=SoccerData` respondieron correctamente con entradas de ensayo.
- Prueba del conversor CLI con un CSV de ensayo, generando JSON válido.
- Los datos de ensayo se borraron de la copia temporal y **no se incluyen en el ZIP**.
- Los archivos frontend `live.js` y `universal.js`, más el servidor y módulos nuevos, pasan `node --check`.
- No se pudo completar una prueba visual en navegador headless por limitaciones del entorno, aunque las respuestas HTTP y pruebas de JavaScript fueron satisfactorias.

## Cobertura real incluida al instalar

- Los **183 clubes**, **179 escudos locales**, **9 logos de competiciones** y **37 partidos documentados** heredados de V13 se conservan.
- SoccerData **no está instalado en el ZIP** y **ninguna fuente de SoccerData ha sido extraída automáticamente**. El importador está preparado pero contiene 0 ligas con nuevas importaciones por defecto.
- No se garantiza cobertura completa de plantillas, alineaciones, estadísticas ni calendarios en las nueve ligas: depende del proveedor, sus condiciones de uso y de las fuentes de datos que se incorporen posteriormente.
- La licencia Apache-2.0 de SoccerData corresponde al software, no concede derechos sobre los datos de las webs consultadas. No se ofrecen métodos de evasión de restricciones.

## Riesgos y siguiente fase

- Los conectores de otras APIs mantienen sus límites y su cobertura parcial.
- Las tablas importadas completas requieren revisar las reglas de desempate de cada torneo; el orden utilizado como referencia técnica es puntos, diferencia y goles, no se certifica como tabla oficial.
- Se requiere revisión de licencias de escudos si se publicará CANCHA en Internet.
- Para estadísticas individuales generalizadas harán falta fuentes que entreguen actas y métricas con permiso de reutilización, además de correspondencias fiables entre IDs.
