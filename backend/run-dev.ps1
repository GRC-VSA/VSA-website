$envFile = ".env"

if (!(Test-Path $envFile)) {
    Write-Host "Missing .env file. Create backend/.env first." -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*$") {
        return
    }

    if ($_ -match "^\s*#") {
        return
    }

    $name, $value = $_ -split "=", 2

    if ($name -and $value) {
        [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    }
}

.\mvnw spring-boot:run