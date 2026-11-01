# CANCHA V17.2 · Marcador y partidos del club

Esta revisión corrige los componentes mostrados en las capturas del usuario: la cabecera de un partido y las listas de próximos/resultados del club. Conserva los avatares y las fuentes gratuitas de V17.

## Cambios visibles

- **Marcador:** ancho máximo de 920 px, centrado. Escudos de 96 px y nombres de 22 px en escritorio. En móvil, escudos de 60–64 px y nombres de 15–16 px. Se conserva el marcador, estado y fecha publicados.
- **Próximos y resultados:** se retiran las antiguas filas de 11 px. Nombres de 15–16 px, escudos de 28–34 px, fecha breve, competición y hora o marcador como dato central. Los próximos sin hora dicen «Por confirmar».
- **Resultados:** etiqueta Ganó/Empate/Perdió desde la perspectiva del club consultado. Los marcadores ausentes no se deducen.
- **Resumen del club:** cinco próximos y cinco resultados disponibles como máximo por bloque, con acceso a todos.
- **Pestaña Partidos:** ocho encuentros por página en cada lista, con navegación independiente y filtro por competición. El filtro vuelve a la primera página. Todos los encuentros disponibles siguen siendo accesibles.
- **Contexto:** una sola sección de fuentes desplegable, con el detalle por competición y las fechas originales. El aviso de cobertura parcial se conserva.
- **Situación en la liga:** posición, puntos, jugados y goles en un bloque legible; información institucional desplegable.
- **Actualización:** versión visible V17.2 y URLs de estilos/scripts versionadas para cargar los componentes nuevos.

## Verificación

80 pruebas funcionales correctas. Incluyen cobertura de paginación completa, filtros por competición, próximos vencidos, directos guardados, resultados desde cada localía, fechas de Perú y horarios pendientes.

Chromium en 1920×1080, 1440×1000, 390×844 y 320×740: club PSG y Le Havre–PSG (ESPN 401876421), precisamente las fichas de las capturas. Se comprobó:

- Marcador de 920 px en escritorio y escudos de 96 px.
- Cinco próximos en el resumen y acceso a los 30 disponibles con la paginación de Partidos.
- Filtro Ligue 1 y reinicio de página al cambiar competición.
- Filas antiguas eliminadas de estas vistas; nombres de 15–16 px y escudos de 28–34 px.
- Las cinco pestañas del partido siguen funcionando.
- Sin errores JavaScript ni desbordamientos horizontales.

También se comprobó Alianza Lima a 320 px con hora pendiente, el desplegable institucional, la plantilla con avatares y el fallo de una competición conservando los partidos de la otra.

Resultados y capturas: `review/partidos-17-2/`. Los recuentos de encuentros son una muestra de la consulta del 1 de noviembre de 2026; no prometen un historial completo de temporada.

## Abrir la actualización

Extrae el ZIP en una carpeta nueva. Cierra la consola del servidor anterior, ejecuta `INICIAR_CANCHA_WINDOWS.bat` desde la nueva carpeta y abre http://127.0.0.1:4173/. El lateral y el pie deben indicar **V17.2**. Node.js 20+; sin dependencias nuevas.
