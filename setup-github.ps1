# Bind this folder to the GitHub repo and push the first commit.
# Safe to re-run: every step is idempotent.
# Usage:  powershell -ExecutionPolicy Bypass -File .\setup-github.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

$Remote = "git@github.com:Lin596666/workspace-moni.git"
$Name   = "Lin596666"
$Email  = "jin656169299@163.com"

Write-Host "==> Working directory: $PWD"

# 1. check git
git --version
if ($LASTEXITCODE -ne 0) { Write-Host "git not found in PATH."; exit 1 }

# 2. test SSH to GitHub (exit code 1 is normal here)
Write-Host "`n==> Testing SSH to GitHub ..."
$sshOut = ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1
$sshOut | Write-Host
if ($sshOut -match "successfully authenticated") {
    Write-Host "SSH OK" -ForegroundColor Green
} else {
    Write-Host "SSH FAILED - check key / ssh-agent before pushing." -ForegroundColor Yellow
}

# 3. identity
git config user.name  $Name
git config user.email $Email

# 4. init
git rev-parse --git-dir *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n==> Initializing repository ..."
    git init -b main
} else {
    Write-Host "`n==> Repository already exists, skipping init."
}

# 5. stage + commit
git add -A
git commit -m "chore: init repository"
if ($LASTEXITCODE -ne 0) { Write-Host "(nothing to commit, continuing)" }

# 6. make sure we are on main
git branch -M main

# 7. remote
git remote remove origin *> $null
git remote add origin $Remote
Write-Host "`n==> Remote set to $Remote"

# 8. push
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "push failed - see message above" -ForegroundColor Red
    exit 1
}

Write-Host "`n==> DONE. Repository synced." -ForegroundColor Green
git log --oneline -1
git remote -v
