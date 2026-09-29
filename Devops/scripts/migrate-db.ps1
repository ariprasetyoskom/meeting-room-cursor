# Jalankan dari root repo: .\Devops\scripts\migrate-db.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dockerDir = Join-Path $root "Devops\docker"
$webDir = Join-Path $root "Apps\web"

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Push-Location $dockerDir
  docker compose up -d
  Pop-Location
  Write-Host "Waiting for Postgres health..."
  Start-Sleep -Seconds 8
} else {
  Write-Warning "Docker tidak ditemukan. Pastikan Postgres jalan dan DATABASE_URL di Apps/web/.env.local benar."
}

Push-Location $webDir
if (Test-Path ".env.local") {
  Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
  }
}
npm run db:migrate
npm run db:seed
Pop-Location
