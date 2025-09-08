<#
.SYNOPSIS
  Build → Load to Minikube → Update Deployment → Wait for Rollout (Backend)

.USAGE
  .\deploy-backend.ps1
  # או עם פרמטרים:
  .\deploy-backend.ps1 -Namespace workbridge -Deployment backend -Container backend -Dockerfile .\Dockerfile -ContextPath .

.NOTES
  מריץ מ־PowerShell. דורש Docker, kubectl, minikube.
#>

param(
  [string]$Namespace   = "workbridge",
  [string]$Deployment  = "backend",
  [string]$Container   = "backend",
  [string]$Dockerfile  = ".\Dockerfile",
  [string]$ContextPath = "."
)

$ErrorActionPreference = "Stop"

function Check-Cli($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required CLI: $name"
  }
}

function Log([string]$msg) { Write-Host "[`$(Get-Date -Format 'HH:mm:ss')`] $msg" }

try {
  Log "Checking prerequisites..."
  Check-Cli docker
  Check-Cli kubectl
  Check-Cli minikube

  if (-not (Test-Path $Dockerfile)) {
    throw "Dockerfile not found at path '$Dockerfile'"
  }

  # 1) תג זמן חדש כדי לחסל קאש
  $TAG = ("workbridge-backend:{0}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  Log "Image tag: $TAG"

  # 2) Build נקי
  Log "Building Docker image (no cache)..."
  docker build --no-cache -t $TAG -f $Dockerfile $ContextPath

  # 3) טעינת האימג' ל-Minikube
  Log "Loading image into Minikube..."
  minikube image load $TAG --overwrite=true

  # 4) עדכון הדפלוימנט לתמונה החדשה
  $fullDeployment = "deploy/$Deployment"
  Log "Patching deployment '$fullDeployment' (namespace: $Namespace) with image $TAG..."
  kubectl -n $Namespace set image $fullDeployment $Container=$TAG

  # 5) המתן לסיום ה-rollout
  Log "Waiting for rollout to complete..."
  kubectl -n $Namespace rollout status $fullDeployment

  # 6) הצגת פודס רלוונטיים בסוף
  Log "Rollout done. Current pods:"
  kubectl -n $Namespace get pods -l app=$Deployment -o wide

  Log "✅ Done. Deployed image: $TAG"
}
catch {
  Write-Error "❌ Deployment failed: $($_.Exception.Message)"
  exit 1
}
