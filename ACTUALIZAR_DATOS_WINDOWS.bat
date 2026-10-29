@echo off
setlocal EnableExtensions
cd /d "%~dp0"
where.exe node >nul 2>&1
if errorlevel 1 goto SIN_NODE
echo CANCHA - Actualizando archivos abiertos (no resultados en vivo)...
node "scripts\sincronizar-openfootball.mjs" --forzar
echo.
echo Cierra y vuelve a iniciar CANCHA para actualizar el calendario.
pause
exit /b 0
:SIN_NODE
echo Instala Node.js 20 o superior.
pause
exit /b 1
