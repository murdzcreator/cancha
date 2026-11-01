@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo ========================================
echo  CANCHA V17.2 - TU CENTRO DE FUTBOL
 echo ========================================
echo.
where.exe node >nul 2>&1
if errorlevel 1 goto SIN_NODE
node --version
if not exist "server.mjs" goto SIN_SERVIDOR
echo.
echo ESPN se consulta al abrir calendarios y fichas, sin clave de pago.
echo OpenFootball se sincroniza en segundo plano y completa los calendarios.
echo.
echo Iniciando CANCHA en http://127.0.0.1:4173/
echo Abre Partidos, elige competicion y fecha en hora de Peru.
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
