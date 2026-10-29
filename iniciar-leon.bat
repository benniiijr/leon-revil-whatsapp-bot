@echo off
setlocal
title Leon Revil - WhatsApp Bot

set "LEON_ROOT=%~dp0"
set "LEON_BRIDGE=%LEON_ROOT%whatsapp-bridge"

echo.
echo ========================================
echo       LEON REVIL - WHATSAPP BOT
echo ========================================
echo.

if not exist "%LEON_BRIDGE%\index.js" (
    echo ERRO: arquivo principal do WhatsApp nao encontrado.
    goto erro
)

if not exist "%LEON_BRIDGE%\package-lock.json" (
    echo ERRO: package-lock.json nao encontrado.
    goto erro
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado.
    goto erro
)

where java >nul 2>&1
if errorlevel 1 (
    echo ERRO: Java nao encontrado.
    goto erro
)

where javac >nul 2>&1
if errorlevel 1 (
    echo ERRO: compilador Java nao encontrado.
    goto erro
)

if not exist "%LEON_BRIDGE%\node_modules\@whiskeysockets\baileys\package.json" (
    echo ERRO: dependencias do bot nao encontradas.
    echo Execute o instalador do Leon para preparar o projeto.
    goto erro
)

echo Compilando os arquivos Java...

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$src = Join-Path $env:LEON_ROOT 'src'; $out = Join-Path $env:LEON_ROOT 'build\classes'; $files = @(Get-ChildItem -LiteralPath $src -Filter '*.java' -File | ForEach-Object { $_.FullName }); if ($files.Count -eq 0) { Write-Error 'Nenhum arquivo Java encontrado.'; exit 1 }; New-Item -ItemType Directory -Force -Path $out | Out-Null; & javac --release 21 -encoding UTF-8 -d $out $files; exit $LASTEXITCODE"

if errorlevel 1 (
    echo.
    echo ERRO: nao foi possivel compilar o Java.
    goto erro
)

echo.
echo Java compilado com sucesso.
echo Iniciando o Leon...
echo Se aparecer um QR Code, escaneie pelo WhatsApp.
echo Para encerrar, use Ctrl+C.
echo.

pushd "%LEON_BRIDGE%"
node index.js
set "LEON_EXIT=%ERRORLEVEL%"
popd

echo.
echo O Leon foi encerrado. Codigo de saida: %LEON_EXIT%
pause
exit /b %LEON_EXIT%

:erro
echo.
echo Verifique a mensagem acima antes de tentar novamente.
pause
exit /b 1