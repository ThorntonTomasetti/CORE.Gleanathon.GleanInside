# Deploy-Addin.ps1
# Copies the built plugin and addin manifest to Revit's addins folder.
# Run from the RevitPlugin directory after building in Release.

param(
    [int]$RevitYear = 2024
)

$source = Join-Path $PSScriptRoot "GleanInside.RevitPlugin\bin\Release"
$dest   = Join-Path $env:APPDATA "Autodesk\Revit\Addins\$RevitYear"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

$files = @(
    "GleanInside.RevitPlugin.dll",
    "Microsoft.Web.WebView2.Core.dll",
    "Microsoft.Web.WebView2.Wpf.dll",
    "WebView2Loader.dll",
    "GleanInside.addin"
)

foreach ($f in $files) {
    $src = Join-Path $source $f
    if (Test-Path $src) {
        Copy-Item $src $dest -Force
        Write-Host "Copied: $f"
    } else {
        Write-Warning "Missing: $f — build first?"
    }
}

Write-Host "`nDeployed to $dest"
Write-Host "Restart Revit to load the plugin."
