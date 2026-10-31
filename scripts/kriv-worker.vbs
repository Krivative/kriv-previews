' Unattended KRIV Lead Desk run (finding, checking, preparing; never approves, publishes or sends).
' Started by the Windows task "KRIV Lead Desk unattended run". Output goes to kriv-leads\unattended.log.
Set shell = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
root = fs.GetParentFolderName(fs.GetParentFolderName(WScript.ScriptFullName))
logFile = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\kriv-leads\unattended.log"
shell.CurrentDirectory = root
shell.Run "cmd /c """"C:\Program Files\nodejs\node.exe"" --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning lead-desk\worker.mjs >> """ & logFile & """ 2>&1""", 0, False
