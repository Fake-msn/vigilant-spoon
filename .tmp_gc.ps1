for ($i=1; $i -le 6; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024" -UseBasicParsing
    $inst = $r.Headers["X-Eas-Instance"]
    Write-Output "GET$i STATUS=$($r.StatusCode) INSTANCE=$inst LEN=$($r.Content.Length)"
  } catch {
    Write-Output "GET$i STATUS=$($_.Exception.Response.StatusCode.value__)"
  }
  Start-Sleep -Milliseconds 300
}