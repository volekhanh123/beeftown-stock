On Error Resume Next 

allDIR=Property("CustomActionData")

s=split(allDIR,"|") 

fromDIR=s(0)+s(2)
toDIR=s(1)+s(2)

Set fso = CreateObject("Scripting.FileSystemObject")

if(fso.FolderExists(fromDIR)) Then

fso.CopyFolder ""+fromDIR+"",""+s(1)+"", true

Set lso = CreateObject("WScript.Shell")

if(fso.FileExists("C:\WINDOWS\explorer.exe")) Then
lso.RUN "C:\WINDOWS\explorer.exe "+""+toDIR+""
end if

Desktop = lso.SpecialFolders("Desktop")
Set lnk = lso.CreateShortcut(""& Desktop & "\" & s(3) & " " & s(2) & ".lnk" &"")
lnk.TargetPath = toDIR
lnk.Description = s(2)
lnk.WorkingDirectory = s(1)
lnk.Save

end if

Set fso = Nothing
Set lso = Nothing
