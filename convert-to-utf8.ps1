#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Converts all project files to UTF-8 encoding without BOM.

.DESCRIPTION
    This script scans the project directory and converts all text files
    (.js, .json, .html, .css, .md) to UTF-8 encoding without BOM.
    
    Run this script if you encounter encoding issues or after receiving
    files in different encodings.

.EXAMPLE
    .\convert-to-utf8.ps1
#>

param(
    [string]$Path = "."
)

Write-Host "Converting files in '$Path' to UTF-8 encoding..." -ForegroundColor Green
Write-Host ""

$extensions = '\.(js|json|html|css|md)$'
$files = Get-ChildItem -Path $Path -Recurse -File | Where-Object { $_.Extension -match $extensions }

if ($files.Count -eq 0) {
    Write-Host "No files to convert." -ForegroundColor Yellow
    exit 0
}

$converted = 0
$errors = 0

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✓ $($file.FullName)" -ForegroundColor Green
        $converted++
    }
    catch {
        Write-Host "✗ $($file.FullName) - Error: $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "Conversion complete:" -ForegroundColor Cyan
Write-Host "  Converted: $converted files" -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "  Errors: $errors files" -ForegroundColor Red
}
