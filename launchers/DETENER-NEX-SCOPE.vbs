' ============================================================
'  NEX-SCOPE - DETENER SERVIDOR (doble clic, sin terminal)
'  Mata los procesos node escuchando en el puerto 3000
'  y confirma con un mensaje emergente.
' ============================================================
Option Explicit
Dim sh, ps
Set sh = CreateObject("WScript.Shell")

ps = "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | " & _
     "ForEach-Object { $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; " & _
     "if ($p -and $p.ProcessName -match 'node') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }"

sh.Run "powershell -NoProfile -WindowStyle Hidden -Command """ & ps & """", 0, True
MsgBox "Servidor NEX-SCOPE detenido con éxito." & vbCrLf & "(Puerto 3000 liberado)", 64, "NEX-SCOPE"
