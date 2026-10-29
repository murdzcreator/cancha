@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo ========================================
echo  CANCHA 14.2 - DATOS REALES ABIERTOS
 echo ========================================
echo.
where.exe node >nul 2>&1
if errorlevel 1 goto SIN_NODE
node --version
if not exist "server.mjs" goto SIN_SERVIDOR
echo.
echo Sincronizando Premier League y LaLiga con OpenFootball CC0...
echo Espera la comprobacion de la conexion (sin claves ni registros).
node "scripts\sincronizar-openfootball.mjs"
echo.
echo Iniciando CANCHA en http://127.0.0.1:4173/
echo Puedes revisar Premier League, LaLiga, tablas y calendarios.
echo No cierres esta ventana mientras usas CANCHA.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:4173/"
node "server.mjs"
pause
exit /b 0
:SIN_NODE
echo ERROR: Instala Node.js 20 o superior https://nodejs.org/
pause
exit /b 1
:SIN_SERVIDOR
echo ERROR: Extrae por completo el ZIP. Falta server.mjs
pause
exit /b 1
