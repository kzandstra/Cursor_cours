# Script pour utiliser npm avec PowerShell
# Utilisez: .\use-npm.ps1 install
# ou: .\use-npm.ps1 start

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$npmCmd = "npm.cmd"

if ($Command -eq "help" -or $Command -eq "") {
    Write-Host "Usage: .\use-npm.ps1 [command] [args...]"
    Write-Host "Exemples:"
    Write-Host "  .\use-npm.ps1 install"
    Write-Host "  .\use-npm.ps1 start"
    Write-Host "  .\use-npm.ps1 run android"
    exit 0
}

$fullCommand = "$npmCmd $Command $($Args -join ' ')"
Invoke-Expression $fullCommand
