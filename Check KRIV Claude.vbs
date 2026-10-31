Set shell = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
root = fs.GetParentFolderName(WScript.ScriptFullName)
MsgBox "This checks one fictional Claude draft using your subscription. It can take up to three minutes. It will not open your lead database or send email.", 64, "KRIV Claude check"
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & root & "\scripts\check-sales-claude.ps1""", 0, False
