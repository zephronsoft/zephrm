# HRM Data Backup Script (Windows PowerShell)
# Backs up SQLite DB from container or volume

$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
$ContainerName = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "hrm-backend" }
$VolumeName = if ($env:VOLUME_NAME) { $env:VOLUME_NAME } else { "hrm_data" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$BackupFile = Join-Path $BackupDir "hrm_$Timestamp.db"

Write-Host "[$(Get-Date)] Starting HRM backup..."

# Option 1: Backup from running container
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "^$ContainerName$" -Quiet
if ($running) {
    docker cp "${ContainerName}:/app/data/dev.db" $BackupFile 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not copy DB from container."
        exit 1
    }
    Write-Host "Backed up from container: $BackupFile"
} else {
    # Option 2: Backup from Docker volume
    $volExists = docker volume inspect $VolumeName 2>$null
    if ($volExists) {
        docker run --rm -v "${VolumeName}:/data" -v "${PWD}/${BackupDir}:/backup" alpine `
            sh -c "cp /data/dev.db /backup/hrm_$Timestamp.db 2>/dev/null || exit 1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARN: No dev.db in volume. Run backup after first backend start."
            exit 1
        }
        Write-Host "Backed up from volume: $BackupFile"
    } else {
        # Option 3: Backup from local dev.db
        $localDb = ".\backend\prisma\dev.db"
        if (Test-Path $localDb) {
            Copy-Item $localDb $BackupFile
            Write-Host "Backed up from local: $BackupFile"
        } else {
            Write-Host "ERROR: No data source found. Start the app first."
            exit 1
        }
    }
}

# Compress with gzip (requires gzip - use 7-Zip or omit on Windows)
$gzFile = "$BackupFile.gz"
if (Get-Command gzip -ErrorAction SilentlyContinue) {
    gzip -f $BackupFile
    Write-Host "[$(Get-Date)] Backup complete: $gzFile"
} else {
    Write-Host "[$(Get-Date)] Backup complete: $BackupFile (uncompressed)"
}
