# CANCHA V14 - Instrucciones para Windows (inicio corregido)

1. Instala Node.js 20 o superior (LTS) desde https://nodejs.org/ si no lo tienes.
2. Extrae **todo** el ZIP en una carpeta nueva.
3. Entra en `CANCHA_V14` y ejecuta `INICIAR_CANCHA_WINDOWS.bat`.
4. Si el navegador no se abre solo, entra en http://127.0.0.1:4173/ .
5. Mantén la ventana negra abierta mientras uses CANCHA.

El iniciador original tenia saltos de linea de Linux (LF). Esta revision utiliza CRLF, compatible con el interprete de comandos de Windows.

Para comprobar Node.js, abre CMD y ejecuta `node --version`. Si Windows no lo reconoce despues de instalarlo, cierra y vuelve a abrir CMD.

El archivo `.bat` solo inicia el servidor local. No instala SoccerData ni incorpora resultados nuevos automaticamente.
