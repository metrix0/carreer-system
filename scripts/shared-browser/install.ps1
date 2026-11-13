$ErrorActionPreference = 'Stop'
$destination = Join-Path $env:USERPROFILE 'AI-Apps\CareerRadar\SharedBrowser'
New-Item -ItemType Directory -Force $destination | Out-Null
$source = Join-Path $PSScriptRoot 'SharedBrowser.cs'
$targetSource = Join-Path $destination 'SharedBrowser.cs'
if ($source -ne $targetSource) { Copy-Item $source $targetSource -Force }
$executable = Join-Path $destination 'CareerBrowser.exe'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $compiler /nologo /target:winexe /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll "/out:$executable" $targetSource
if ($LASTEXITCODE -ne 0) { throw 'Launcher compilation failed.' }
$key = 'HKCU:\Software\Classes\career-browser'
New-Item -Path $key -Force | Out-Null
Set-Item -Path $key -Value 'URL:Career Radar shared browser'
New-ItemProperty -Path $key -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
New-Item -Path "$key\shell\open\command" -Force | Out-Null
Set-Item -Path "$key\shell\open\command" -Value ('"' + $executable + '" "%1"')
Write-Output 'Career Radar shared browser launcher installed.'
