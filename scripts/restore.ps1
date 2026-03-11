# HRM Data Restore Script (Windows PowerShell)
# Usage: .\restore.ps1 <backup_file.db.gz>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ContainerName = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "hrm-backend" }
$VolumeName = if ($env:VOLUME_NAME) { $env:VOLUME_NAME } else { "hrm_data" }

if (-not (Test-Path $BackupFile)) {
    Write-Host "ERROR: Backup file not found: $BackupFile"
    exit 1
}

Write-Host "[$(Get-Date)] Restoring from $BackupFile..."

$RestoreFile = $BackupFile
if ($BackupFile -match '\.gz$') {
    $outPath = Join-Path (Split-Path $BackupFile) ((Split-Path $BackupFile -Leaf) -replace '\.gz$','.db')
    try {
        $fs = [System.IO.File]::OpenRead((Resolve-Path $BackupFile).Path)
        $gs = New-Object System.IO.Compression.GZipStream($fs, [System.IO.Compression.CompressionMode]::Decompress)
        $out = [System.IO.File]::Create($outPath)
        $gs.CopyTo($out)
        $out.Close(); $gs.Close(); $fs.Close()
        $RestoreFile = $outPath
    } catch {
        Write-Host "ERROR: Could not decompress. Use uncompressed .db or install gzip."
        exit 1
    }
}
$RestoreFileAbs = (Resolve-Path $RestoreFile).Path -replace '\\','/'

# Option 1: Restore to running container
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "^$ContainerName$" -Quiet
if ($running) {
    docker cp $RestoreFileAbs "${ContainerName}:/app/data/dev.db"
    Write-Host "Restored. Restart backend: docker restart $ContainerName"
    exit 0
}

# Option 2: Restore to volume
$volExists = docker volume inspect $VolumeName 2>$null
if ($volExists) {
    $AbsPath = $RestoreFileAbs
    docker run --rm -v "${VolumeName}:/data" -v "${AbsPath}:/restore.db:ro" alpine cp /restore.db /data/dev.db
    Write-Host "Restored to volume. Start: docker compose up -d"
    exit 0
}

# Option 3: Restore to local
New-Item -ItemType Directory -Force -Path ".\backend\prisma" | Out-Null
Copy-Item $RestoreFileAbs ".\backend\prisma\dev.db"
Write-Host "Restored to backend\prisma\dev.db"
