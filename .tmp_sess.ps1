$body = @'
{"class_code":"LTZ2024","teacher_name":"测试老师"}
'@
# Login 1
$r1 = Invoke-RestMethod -Uri "https://little0hope-xiaoxin.ms.show/api/session/teacher/enter" -Method Post -ContentType "application/json" -Body $body
$t1 = $r1.session_token
Write-Output "T1=$t1"
# Login 2 (different name)
$body2 = @'
{"class_code":"LTZ2024","teacher_name":"王老师"}
'@
$r2 = Invoke-RestMethod -Uri "https://little0hope-xiaoxin.ms.show/api/session/teacher/enter" -Method Post -ContentType "application/json" -Body $body2
$t2 = $r2.session_token
Write-Output "T2=$t2"
# Try T1 immediately
try { $x = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024/academic" -Headers @{Authorization="Bearer $t1"} -UseBasicParsing; Write-Output "T1 now: $($x.StatusCode)" } catch { Write-Output "T1 now: $($_.Exception.Response.StatusCode.value__)" }
# Try T2 immediately
try { $x = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024/academic" -Headers @{Authorization="Bearer $t2"} -UseBasicParsing; Write-Output "T2 now: $($x.StatusCode)" } catch { Write-Output "T2 now: $($_.Exception.Response.StatusCode.value__)" }
# Wait then try T1 again
Start-Sleep -Seconds 5
try { $x = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024/academic" -Headers @{Authorization="Bearer $t1"} -UseBasicParsing; Write-Output "T1 after5s: $($x.StatusCode)" } catch { $b=$_.Exception.Response.GetResponseStream(); Write-Output "T1 after5s: $($_.Exception.Response.StatusCode.value__)" }
Start-Sleep -Seconds 5
try { $x = Invoke-WebRequest -Uri "https://little0hope-xiaoxin.ms.show/api/classes/LTZ2024/academic" -Headers @{Authorization="Bearer $t2"} -UseBasicParsing; Write-Output "T2 after10s: $($x.StatusCode)" } catch { Write-Output "T2 after10s: $($_.Exception.Response.StatusCode.value__)" }