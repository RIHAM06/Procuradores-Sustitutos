$port = 8085
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Error iniciando el puerto $port : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Servidor Privado: Procuradores Sustitutos España" -ForegroundColor Yellow
Write-Host "  URL: http://localhost:$port/" -ForegroundColor Green
Write-Host "  Estado: Activo y escuchando conexiones" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

while ($listener.IsListening) {
    $context = $null
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $rawPath = $req.Url.LocalPath
        if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "/") {
            $rawPath = "/index.html"
        }

        $decodedPath = [System.Uri]::UnescapeDataString($rawPath)
        $safePath = $decodedPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::Combine($root, $safePath)

        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $fullBase = [System.IO.Path]::GetFullPath($root)
        if (-not $fullPath.StartsWith($fullBase, [System.StringComparison]::OrdinalIgnoreCase)) {
            $res.StatusCode = 403
            $msg = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $res.ContentLength64 = $msg.Length
            $res.OutputStream.Write($msg, 0, $msg.Length)
        } elseif ([System.IO.File]::Exists($fullPath)) {
            $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".mjs"  { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".sql"  { "text/plain; charset=utf-8" }
                ".md"   { "text/markdown; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                Default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $res.ContentType = $contentType
            $res.ContentLength64 = $bytes.Length
            $res.AddHeader("Access-Control-Allow-Origin", "*")
            $res.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.ContentLength64 = $msg.Length
            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($msg, 0, $msg.Length)
            }
        }
    } catch {
        # Log minimal error if necessary
    } finally {
        if ($context -ne $null -and $context.Response -ne $null) {
            try {
                $context.Response.OutputStream.Flush()
            } catch {}
            try {
                $context.Response.Close()
            } catch {}
        }
    }
}
