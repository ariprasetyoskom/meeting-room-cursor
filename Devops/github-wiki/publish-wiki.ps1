# Push Devops/github-wiki/*.md to GitHub Wiki (separate git repo).
# Prerequisite: at least one wiki page exists on GitHub (Wiki tab → Create first page),
# or push will fail with "Repository not found".
param(
  [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$remote = "https://github.com/ariprasetyoskom/meeting-room-cursor.wiki.git"

Push-Location $here
if (-not (Test-Path .git)) {
  git init -b $Branch
  git remote add origin $remote
} else {
  git remote set-url origin $remote
}

git add Home.md Getting-Started.md Product-and-Roadmap.md Troubleshooting.md Documentation-Index.md _Sidebar.md README.md
$staged = git diff --cached --name-only
if ($staged) {
  git -c user.email="wiki@local" -c user.name="Cursor Wiki" commit -m "Update wiki from monorepo Devops/github-wiki"
}
git push -u origin $Branch
Pop-Location
Write-Host "Done. Open: https://github.com/ariprasetyoskom/meeting-room-cursor/wiki"
