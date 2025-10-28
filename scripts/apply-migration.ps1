<#
.SYNOPSIS
  Aplica la migración SQL (migrations/0001_create_recipes_with_recommendations.sql) a una base de datos Postgres.

.DESCRIPTION
  Este script intenta obtener la connection string de varias fuentes (parámetro, variable de entorno
  DATABASE_URL o leyendo `src/.env`). Luego ejecuta `psql` para aplicar la migración.

.PARAMETER DatabaseUrl
  (Opcional) La connection string de Postgres. Si no se especifica, el script buscará en $env:DATABASE_URL
  y en `src/.env` (línea DATABASE_URL=...).

USAGE
  # Pasando la cadena como parámetro
  .\scripts\apply-migration.ps1 -DatabaseUrl "postgresql://user:pass@host:5432/dbname"

  # Usando la variable de entorno DATABASE_URL
  $env:DATABASE_URL = "postgresql://..."
  .\scripts\apply-migration.ps1

  # Usando src/.env (añade DATABASE_URL="..." a src/.env)
  .\scripts\apply-migration.ps1

NOTES
  - Requiere que `psql` esté instalado y en el PATH.
  - El script no sube ni expone credenciales; la conexión se hace localmente desde psql.
#>

param(
    [string]$DatabaseUrl
)

function Read-EnvFileValue {
    param(
        [string]$FilePath,
        [string]$Key
    )
    if (-not (Test-Path $FilePath)) { return $null }
    $content = Get-Content $FilePath -Raw
    # Buscar líneas como KEY= or KEY="value"
    $pattern = "(?m)^[\s]*$Key\s*=\s*\"?([^\"\r\n]*)\"?"
    $m = [regex]::Match($content, $pattern)
    if ($m.Success) { return $m.Groups[1].Value.Trim() }
    return $null
}

Write-Host "== Aplicar migración: migrations/0001_create_recipes_with_recommendations.sql =="

if (-not $DatabaseUrl) {
    Write-Host "DatabaseUrl no proporcionado, comprobando variable de entorno DATABASE_URL..."
    $DatabaseUrl = $env:DATABASE_URL
}

if (-not $DatabaseUrl) {
    Write-Host "No existe DATABASE_URL en entorno; intentando leer src/.env..."
    $possible = Read-EnvFileValue -FilePath "src/.env" -Key "DATABASE_URL"
    if ($possible) { $DatabaseUrl = $possible }
}

if (-not $DatabaseUrl) {
    Write-Error "No se encontró DATABASE_URL. Pasa la cadena como parámetro -DatabaseUrl o añade DATABASE_URL a src/.env o establece la variable de entorno DATABASE_URL."
    exit 1
}

# Comprobar psql
try {
    $psqlVersion = & psql --version 2>$null
} catch {
    Write-Error "psql no está disponible en PATH. Instala psql o usa la consola de Supabase para aplicar la migración manualmente."
    exit 1
}

Write-Host "Usando connection string: $($DatabaseUrl.Substring(0,[Math]::Min(40,$DatabaseUrl.Length)))..."

$migrationFile = Join-Path -Path (Get-Location) -ChildPath "migrations/0001_create_recipes_with_recommendations.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Error "No se encontró el archivo de migración: $migrationFile"
    exit 1
}

Write-Host "Ejecutando psql para aplicar la migración..."
& psql $DatabaseUrl -f $migrationFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "psql devolvió un código de salida no cero: $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Migración aplicada correctamente."
