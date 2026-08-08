$body = @'
{"class_code":"LTZ2024","teacher_name":"测试老师"}
'@
for ($i=1; $i -le 6; $i++) {
  $login = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/session/teacher/enter" -Method Post -ContentType "application/json" -Body $body -UseBasicParsing
  $inst = $login.Headers["X-Eas-Instance"]
  Write-Output "LOGIN$i INSTANCE=$inst"
  Start-Sleep -Milliseconds 200
}