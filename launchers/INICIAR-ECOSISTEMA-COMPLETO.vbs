' ============================================================
'  ECOSISTEMA DUAL ALBRA - LANZADOR MAESTRO
'  1. Inicia silenciosamente YOUTUBE AUTOMATION (Fábrica de Video - Puerto 8000)
'  2. Inicia silenciosamente NEX-SCOPE (Radar & CAZADOR - Puerto 3000)
'  Ambos en segundo plano sin terminales invasivas.
' ============================================================
Option Explicit
Dim fso, sh
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

Dim dirYT, dirNS, vbsYT, vbsNS
dirYT = "D:\PROYECTOS\YOUTUBE AUTOMATION\launchers"
dirNS = "D:\PROYECTOS\AGENTES CON IA\NEX-SCOPE\launchers"

vbsYT = dirYT & "\INICIAR-ALBRA.vbs"
vbsNS = dirNS & "\INICIAR-NEX-SCOPE.vbs"

' 1. Lanzar YouTube Automation
If fso.FileExists(vbsYT) Then
    sh.Run "wscript.exe """ & vbsYT & """", 0, False
End If

' 2. Lanzar NEX-SCOPE
If fso.FileExists(vbsNS) Then
    sh.Run "wscript.exe """ & vbsNS & """", 0, False
End If
