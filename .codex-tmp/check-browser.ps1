param([int]$Width=390,[int]$Height=844,[string]$Name='mobile')
$ErrorActionPreference='Stop'
$chrome='C:/Program Files/Google/Chrome/Application/chrome.exe'
$p=Start-Process $chrome -ArgumentList '--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9227','--user-data-dir=S:/portfolio/.codex-tmp/chrome-cdp','--allow-file-access-from-files','about:blank' -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2
$targets=Invoke-RestMethod http://localhost:9227/json/list; $target=$targets | Where-Object type -eq 'page' | Select-Object -First 1
$ws=[System.Net.WebSockets.ClientWebSocket]::new()
$ws.ConnectAsync([Uri]$target.webSocketDebuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$script:seq=0
function Call-CDP($method,$params=@{}) {
 $script:seq++;$id=$script:seq
 $json=@{id=$id;method=$method;params=$params}|ConvertTo-Json -Depth 20 -Compress
 $bytes=[Text.Encoding]::UTF8.GetBytes($json)
 $ws.SendAsync([ArraySegment[byte]]::new($bytes),[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
 do {
  $buffer=New-Object byte[] 65536;$ms=[IO.MemoryStream]::new()
  do {$r=$ws.ReceiveAsync([ArraySegment[byte]]::new($buffer),[Threading.CancellationToken]::None).GetAwaiter().GetResult();$ms.Write($buffer,0,$r.Count)} while (!$r.EndOfMessage)
  $obj=[Text.Encoding]::UTF8.GetString($ms.ToArray())|ConvertFrom-Json
 } while ($obj.id -ne $id)
 if($obj.error){throw ($obj.error|ConvertTo-Json)}
 return $obj.result
}
Call-CDP 'Emulation.setDeviceMetricsOverride' @{width=$Width;height=$Height;deviceScaleFactor=1;mobile=($Width -lt 600)} | Out-Null
Call-CDP 'Page.navigate' @{url='file:///S:/portfolio/.codex-tmp/qa.html'} | Out-Null
Start-Sleep -Seconds 2
$r=Call-CDP 'Runtime.evaluate' @{expression="JSON.stringify({qa:document.querySelector('#qa-result')?.textContent,images:document.querySelectorAll('main img').length,broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.hasAttribute('src')).map(i=>i.src)})";returnByValue=$true}
$r.result.value
Call-CDP 'Page.navigate' @{url='file:///S:/portfolio/index.html'} | Out-Null
Start-Sleep -Seconds 1
$shot=Call-CDP 'Page.captureScreenshot' @{format='png'}
[IO.File]::WriteAllBytes("S:/portfolio/.codex-tmp/$Name.png",[Convert]::FromBase64String($shot.data))
Call-CDP 'Runtime.evaluate' @{expression="document.querySelector('#work').scrollIntoView()"} | Out-Null
Start-Sleep -Seconds 1
$shot=Call-CDP 'Page.captureScreenshot' @{format='png'}
[IO.File]::WriteAllBytes("S:/portfolio/.codex-tmp/$Name-work.png",[Convert]::FromBase64String($shot.data))
Call-CDP 'Runtime.evaluate' @{expression="document.querySelector('#contact').scrollIntoView()"} | Out-Null
Start-Sleep -Seconds 1
$shot=Call-CDP 'Page.captureScreenshot' @{format='png'}
[IO.File]::WriteAllBytes("S:/portfolio/.codex-tmp/$Name-contact.png",[Convert]::FromBase64String($shot.data))
Call-CDP 'Browser.close' | Out-Null


