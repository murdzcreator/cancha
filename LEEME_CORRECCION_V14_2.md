# CANCHA V14.2 · Corrección de fichas importadas y contadores

Esta edición corrige problemas detectados al probar las dos ligas importadas desde OpenFootball. **No añade estadísticas individuales que el proveedor no publica**.

## Correcciones comprobadas

- El calendario indica el número de partidos realmente importados y el número con resultado. Los indicadores laterales dejan de indicar 0 cuando hay datos en el servidor.
- Las fichas abiertas desde cualquier calendario OpenFootball muestran fecha, clubes, marcador, fuente y encuentros anteriores y posteriores de ambos equipos disponibles en la importación.
- Se diferencia claramente la ficha con datos básicos de una ficha con alineaciones y estadísticas. **Una cancha con jugadores reales solo puede dibujarse si la fuente entrega sus alineaciones**.
- Las pestañas Alineaciones / Eventos / Estadísticas / Información ya no modifican la ruta hash de CANCHA: desplazan la página a la sección elegida.
- Se conservan 183 clubes, escudos locales y las demás funciones anteriores.

## Recomendado: parche sin perder tus 380 partidos por liga

Si ya tienes `CANCHA_V14_1` funcionando y descargaste **380 partidos por liga**, puedes aplicar el archivo `CANCHA_V14_2_Parche_Sobre_V14_1.zip`:

1. Cierra la consola de CANCHA.
2. Crea una copia de seguridad de la carpeta `CANCHA_V14_1`.
3. **Extrae el contenido del ZIP del parche directamente dentro de esa carpeta** y acepta reemplazar los archivos homónimos. No extraigas una carpeta adicional dentro de `CANCHA_V14_1`.
4. Ejecuta `INICIAR_CANCHA_WINDOWS.bat` otra vez y prueba Premier League → Calendario → cualquier partido → pestaña Estadísticas.

El parche **no contiene** `data-imports/`, `assets/` ni `data-cache/`: por tanto, **no borra** los calendarios ni las copias locales que ya descargaste. Al iniciar, el sincronizador normal sigue activo para consultar novedades con su frecuencia configurada.

## Si prefieres instalar desde cero

Extrae el ZIP completo `CANCHA_V14_2_Partidos_Corregidos.zip` en una carpeta nueva. Al abrirla, la versión incluye únicamente los datos iniciales y consulta OpenFootball para completar la temporada cuando dispone de Internet. Para conservar exactamente la última descarga de tu computadora, aplica el parche sobre V14.1 en lugar de instalar desde cero.

## Cobertura y límites de la fuente

OpenFootball CC0 proporciona calendario, estado y marcador; **no aporta** nombre de goleadores, formaciones, tarjetas, sustituciones ni las estadísticas de cada futbolista. Esas secciones muestran «no disponible» cuando no hay una segunda fuente compatible, en vez de inventar resultados. Una tabla calculada con 50 partidos de Premier League o 69 de LaLiga no es la clasificación oficial ni en vivo.

## Validación

Las 32 pruebas automáticas de CANCHA pasan, incluidas tres nuevas sobre partidos importados, contadores y pestañas. El servidor HTTP devolvió la ficha de un encuentro de muestra con el contexto de los equipos. No fue posible completar una revisión visual automatizada en este entorno debido a restricciones del navegador; por eso se recomienda comprobar la interfaz directamente en Windows.
