# ============================================================================
# MCP Drive - Tests con curl (PowerShell)
# ============================================================================
# Este script prueba todos los endpoints del servidor MCP usando curl
#
# Uso:
#   .\tests\test-curl.ps1
#
# Prerequisitos:
#   - Servidor corriendo: pnpm start
#   - Puerto: 3001 (configurable en .env)
# ============================================================================

$API_KEY = "TU_API_KEY_AQUI"
$BASE_URL = "http://localhost:3001"
$MCP_ENDPOINT = "$BASE_URL/mcp"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MCP Drive - Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# Test 1: Health Check (sin autenticación)
# ============================================================================
Write-Host "[Test 1] Health Check" -ForegroundColor Yellow
Write-Host "GET $BASE_URL/health`n" -ForegroundColor Gray

try {
    $response = curl -s "$BASE_URL/health" | ConvertFrom-Json
    Write-Host "✅ Status: " -NoNewline -ForegroundColor Green
    Write-Host $response.status
    Write-Host "   Timestamp: $($response.timestamp)`n"
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ============================================================================
# Test 2: Server Info (sin autenticación)
# ============================================================================
Write-Host "[Test 2] Server Info" -ForegroundColor Yellow
Write-Host "GET $BASE_URL/info`n" -ForegroundColor Gray

try {
    $response = curl -s "$BASE_URL/info" | ConvertFrom-Json
    Write-Host "✅ Name: " -NoNewline -ForegroundColor Green
    Write-Host $response.name
    Write-Host "   Version: $($response.version)"
    Write-Host "   Transport: $($response.transport)"
    Write-Host "   Drives Configured: $($response.drivesConfigured)"
    Write-Host "   Authenticated: $($response.authenticated)`n"
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ============================================================================
# Test 3: Initialize MCP Connection
# ============================================================================
Write-Host "[Test 3] Initialize MCP Connection" -ForegroundColor Yellow
Write-Host "POST $MCP_ENDPOINT (initialize)`n" -ForegroundColor Gray

$initBody = @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{
            roots = @{
                listChanged = $false
            }
        }
        clientInfo = @{
            name = "curl-test-client"
            version = "1.0.0"
        }
    }
    id = 1
} | ConvertTo-Json -Depth 10

try {
    $response = curl -s -X POST "$MCP_ENDPOINT" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json, text/event-stream" `
        -H "Authorization: Bearer $API_KEY" `
        -d $initBody | ConvertFrom-Json
    
    Write-Host "✅ Protocol Version: " -NoNewline -ForegroundColor Green
    Write-Host $response.result.protocolVersion
    Write-Host "   Server Name: $($response.result.serverInfo.name)"
    Write-Host "   Server Version: $($response.result.serverInfo.version)`n"
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ============================================================================
# Test 4: List Available Tools
# ============================================================================
Write-Host "[Test 4] List Available Tools" -ForegroundColor Yellow
Write-Host "POST $MCP_ENDPOINT (tools/list)`n" -ForegroundColor Gray

$listToolsBody = @{
    jsonrpc = "2.0"
    method = "tools/list"
    params = @{}
    id = 2
} | ConvertTo-Json

try {
    $response = curl -s -X POST "$MCP_ENDPOINT" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json, text/event-stream" `
        -H "Authorization: Bearer $API_KEY" `
        -d $listToolsBody | ConvertFrom-Json
    
    Write-Host "✅ Available Tools: $($response.result.tools.Count)`n" -ForegroundColor Green
    
    foreach ($tool in $response.result.tools) {
        Write-Host "   📦 $($tool.name)" -ForegroundColor Cyan
        Write-Host "      Description: $($tool.description)"
    }
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ============================================================================
# Test 5: Call Tool - list_drives
# ============================================================================
Write-Host "[Test 5] Call Tool: list_drives" -ForegroundColor Yellow
Write-Host "POST $MCP_ENDPOINT (tools/call)`n" -ForegroundColor Gray

$listDrivesBody = @{
    jsonrpc = "2.0"
    method = "tools/call"
    params = @{
        name = "list_drives"
        arguments = @{}
    }
    id = 3
} | ConvertTo-Json -Depth 10

try {
    $response = curl -s -X POST "$MCP_ENDPOINT" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json, text/event-stream" `
        -H "Authorization: Bearer $API_KEY" `
        -d $listDrivesBody | ConvertFrom-Json
    
    if ($response.result) {
        Write-Host "✅ Drives configured:`n" -ForegroundColor Green
        Write-Host $response.result.content[0].text
    } else {
        Write-Host "⚠️  No drives configured or error occurred" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 10)
    }
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ============================================================================
# Test 6: Call Tool - list_files (listar archivos de root)
# ============================================================================
Write-Host "[Test 6] Call Tool: list_files (root folder)" -ForegroundColor Yellow
Write-Host "POST $MCP_ENDPOINT (tools/call)`n" -ForegroundColor Gray

$listFilesBody = @{
    jsonrpc = "2.0"
    method = "tools/call"
    params = @{
        name = "list_files"
        arguments = @{
            driveId = "comnet-manuales"
            folderId = "root"
            maxResults = 10
        }
    }
    id = 4
} | ConvertTo-Json -Depth 10

try {
    $response = curl -s -X POST "$MCP_ENDPOINT" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json, text/event-stream" `
        -H "Authorization: Bearer $API_KEY" `
        -d $listFilesBody | ConvertFrom-Json
    
    if ($response.result) {
        Write-Host "✅ Files in root folder:`n" -ForegroundColor Green
        Write-Host $response.result.content[0].text
    } elseif ($response.error) {
        Write-Host "⚠️  Error occurred:" -ForegroundColor Yellow
        Write-Host "   Message: $($response.error.message)"
    }
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

# ============================================================================
# Test 7: Invalid Authentication
# ============================================================================
Write-Host "[Test 7] Test Invalid Authentication" -ForegroundColor Yellow
Write-Host "POST $MCP_ENDPOINT (invalid API key)`n" -ForegroundColor Gray

$invalidAuthBody = @{
    jsonrpc = "2.0"
    method = "tools/list"
    params = @{}
    id = 5
} | ConvertTo-Json

try {
    $response = curl -s -X POST "$MCP_ENDPOINT" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json, text/event-stream" `
        -H "Authorization: Bearer invalid-api-key-123" `
        -d $invalidAuthBody | ConvertFrom-Json
    
    if ($response.error) {
        Write-Host "✅ Authentication properly rejected:" -ForegroundColor Green
        Write-Host "   Error Code: $($response.error.code)"
        Write-Host "   Error Message: $($response.error.message)`n"
    } else {
        Write-Host "⚠️  Authentication should have failed but didn't`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests completados" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Revisa los logs del servidor en la otra terminal"
Write-Host "   - Ajusta el `$API_KEY si cambió en .env"
Write-Host "   - Modifica Test 6 con un driveId válido de tu configuración`n"
