# 속시원 사이트를 카페24 웹호스팅(FTP)에 올리는 스크립트
# 사용법: 프로젝트 폴더에서  powershell -ExecutionPolicy Bypass -File deploy\cafe24.ps1
# 접속 정보는 deploy\cafe24.local.ps1 (git에 올라가지 않음) 에 적습니다. 예시는 cafe24.local.example.ps1 참고.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$local = Join-Path $PSScriptRoot 'cafe24.local.ps1'
if (Test-Path $local) { . $local }

$user = $env:CAFE24_FTP_USER
$pass = $env:CAFE24_FTP_PASS
$ftpHost = $env:CAFE24_FTP_HOST
if (-not $ftpHost -and $user) { $ftpHost = "$user.cafe24.com" }
$remoteDir = if ($env:CAFE24_REMOTE_DIR) { $env:CAFE24_REMOTE_DIR } else { 'www' }

if (-not $user -or -not $pass) {
  Write-Host "접속 정보가 없습니다. deploy\cafe24.local.example.ps1 을 복사해 deploy\cafe24.local.ps1 을 만들고 FTP 아이디/비밀번호를 적어 주세요." -ForegroundColor Yellow
  exit 1
}

$curl = Join-Path $env:SystemRoot 'System32\curl.exe'
if (-not (Test-Path $curl)) { $curl = 'curl.exe' }

# 비밀번호가 명령줄에 남지 않도록 임시 netrc 파일을 씁니다.
$netrc = New-TemporaryFile
"machine $ftpHost login $user password $pass" | Set-Content -Path $netrc.FullName -Encoding ascii

$files = @(Get-ChildItem -Path $root -Filter *.html -File | ForEach-Object { $_.Name })
$files += Get-ChildItem -Path (Join-Path $root 'css'), (Join-Path $root 'js') -File | ForEach-Object {
  $_.FullName.Substring($root.Length + 1).Replace('\', '/')
}

Write-Host "카페24 업로드: ftp://$ftpHost/$remoteDir  ($($files.Count)개 파일)"
$fail = 0
try {
  foreach ($f in $files) {
    $localPath = Join-Path $root $f
    $url = "ftp://$ftpHost/$remoteDir/$f"
    & $curl --silent --show-error --netrc-file $netrc.FullName --ftp-create-dirs --connect-timeout 20 -T $localPath $url
    if ($LASTEXITCODE -ne 0) { Write-Host "  실패  $f" -ForegroundColor Red; $fail++ } else { Write-Host "  올림  $f" }
  }
} finally {
  Remove-Item $netrc.FullName -Force -ErrorAction SilentlyContinue
}

if ($fail -gt 0) { Write-Host "$fail개 파일이 올라가지 않았습니다. FTP 아이디/비밀번호와 카페24 '나의서비스관리 > FTP 접속 설정'을 확인해 주세요." -ForegroundColor Red; exit 1 }
Write-Host "완료. 브라우저에서 http://$ftpHost 또는 연결한 도메인으로 확인하세요." -ForegroundColor Green
