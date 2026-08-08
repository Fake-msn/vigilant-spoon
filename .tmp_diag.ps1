$body = @'
{"class_code":"LTZ2024","teacher_name":"测试老师"}
'@
$token = (Invoke-RestMethod -Uri "https://little0hope-xiaoxin.ms.show/api/session/teacher/enter" -Method Post -ContentType "application/json" -Body $body).session_token
Write-Output "TOKEN=$token"
for ($i=1; $i -le 5; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024/academic" -Headers @{Authorization="Bearer $token"} -UseBasicParsing
    Write-Output "TRY$i STATUS=$($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Output "TRY$i STATUS=$code"
  }
  Start-Sleep -Milliseconds 300
}