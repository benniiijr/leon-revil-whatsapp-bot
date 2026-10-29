$ErrorActionPreference = "Stop"

$Fonte = Split-Path -Parent $PSCommandPath
$Destino = "C:\LeonRevil"
$PonteFonte = Join-Path $Fonte "whatsapp-bridge"
$PonteDestino = Join-Path $Destino "whatsapp-bridge"

function Parar-Instalacao([string]$Mensagem) {
    Write-Host ""
    Write-Host $Mensagem -ForegroundColor Red
    exit 1
}

function Confirmar([string]$Pergunta) {
    $resposta = Read-Host "$Pergunta [S/N]"
    return $resposta.Trim().ToUpperInvariant() -in @("S", "SIM")
}

function Atualizar-Path {
    $maquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $usuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$maquina;$usuario"

    $pastasJava = @(
        Get-ChildItem "C:\Program Files\Eclipse Adoptium" `
            -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk-21*" } |
        Sort-Object Name -Descending
    )

    if ($pastasJava.Count -gt 0) {
        $binJava = Join-Path $pastasJava[0].FullName "bin"
        $env:JAVA_HOME = $pastasJava[0].FullName
        $env:Path = "$binJava;$env:Path"
    }
}

function Testar-Node24 {
    $comando = Get-Command node -ErrorAction SilentlyContinue
    if (-not $comando) { return $false }

    $versao = (& node --version 2>$null | Select-Object -First 1)
    if ($versao -match "^v(\d+)\.") {
        return ([int]$Matches[1] -eq 24)
    }

    return $false
}

function Testar-Java21 {
    $comando = Get-Command javac -ErrorAction SilentlyContinue
    if (-not $comando) { return $false }

    $versao = (& javac -version 2>&1 | Out-String)
    if ($versao -match "javac\s+(\d+)") {
        return ([int]$Matches[1] -ge 21)
    }

    return $false
}

function Instalar-Node24 {
    Write-Host ""
    Write-Host "Buscando a versão LTS do Node.js 24 no site oficial..."

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    $indice = Invoke-RestMethod "https://nodejs.org/dist/index.json"
    $versao = $indice |
        Where-Object { $_.version -like "v24.*" -and $_.lts } |
        Select-Object -First 1

    if (-not $versao) {
        throw "Não foi possível localizar uma versão LTS do Node.js 24."
    }

    $nome = "node-$($versao.version)-x64.msi"
    $base = "https://nodejs.org/dist/$($versao.version)"
    $temporario = Join-Path $env:TEMP $nome

    $checksums = Invoke-WebRequest "$base/SHASUMS256.txt"
    $linha = $checksums.Content -split "`n" |
        Where-Object { $_ -match "\s+$([regex]::Escape($nome))\s*$" } |
        Select-Object -First 1

    if ($linha -notmatch "^([a-fA-F0-9]{64})\s+") {
        throw "Não foi possível obter o SHA-256 oficial do instalador."
    }

    $esperado = $Matches[1].ToLowerInvariant()

    Invoke-WebRequest "$base/$nome" -OutFile $temporario

    $obtido = (Get-FileHash $temporario -Algorithm SHA256).Hash.ToLowerInvariant()

    if ($obtido -ne $esperado) {
        Remove-Item $temporario -Force -ErrorAction SilentlyContinue
        throw "A verificação SHA-256 falhou. O instalador não será executado."
    }

    Write-Host "SHA-256 verificado. Instalando Node.js $($versao.version)..."

    $processo = Start-Process "$env:SystemRoot\System32\msiexec.exe" `
        -ArgumentList "/i `"$temporario`" /passive /norestart" `
        -Wait -PassThru

    Remove-Item $temporario -Force -ErrorAction SilentlyContinue

    if ($processo.ExitCode -notin @(0, 3010)) {
        throw "O instalador do Node.js retornou o código $($processo.ExitCode)."
    }

    Atualizar-Path
}

function Instalar-Java21 {
    $winget = Get-Command winget -ErrorAction SilentlyContinue

    if (-not $winget) {
        Write-Host "O winget não está disponível." -ForegroundColor Yellow
        Write-Host "Instale o JDK 21 pelo site oficial:"
        Write-Host "https://adoptium.net/temurin/releases/?version=21"

        Start-Process "https://adoptium.net/temurin/releases/?version=21"
        throw "Instale o JDK 21, abra um novo PowerShell e execute o instalador novamente."
    }

    & winget install --id EclipseAdoptium.Temurin.21.JDK `
        --exact --source winget `
        --accept-source-agreements `
        --accept-package-agreements

    if ($LASTEXITCODE -ne 0) {
        throw "A instalação do JDK 21 falhou. Código: $LASTEXITCODE"
    }

    Atualizar-Path
}

try {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       LEON REVIL - INSTALADOR" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Origem:  $Fonte"
    Write-Host "Destino: $Destino"
    Write-Host ""

    # Elevação solicitada pelo Windows somente quando necessária.
    $identidade = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identidade)
    $admin = $principal.IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )

    if (-not $admin) {
        Write-Host "O instalador precisa de permissão de administrador."
        $argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        $processo = Start-Process powershell.exe -Verb RunAs `
            -ArgumentList $argumentos -Wait -PassThru
        exit $processo.ExitCode
    }

    if (-not (Test-Path (Join-Path $Fonte "src"))) {
        throw "Pasta src não encontrada na origem."
    }

    if (-not (Test-Path (Join-Path $PonteFonte "package.json"))) {
        throw "whatsapp-bridge/package.json não encontrado."
    }

    if (-not (Test-Path (Join-Path $PonteFonte "package-lock.json"))) {
        throw "whatsapp-bridge/package-lock.json não encontrado."
    }

    if (-not (Test-Path (Join-Path $PonteFonte "index.js"))) {
        throw "whatsapp-bridge/index.js não encontrado."
    }

    if (-not (Confirmar "Deseja instalar ou atualizar o Leon em $Destino?")) {
        Write-Host "Operação cancelada. Nenhum arquivo do projeto foi copiado."
        exit 0
    }

    # Verifica Node.js e pede autorização antes de instalar.
    Atualizar-Path

    if (-not (Testar-Node24)) {
        if (-not (Confirmar "Node.js 24 LTS não detectado. Instalar o Node.js 24 LTS oficial?")) {
            throw "Node.js necessário. Instalação cancelada pelo usuário."
        }

        Instalar-Node24
    }

    if (-not (Testar-Node24)) {
        throw "Node.js 24 ou superior não foi encontrado após a instalação."
    }

    # Verifica Java e pede autorização antes de instalar.
    if (-not (Testar-Java21)) {
        if (-not (Confirmar "JDK 21 ou superior não detectado. Instalar o JDK 21?")) {
            throw "JDK 21 necessário. Instalação cancelada pelo usuário."
        }

        Instalar-Java21
    }

    if (-not (Testar-Java21)) {
        throw "javac 21 ou superior não foi encontrado. Confira a instalação do Java."
    }

    Write-Host ""
    Write-Host "Node.js: $(& node --version)"
    Write-Host "npm:     $(& npm --version)"
    Write-Host "Java/JDK: validado pela verificação anterior"
    Write-Host "Javac:    compilador disponível e versão mínima atendida"

    if (Test-Path $Destino) {
        Write-Host ""
        Write-Host "A pasta de destino já existe." -ForegroundColor Yellow
        Write-Host "Os arquivos extras e a sessão WhatsApp existente serão preservados."
    }

    # Cria a pasta de destino sem apagar conteúdo preexistente.
    New-Item -ItemType Directory -Path $Destino -Force | Out-Null

    # Copia apenas arquivos de projeto. Não usa /MIR nem apaga arquivos
    # extras do destino. A sessão auth-leon nunca é copiada da origem.
    $pastasExcluidas = @(
        (Join-Path $Fonte ".git"),
        (Join-Path $Fonte ".idea"),
        (Join-Path $Fonte "node_modules"),
        (Join-Path $Fonte "build"),
        (Join-Path $Fonte "whatsapp-bridge\node_modules"),
        (Join-Path $Fonte "whatsapp-bridge\auth-leon"),
        (Join-Path $Fonte "whatsapp-bridge\temp"),
        (Join-Path $Fonte "whatsapp-bridge\logs"),
        (Join-Path $Fonte "temp"),
        (Join-Path $Fonte "logs")
    )

    $arquivosExcluidos = @(
        "*.bak-*",
        "*.iml",
        "*.class",
        "*.log",
        ".env",
        "creds.json",
        "app-state-sync-version.json"
    )

    $argumentosRobocopy = @(
        $Fonte, $Destino, "/E", "/R:2", "/W:1", "/XJ", "/NFL", "/NDL",
        "/XD"
    ) + $pastasExcluidas + @("/XF") + $arquivosExcluidos

    Write-Host ""
    Write-Host "Copiando os arquivos do projeto..."
    & robocopy.exe @argumentosRobocopy
    $codigoCopia = $LASTEXITCODE

    if ($codigoCopia -ge 8) {
        throw "Falha na cópia dos arquivos. Código do Robocopy: $codigoCopia"
    }

    # Instala as dependências a partir do lockfile.
    Write-Host ""
    Write-Host "Instalando dependências do WhatsApp bridge..."

    Push-Location $PonteDestino
    try {
        & npm ci --no-audit --no-fund
        $codigoNpm = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($codigoNpm -ne 0) {
        throw "npm ci falhou. Código: $codigoNpm"
    }

    # Compila o Java para compatibilidade com Java 21.
    Write-Host ""
    Write-Host "Compilando o Java..."

    $pastaFontes = Join-Path $Destino "src"
    $pastaClasses = Join-Path $Destino "build\classes"

    $fontesJava = @(
        Get-ChildItem -LiteralPath $pastaFontes -Filter "*.java" -File |
        ForEach-Object { $_.FullName }
    )

    if ($fontesJava.Count -eq 0) {
        throw "Nenhum arquivo .java foi encontrado em src."
    }

    New-Item -ItemType Directory -Path $pastaClasses -Force | Out-Null

    & javac --release 21 -encoding UTF-8 -d $pastaClasses @fontesJava

    if ($LASTEXITCODE -ne 0) {
        throw "A compilação Java falhou."
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       INSTALAÇÃO CONCLUÍDA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Leon instalado em: $Destino"
    Write-Host ""
    Write-Host "Para iniciar posteriormente, execute:"
    Write-Host "$Destino\iniciar-leon.bat"
    Write-Host ""
    Write-Host "Nenhuma sessão WhatsApp foi importada ou conectada."
    Write-Host "O usuário poderá escanear o próprio QR Code ao iniciar o bot."
    Write-Host ""

    exit 0
}
catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "A instalação não foi concluída."
    exit 1
}