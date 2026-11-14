' ============================================================
'  NEX-SCOPE - INICIO SILENCIOSO (doble clic, cero ventanas)
'  - Si las dependencias existen: lanza el servidor OCULTO
'    y abre el navegador en cuanto responda (sin terminal).
'  - Si es la primera vez: abre el instalador visible una sola vez.
' ============================================================
Option Explicit
Dim fso, sh, carpeta, raiz, nodeModules, nextBin

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

' Determinar si estamos en raiz o en launchers\
If fso.FileExists(WScript.ScriptFullName) Then
    Dim scriptDir
    scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
    If LCase(fso.GetFileName(scriptDir)) = "launchers" Then
        raiz = fso.GetParentFolderName(scriptDir)
    Else
        raiz = scriptDir
    End If
End If

carpeta = raiz
sh.CurrentDirectory = carpeta

nodeModules = carpeta & "\node_modules"
nextBin = nodeModules & "\next\dist\bin\next"

If fso.FolderExists(nodeModules) And fso.FileExists(nextBin) Then
    ' Dependencias listas: lanzar silenciosamente en ventana oculta (0)
    sh.Run "cmd /c """ & carpeta & "\launchers\run_hidden.bat""", 0, False
Else
    ' Primera vez o faltan modulos: abrir asistente visible (1)
    sh.Run "cmd /c """ & carpeta & "\launchers\start.bat""", 1, False
End If
