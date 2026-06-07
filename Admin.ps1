param (
    [string]$Action = "add"
)

$ErrorActionPreference = "Stop"

# Get current directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$JsonPath = "data\supporters.json"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "   URBEX APP - HALL OF FAME ADMIN   " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Pull latest changes first
Write-Host "[1/3] Pruefe auf Updates von GitHub..." -ForegroundColor Yellow
try {
    git pull origin main
} catch {
    Write-Host "WARNUNG: Git Pull fehlgeschlagen. Mache trotzdem weiter." -ForegroundColor Red
}

$Name = Read-Host "Name des neuen Supporters"
if ([string]::IsNullOrWhiteSpace($Name)) {
    Write-Host "Abbruch: Name darf nicht leer sein." -ForegroundColor Red
    Pause
    exit
}

Write-Host ""
Write-Host "Waehle den Rang (Zahl eingeben):"
Write-Host "1 - Basecamp Rookie (Weiss)"
Write-Host "2 - Urbex Scout (Blau)"
Write-Host "3 - Stollen-Kriecher (Orange)"
Write-Host "4 - Schachtsteiger (Lila)"
Write-Host "5 - Expeditionsleiter (Grau/Dunkel)"
Write-Host "6 - Grubenwehr (Rot)"
$RankChoice = Read-Host "Deine Wahl [1-6]"

$Rank = ""
$Color = ""
$TextColor = "#fff"

switch ($RankChoice) {
    "1" { $Rank = "Basecamp Rookie"; $Color = "#ecf0f1"; $TextColor = "#333" }
    "2" { $Rank = "Urbex Scout"; $Color = "#2980b9" }
    "3" { $Rank = "Stollen-Kriecher"; $Color = "#d35400" }
    "4" { $Rank = "Schachtsteiger"; $Color = "#8e44ad" }
    "5" { $Rank = "Expeditionsleiter"; $Color = "#2c3e50" }
    "6" { $Rank = "Grubenwehr"; $Color = "#e74c3c" }
    default { 
        Write-Host "Ungueltige Auswahl. Abbruch." -ForegroundColor Red
        Pause
        exit 
    }
}

# Read JSON
$JsonContent = Get-Content $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Create new entry
if ($TextColor -eq "#fff") {
    $NewEntry = [PSCustomObject]@{
        name = $Name
        rank = $Rank
        color = $Color
    }
} else {
    $NewEntry = [PSCustomObject]@{
        name = $Name
        rank = $Rank
        color = $Color
        textColor = $TextColor
    }
}

# Add to array
$JsonContent += $NewEntry

# Save back to JSON
$JsonContent | ConvertTo-Json -Depth 5 | Set-Content $JsonPath -Encoding UTF8

Write-Host ""
Write-Host "[2/3] $Name ($Rank) wurde zur Liste hinzugefuegt!" -ForegroundColor Green
Write-Host "[3/3] Lade Daten auf Server hoch (Bitte warten)..." -ForegroundColor Yellow

# Git commands
git add $JsonPath
git commit -m "Admin Tool: Hinzufuegen von $Name als $Rank"
git push origin main

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "          FERTIG! ERFOLGREICH       " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Die App auf den Handys aktualisiert sich nun automatisch beim naechsten Start."
Pause
