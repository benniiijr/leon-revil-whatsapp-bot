$ErrorActionPreference = "Stop"

$Destino = "C:\LeonRevil"

$Identidade = [Security.Principal.WindowsIdentity]::GetCurrent()
$Principal = New-Object Security.Principal.WindowsPrincipal($Identidade)
$Admin = $Principal.IsInRole(
[Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $Admin) {
Write-Host "Solicitando permissao de administrador..." -ForegroundColor Yellow

$Argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $Argumentos
exit

}

Write-Host ""
Write-Host "===== DESINSTALADOR LEON REVIL =====" -ForegroundColor Cyan
Write-Host "Pasta de instalacao: $Destino"
Write-Host ""
Write-Host "Feche primeiro a janela do bot, caso esteja em execucao."
Write-Host "Todos os arquivos dentro de C:\LeonRevil serao removidos."

if (-not (Test-Path -LiteralPath $Destino -PathType Container)) {
Write-Host "A pasta de instalacao nao foi encontrada." -ForegroundColor Yellow
Read-Host "Pressione Enter para sair"
exit 0
}

$Confirmacao = Read-Host "Deseja continuar? Digite SIM"
if ($Confirmacao -cne "SIM") {
Write-Host "Operacao cancelada." -ForegroundColor Yellow
Read-Host "Pressione Enter para sair"
exit 0
}

$Sessao = Join-Path $Destino "whatsapp-bridge\auth-leon"
$PreservarSessao = $false
$BackupSessao = $null

if (Test-Path -LiteralPath $Sessao -PathType Container) {
Write-Host ""
Write-Host "Foi encontrada uma pasta de autenticacao do WhatsApp." -ForegroundColor Yellow
Write-Host "Se nao fizer uma copia, a sessao sera apagada junto com a instalacao."

$Resposta = Read-Host "Deseja preservar uma copia? Digite SIM para preservar"

if ($Resposta -ceq "SIM") {
    $Data = Get-Date -Format "yyyyMMdd-HHmmss"
    $BackupSessao = Join-Path $env:USERPROFILE "LeonRevil-auth-backup-$Data"

    try {
        New-Item -ItemType Directory -Path $BackupSessao -Force | Out-Null

        Copy-Item `
            -LiteralPath $Sessao `
            -Destination (Join-Path $BackupSessao "auth-leon") `
            -Recurse -Force

        $PreservarSessao = $true
        Write-Host "Copia da sessao criada em: $BackupSessao" -ForegroundColor Green
    }
    catch {
        Write-Host "Nao foi possivel preservar a sessao. Desinstalacao cancelada." -ForegroundColor Red
        Write-Host $_.Exception.Message
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

}

try {
Remove-Item -LiteralPath $Destino -Recurse -Force -ErrorAction Stop

Write-Host ""
Write-Host "Leon Revil desinstalado." -ForegroundColor Green

if ($PreservarSessao) {
    Write-Host "A sessao foi preservada separadamente em:" -ForegroundColor Yellow
    Write-Host $BackupSessao
    Write-Host "Guarde essa pasta em seguranca."
}
else {
    Write-Host "Nenhuma copia separada da sessao foi criada." -ForegroundColor Yellow
}

}
catch {
Write-Host "A desinstalacao nao foi concluida por completo." -ForegroundColor Red
Write-Host $_.Exception.Message
Write-Host "Feche os processos do bot e tente novamente."
}

Read-Host "Pressione Enter para sair"