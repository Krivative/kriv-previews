param([switch]$Demo, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$port = if ($Demo) { 4324 } else { 4321 }
$marker = if ($Demo) { 'kriv-sales-demo-v1' } else { 'kriv-sales-v1' }
$entry = if ($Demo) { 'scripts/sales-demo.mjs' } else { 'lead-desk/server.mjs' }
$url = "http://127.0.0.1:$port"
try {
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $entry))) { throw 'The KRIV launcher files are incomplete.' }
    if ($CheckOnly) {
        [PSCustomObject]@{ Repository = $repoRoot; Entry = $entry; Url = "$url/#sales"; Node = $nodePath; StartsServer = $false }
        exit 0
    }
    function Read-Ready {
        try { (Invoke-WebRequest -Uri "$url/sales-ready" -UseBasicParsing -TimeoutSec 2).Content.Trim() } catch { '' }
    }
    if ((Read-Ready) -ne $marker) {
        $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($listener) { throw "An older KRIV server or another app is using port $port. Close that server, then open this launcher again. No process was stopped." }
        # Launch in the repository, preserve settings, and suppress terminal windows.
        $arguments = '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning "' + (Join-Path $repoRoot $entry) + '" --no-open'
        Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory $repoRoot -WindowStyle Hidden
        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if ((Read-Ready) -eq $marker) { $ready = $true; break }
            Start-Sleep -Milliseconds 500
        }
        if (-not $ready) { throw 'KRIV did not start. Check that dependencies are installed and the port is available.' }
    }
    Start-Process "$url/#sales"
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'KRIV Sales', 'OK', 'Error')
    exit 1
}
