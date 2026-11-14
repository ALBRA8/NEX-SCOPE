' ============================================================
'  NEX-SCOPE - INICIO SILENCIOSO (doble clic, cero ventanas)
'  - Si las dependencias existen: lanza el servidor OCULTO
'    y abre el navegador en cuanto responda (sin terminal).
'  - Si es la primera vez: abre el instalador visible una sola vez.
' ============================================================
Option Explicit
Dim fso, sh, carpeta, py, nodeModules

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

Dim raiz
raiz = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
carpeta = raiz
sh.CurrentDirectory = carpeta

nodeModules = carpeta & "\node_modules"

' Verificamos si hay Python en el sistema o en el venv del ecosistema
Dim pyCandidates(3)
pyCandidates(0) = "python.exe"
pyCandidates(1) = "D:\PROYECTOS\YOUTUBE AUTOMATION\.venv\Scripts\python.exe"
pyCandidates(2) = "D:\PROYECTOS\YOUTUBE AUTOMATION\backend\.venv\Scripts\python.exe"
pyCandidates(3) = "C:\Users\Johan\AppData\Local\Programs\Python\Python311\python.exe"

Dim foundPy, i
foundPy = ""
For i = 0 To UBound(pyCandidates)
    If InStr(pyCandidates(i), "\") > 0 Then
        If fso.FileExists(pyCandidates(i)) Then
            foundPy = pyCandidates(i)
            Exit For
        End If
    Else
        ' Si es comando simple en PATH
        foundPy = pyCandidates(i)
        Exit For
    End If
Next

If fso.FolderExists(nodeModules) And foundPy <> "" Then
    ' Ruta silenciosa: ventana oculta (0), sin esperar (False)
    sh.Run """" & foundPy & """ """ & carpeta & "\launchers\lanzador_nexscope.py""", 0, False
Else
    ' Primera vez o faltan módulos: asistente visible
    sh.Run "cmd /c """ & carpeta & "\launchers\start.bat""", 1, False
End If
