@echo off
cd /d "%~dp0"
echo CareerOps - abre http://127.0.0.1:3000 en tu navegador.
echo Manten esta ventana abierta mientras usas la aplicacion.
call npm.cmd run dev
pause
