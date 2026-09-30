# Jalankan scheduler Kanban (Task Scheduler Windows) — PRD F-SCH-07
param(
  [switch]$Sync,
  [switch]$DryRunSync,
  [switch]$Json
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $repoRoot

$nodeArgs = @("Devops/scripts/run-project-scheduler.mjs")
if ($Json) { $nodeArgs += "--json" }
if ($Sync) { $nodeArgs += "--sync" }
if ($DryRunSync) { $nodeArgs += "--dry-run" }

& node @nodeArgs
exit $LASTEXITCODE
