@echo off
title Sistema Privado - Procuradores Sustitutos Espana
echo ========================================================
echo   Iniciando Servidor Seguro - Procuradores Sustitutos
echo   Clave de Acceso: 2121
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

