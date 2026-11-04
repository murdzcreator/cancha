# CANCHA por enlace

Esta entrega deja preparado el alojamiento; descargar o ejecutar el ZIP no publica la web. `127.0.0.1` sirve únicamente dentro del ordenador que lo abre.

Una vez alojada, cualquier visitante abre la dirección HTTPS desde el móvil o el ordenador. No instala Node.js, no descarga el ZIP y no depende de que el PC del creador esté encendido. El servidor alojado consulta ESPN y las fichas activas comparten consultas cada 10 segundos y reciben avisos al cambiar los datos. Inicio y calendario consultan cada 10 segundos si muestran partidos en juego y cada 30 segundos en los demás casos. La actividad se pausa cuando la página está oculta; el ritmo y los detalles siguen sujetos a lo que publique ESPN.

## Acceso rápido para publicarla

[Preparar el despliegue gratuito de CANCHA en Render](https://render.com/deploy?repo=https://github.com/murdzcreator/cancha/tree/cancha-ligera).

Crea tu cuenta o entra con GitHub. El enlace abre la configuración del servicio, no una web CANCHA ya publicada. Revisa que el servicio `cancha` use el plan **Free** y confirma su creación en tu cuenta. Espera al despliegue y abre la URL HTTPS que devuelva Render. La configuración solo declara este servicio web, sin bases de datos ni discos de pago.

La función y la selección de rama de este enlace se describen en la [guía oficial del botón de despliegue](https://render.com/docs/deploy-to-render).

## Prueba gratuita en Render

1. Entra en tu cuenta de [Render](https://dashboard.render.com/) y elige **New → Web Service**.
2. Conecta el repositorio `https://github.com/murdzcreator/cancha` y selecciona la rama **`cancha-ligera`**.
3. Selecciona runtime **Node**, versión **22**, plan **Free** y directorio raíz vacío.
4. Build command: `node --version`. Start command: `npm start`.
5. Añade la variable `HOST` con valor `0.0.0.0`. Conserva el `PORT` que proporciona Render.
6. Health check: `/api/health`. Crea el servicio y espera a que termine el despliegue.
7. Abre la dirección HTTPS real que devuelva Render y comprueba **Partidos → Champions League → fecha** antes de compartirla. Puedes pasar el enlace de esa pantalla. Para abrir Champions siempre en el día actual de Perú, añade `/#/partidos?liga=ucl` a la dirección real del alojamiento; así no queda fijada una fecha anterior.

El archivo `render.yaml` contiene esos valores para quien prefiera crear el servicio mediante un Blueprint, seleccionando esa misma rama.

### Límites de la prueba gratuita

Render puede dormir el servicio tras 15 minutos sin visitas. La siguiente visita lo despierta; el arranque puede tardar alrededor de un minuto. No es una opción siempre activa. Los cambios en disco son temporales: un reinicio puede borrar las plantillas, actas e historial acumulados; los marcadores se vuelven a consultar y los calendarios públicos incluidos siguen disponibles. Si quieres conservar el archivo entre reinicios, utiliza almacenamiento persistente compatible.

Fuentes: [plan gratuito](https://render.com/docs/free), [servicios web](https://render.com/docs/web-services), [referencia del Blueprint](https://render.com/docs/blueprint-spec). Las condiciones y cuotas pertenecen al proveedor y pueden cambiar.

## Servidor siempre activo

El mismo paquete funciona en un servicio Node o contenedor que permanezca encendido. Configuración: Node.js 22, `npm start`, `HOST=0.0.0.0` y el puerto asignado por el alojamiento. Configura HTTPS en el proveedor. Para conservar estadísticas e historial, monta un disco persistente en `data-cache/` dentro de la carpeta de la aplicación.

No basta con un plan de cómputo de pago para persistir archivos: el almacenamiento debe configurarse por separado. En Render nativo, el directorio de caché de esta rama sería `/opt/render/project/src/data-cache`. En el contenedor, es `/app/data-cache`.

## Docker

La edición ligera incluye un `Dockerfile` que arranca directamente; el proyecto de desarrollo incluye otro que primero construye el paquete. No necesita instalar paquetes npm.

```sh
docker build -t cancha .
docker run --rm -p 4173:4173 -v cancha-datos:/app/data-cache cancha
```

Ese ejemplo verifica el contenedor localmente. Para compartirlo por internet, despliega la imagen en tu alojamiento y utiliza la URL HTTPS que este proporcione. No expongas puertos de tu router para sustituir al alojamiento.

## Qué comprobar antes de compartir

- La web muestra V19.3 y elige el día actual en hora de Perú.
- En Partidos, selecciona Champions League y la fecha que quieras consultar.
- Los marcadores indican fuente y estado; una copia sin actualizar no se anuncia como directo.
- El alojamiento puede contactar con `site.api.espn.com` y `raw.githubusercontent.com`.

Las alineaciones, minuto, tarjetas, sustituciones y estadísticas dependen de la cobertura de ESPN. La consulta periódica no garantiza una transmisión instantánea. Si se duerme o reinicia el servidor, la primera visita puede necesitar más tiempo para recuperar los datos.

Si ya tienes un servicio creado, esta configuración desactiva los despliegues automáticos: usa **Manual Deploy → Deploy latest commit** para cargar V19.3. No hace falta desplegar de nuevo cada día para recibir partidos nuevos.
