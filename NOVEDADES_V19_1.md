# CANCHA V19.1 · Edición ligera y preparación para compartir por web

## Dos entregas

La rama de desarrollo `cancha-v17` conserva las fuentes, pruebas, capturas e informes históricos. La nueva rama `cancha-ligera` contiene la edición de uso, preparada para descargar o alojar. La interfaz y las secciones son las de V19, con la identificación V19.1.

La edición ligera pasa de los 72 elementos de la carpeta anterior a **17 elementos en la raíz**. El paquete queda en aproximadamente **9,4 MB ZIP**, frente a los **31 MB** de V19: cerca de **un 70 % menos**. Conserva todos los escudos y avatares. La reducción procede de dejar fuera capturas, pruebas, documentos antiguos, herramientas y fuentes JS/CSS que ya están dentro de los paquetes de ejecución. El código completo continúa disponible en la rama de desarrollo.

`npm run package:runtime` construye una carpeta nueva en `output/` con una lista explícita de archivos. No copia `.env`, cachés personales, dependencias instaladas ni importaciones ajenas a los cuatro calendarios/tablas públicos previstos. Rechaza carpetas usadas y antecesores del proyecto para preservar su contenido. El paquete de uso solo expone `npm start` en sus comandos npm.

Se corrigió también `LEEME.txt`, que conservaba la identificación y las instrucciones de V17.2.

## Acceso por enlace

Para que los visitantes abran CANCHA sin descargar nada, hay que publicar el servidor en un alojamiento. La entrega contiene `render.yaml` para una prueba gratuita con Node y un `Dockerfile` para alojamientos de contenedores. No se ha creado ni publicado un servicio de alojamiento con estos archivos.

La guía [PUBLICAR_WEB.md](PUBLICAR_WEB.md) explica el despliegue, las variables de entorno y el enlace de Champions que selecciona automáticamente el día actual de Perú: `/#/partidos?liga=ucl`, añadido a la dirección HTTPS real del servicio.

Los visitantes no requieren Node ni el PC del creador encendido. El servidor alojado hace las consultas y los clientes se actualizan cada 45 segundos con la pestaña visible, según lo que publique ESPN.

El plan gratuito de Render puede dormir tras un periodo sin visitas; la primera visita puede esperar alrededor de un minuto. Su disco es temporal, por lo que las actas/plantillas y el historial acumulados pueden perderse al reiniciar. La guía distingue esta prueba de un servidor siempre activo con disco persistente. No se ha contratado ningún plan.

## Verificación

- **110 pruebas de lógica**, incluidas las dos nuevas de contenido y protección de la salida del empaquetador.
- **30 regresiones de navegador** ejecutadas contra la edición ligera, no contra el proyecto completo.
- **24 comprobaciones adicionales** de ocho vistas en 1440, 390 y 320 px. Sin archivos locales ausentes, errores de JavaScript ni desbordamiento del documento.
- **Contenedor construido y arrancado con Node 22 y usuario sin privilegios**. Se verificaron salud V19.1, Champions en el día actual y clasificación ESPN de 36 equipos.
- El contenedor recibe `HOST=0.0.0.0` y respeta `PORT`, igual que la configuración preparada para el alojamiento.

Evidencia pequeña, sin nuevas capturas pesadas: [review/v19-1](review/v19-1/VALIDACION.md). La verificación local y en contenedor no equivale a un despliegue en Render: ese último paso necesita la cuenta de alojamiento.
