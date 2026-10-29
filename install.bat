@echo off
setlocal
title Instalador - Leon Revil

echo.
echo ========================================
echo       LEON REVIL - INSTALADOR
echo ========================================
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
set "CODIGO=%ERRORLEVEL%"

echo.
if not "%CODIGO%"=="0" (
    echo O instalador terminou com erro. Codigo: %CODIGO%
)
pause
exit /b %CODIGO%