$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
try {
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $entry = Join-Path $repoRoot 'scripts/verify-sales-provider.mjs'
    # Explicit user launch runs one fictional request in the normal desktop context.
    & $nodePath --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning $entry
    $result = if ($LASTEXITCODE -eq 0) { 'Claude generated and validated a fictional draft successfully.' } else { 'The fictional Claude check failed. The saved report contains the result.' }
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($result + "`nReport: " + (Join-Path $repoRoot 'shots/sales-provider-check.json'), 'KRIV Claude check')
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'KRIV Claude check', 'OK', 'Error')
    exit 1
}
