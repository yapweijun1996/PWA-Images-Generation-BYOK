$ErrorActionPreference = 'Stop'
$shell = New-Object -ComObject WScript.Shell
$folders = @([Environment]::GetFolderPath('DesktopDirectory'), [Environment]::GetFolderPath('Programs'))
foreach ($link in Get-ChildItem $folders -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue) {
  if ($link.BaseName -notlike '*Images Studio*') { continue }
  $shortcut = $shell.CreateShortcut($link.FullName)
  if ($shortcut.Arguments -match '--app-id=([a-p]{32})') {
    [PSCustomObject]@{ name = $link.BaseName; appId = $Matches[1]; target = [IO.Path]::GetFileName($shortcut.TargetPath) } | ConvertTo-Json -Compress
    return
  }
}
