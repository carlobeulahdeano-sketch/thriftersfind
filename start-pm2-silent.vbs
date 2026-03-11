' Silent launcher - starts PM2 thriftersfind at Windows login without a terminal window
Dim WshShell
Set WshShell = CreateObject("WScript.Shell")

' Resurrect previously saved PM2 process list (restores thriftersfind)
WshShell.Run "cmd /c pm2 resurrect", 0, True
