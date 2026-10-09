# Script de pruebas locales nativo en PowerShell
# Proyecto: Evaluacion (API REST Node.js + Express + SQLite + TCP Sockets)
# No requiere instalar HTTPie ni dependencias externas.
#
# COMO USARLO:
#   1. Abre una terminal PowerShell como administrador (si usas puerto 80)
#      O bien: cambia el puerto en index.js (ej: const HTTP_PORT = 3000)
#   2. En la carpeta Evaluacion ejecuta:  npm install
#   3. Levanta el servidor local:        node index.js
#   4. En OTRA terminal PowerShell ejecuta:  .\test_local.ps1
#
# Si no quieres usar el puerto 80 localmente (evitar admin), modifica aqui abajo $HttpPort.

$BaseUrl = "http://localhost:3000"
$TcpPort = 6061
$TcpHost = "127.0.0.1"

function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Body = $null,
        [string]$Description = ""
    )

    $url = "$BaseUrl$Path"
    Write-Host "`n>>> [$Method] $Path" -ForegroundColor White
    if ($Description) {
        Write-Host "    $Description" -ForegroundColor Gray
    }

    try {
        $params = @{
            Uri = $url
            Method = $Method
            UseBasicParsing = $true
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["Headers"] = @{ "Content-Type" = "application/json; charset=utf-8" }
        }

        $resp = Invoke-WebRequest @params
        Write-Host "HTTP/1.1 $($resp.StatusCode) $($resp.StatusDescription)" -ForegroundColor Green
        try {
            $formatted = $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
            Write-Host $formatted
        } catch {
            Write-Host $resp.Content
        }
    } catch {
        if ($_.Exception.Response) {
            $resp = $_.Exception.Response
            $status = [int]$resp.StatusCode
            $desc = $resp.StatusDescription
            $color = if ($status -ge 500) { "Red" } elseif ($status -eq 404) { "DarkYellow" } else { "Yellow" }
            Write-Host "HTTP/1.1 $status $desc" -ForegroundColor $color
            try {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $content = $reader.ReadToEnd()
                $formatted = $content | ConvertFrom-Json | ConvertTo-Json -Depth 5
                Write-Host $formatted
            } catch {
                Write-Host $_.Exception.Message
            }
        } else {
            Write-Host "Error de conexion: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Invoke-SocketTest {
    param(
        [string]$Comando,
        [string]$Description = ""
    )

    Write-Host "`n>>> [TCP $TcpHost`:$TcpPort] $Comando" -ForegroundColor White
    if ($Description) {
        Write-Host "    $Description" -ForegroundColor Gray
    }

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect($TcpHost, $TcpPort)
        $stream = $client.GetStream()
        $writer = New-Object System.IO.StreamWriter($stream)
        $writer.AutoFlush = $true
        $reader = New-Object System.IO.StreamReader($stream)

        $writer.Write($Comando)

        Start-Sleep -Milliseconds 600

        if ($stream.DataAvailable) {
            $respuesta = $reader.ReadToEnd()
            Write-Host "Respuesta TCP:" -ForegroundColor Green
            Write-Host $respuesta.TrimEnd()
        } else {
            Write-Host "Aviso: No se recibio respuesta inmediata del socket" -ForegroundColor Yellow
        }

        $reader.Close()
        $writer.Close()
        $stream.Close()
        $client.Close()
    } catch {
        Write-Host "Error de conexion TCP: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO PRUEBAS LOCALES (Evaluacion - Node.js API)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Base URL HTTP : $BaseUrl" -ForegroundColor DarkCyan
Write-Host "Socket TCP    : $TcpHost`:$TcpPort" -ForegroundColor DarkCyan

# 0. Limpieza previa
Write-Host "`n--- [0. Mantenimiento] Limpiar base de datos inicial ---" -ForegroundColor Yellow
Invoke-ApiTest "DELETE" "/vaciar" -Description "Vaciar tablas usuarios y roles para iniciar limpio"

Write-Host "`n==================== 1. HEALTH CHECK ====================" -ForegroundColor Green
Invoke-ApiTest "GET" "/api/health" -Description "Monitoreo del servidor -> Esperado 200 status OK"

Write-Host "`n==================== 2. USUARIOS (CRUD) ====================" -ForegroundColor Green

Invoke-ApiTest "POST" "/usuarios" -Body '{"nombre":"Job De La Vega","rol_id":1}' -Description "Caso exitoso: crear usuario -> Esperado 201"

Invoke-ApiTest "POST" "/usuarios" -Body '{"nombre":"Estudiante IDGS14","rol_id":2}' -Description "Caso exitoso: crear segundo usuario -> Esperado 201"

Invoke-ApiTest "POST" "/usuarios" -Body '{"nombre":""}' -Description "Fallo: nombre vacio -> Esperado 500 o 400 segun validaciones"

Invoke-ApiTest "GET" "/usuarios" -Description "Listar todos los usuarios creados -> Esperado 200"

Invoke-ApiTest "GET" "/usuarios/1" -Description "Obtener usuario ID 1 (existente) -> Esperado 200"

Invoke-ApiTest "GET" "/usuarios/9999" -Description "Fallo: usuario con ID inexistente -> Esperado 404"

Invoke-ApiTest "PUT" "/usuarios/1" -Body '{"nombre":"Job De La Vega Villalobos","rol_id":3}' -Description "Actualizar usuario existente -> Esperado 200"

Invoke-ApiTest "PUT" "/usuarios/9999" -Body '{"nombre":"Inexistente","rol_id":1}' -Description "Fallo: actualizar ID inexistente -> Esperado 404"

Invoke-ApiTest "DELETE" "/usuarios/2" -Description "Eliminar usuario 2 (existente) -> Esperado 200"

Invoke-ApiTest "DELETE" "/usuarios/9999" -Description "Fallo: eliminar ID inexistente -> Esperado 200 (changes=0)"

Write-Host "`n==================== 3. RESPALDO DE BD ====================" -ForegroundColor Green
Invoke-ApiTest "GET" "/backup" -Description "Crear copia fisica .sqlite del archivo database.sqlite -> Esperado 200"

Write-Host "`n==================== 4. TCP SOCKET (Puerto 6061) ====================" -ForegroundColor Magenta

Invoke-SocketTest -Comando '{insert:{"nombre":"Usuario VIA SOCKET","rol_id":2}}' -Description "Insertar un usuario directamente por TCP"

Invoke-SocketTest -Comando '{get:1}' -Description "Consultar el usuario con ID 1 a traves del socket"

Invoke-SocketTest -Comando '{comando_inexistente:hola}' -Description "Comando desconocido -> Esperado: 'Comando de socket no reconocido'"

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " TODAS LAS PRUEBAS FINALIZARON                               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "`nSi ves errores de conexion:" -ForegroundColor Yellow
Write-Host "  1. Verifica que levantaste el servidor con:  node index.js" -ForegroundColor Yellow
Write-Host "  2. Si usas el puerto 80 abre PowerShell como Administrador, o cambia HTTP_PORT en index.js a 3000/8080 y actualiza `$BaseUrl arriba" -ForegroundColor Yellow
