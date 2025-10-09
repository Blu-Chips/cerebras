# Check backend directory structure
$backendPath = "C:\Users\JAMES\cerebras-1\CerebrasApp\backend"
$utilsPath = "$backendPath\utils"

Write-Host "🔍 Checking backend structure..." -ForegroundColor Cyan

# 1. Verify utils directory exists
if (-not (Test-Path $utilsPath)) {
    Write-Host "❌ Missing utils directory: $utilsPath" -ForegroundColor Red
    Write-Host "Create it with: mkdir utils" -ForegroundColor Yellow
    exit 1
}

# 2. Check for required files
$requiredFiles = @(
    "$utilsPath\parsePdf.js",
    "$utilsPath\parseCsv.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "   - $_" }
    Write-Host "`nCreate them with:" -ForegroundColor Yellow
    Write-Host "   cd $backendPath" -ForegroundColor Green
    Write-Host "   mkdir utils" -ForegroundColor Green
    Write-Host "   # Then create parsePdf.js and parseCsv.js with correct content" -ForegroundColor Green
    exit 1
}

# 3. Verify server.js content
$serverContent = Get-Content "$backendPath\server.js" -Raw
if (-not $serverContent.Contains("parseCsv(buffer)")) {
    Write-Host "⚠️ server.js doesn't contain CSV parsing logic" -ForegroundColor Yellow
    Write-Host "The file might be outdated or modified incorrectly" -ForegroundColor Yellow
    exit 1
}

# 4. Check if server is running
$portCheck = netstat -ano | findstr ":5000"
if (-not $portCheck) {
    Write-Host "⚠️ Server not running on port 5000" -ForegroundColor Yellow
    Write-Host "Start it with: cd $backendPath && node server.js" -ForegroundColor Green
} else {
    Write-Host "✅ Server appears to be running on port 5000" -ForegroundColor Green
}

# 5. Final recommendation
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. If files are missing, create them with correct content"
Write-Host "2. Restart server: cd $backendPath && node server.js"
Write-Host "3. Test again: curl.exe -F `"statement=@test.csv;type=text/csv`" http://localhost:5000/api/analyze"