@echo off
cd /d "%~dp0"
echo Brasil Coral local: http://127.0.0.1:4180
echo Deja esta ventana abierta mientras uses el programa.
node tools\serve.cjs --port=4180
pause
