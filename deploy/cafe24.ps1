# 속시원 사이트를 카페24 웹호스팅(FTP)에 올리는 스크립트
# 사용법: 프로젝트 폴더에서  powershell -ExecutionPolicy Bypass -File deploy\cafe24.ps1
#   -IncludeConfig : 로컬 data\config.js 를 서버에 덮어씁니다 (관리자 페이지 "config.js 내려받기"로 받은 파일을 반영할 때)
#   -ResetAdminPassword : cafe24.local.ps1 의 CAFE24_ADMIN_PASS 로 관리자 비밀번호를 다시 씁니다
# 접속 정보는 deploy\cafe24.local.ps1 (git에 올라가지 않음) 에 적습니다. 예시는 cafe24.local.example.ps1 참고.
param([switch]$IncludeConfig, [switch]$ResetAdminPassword)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$local = Join-Path $PSScriptRoot 'cafe24.local.ps1'
if (Test-Path $local) { . $local }

$user = $env:CAFE24_FTP_USER
$pass = $env:CAFE24_FTP_PASS
$ftpHost = $env:CAFE24_FTP_HOST
if (-not $ftpHost -and $user) { $ftpHost = "$user.cafe24.com" }
$remoteDir = if ($null -ne $env:CAFE24_REMOTE_DIR) { $env:CAFE24_REMOTE_DIR.Trim('/') } else { '' }  # 뉴아우토반호스팅은 FTP 최상위가 웹 루트. 구형 상품(www 폴더)은 'www'
$adminPass = $env:CAFE24_ADMIN_PASS

if (-not $user -or -not $pass) {
  Write-Host "접속 정보가 없습니다. deploy\cafe24.local.example.ps1 을 복사해 deploy\cafe24.local.ps1 을 만들고 FTP 아이디/비밀번호를 적어 주세요." -ForegroundColor Yellow
  exit 1
}

$curl = Join-Path $env:SystemRoot 'System32\curl.exe'
if (-not (Test-Path $curl)) { $curl = 'curl.exe' }

# 비밀번호가 명령줄에 남지 않도록 임시 netrc 파일을 씁니다.
$netrc = New-TemporaryFile
"machine $ftpHost login $user password $pass" | Set-Content -Path $netrc.FullName -Encoding ascii
$base = if ($remoteDir) { "ftp://$ftpHost/$remoteDir" } else { "ftp://$ftpHost" }

function Remote-Exists($rel) {
  & $curl --silent --netrc-file $netrc.FullName --connect-timeout 20 --head "$base/$rel" *> $null
  return ($LASTEXITCODE -eq 0)
}
function Upload($localPath, $rel) {
  & $curl --silent --show-error --netrc-file $netrc.FullName --ftp-create-dirs --connect-timeout 20 -T $localPath "$base/$rel"
  if ($LASTEXITCODE -ne 0) { Write-Host "  실패  $rel" -ForegroundColor Red; return $false }
  Write-Host "  올림  $rel"; return $true
}

# 올릴 파일: 페이지, css, js, 이미지, 관리자 API. data\config.js 는 서버에 없을 때만 (관리자 페이지에서 저장한 설정을 지우지 않기 위해)
$files = @(Get-ChildItem -Path $root -Filter *.html -File | ForEach-Object { $_.Name })
$files += Get-ChildItem -Path (Join-Path $root 'css'), (Join-Path $root 'js') -File | ForEach-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') }
$files += Get-ChildItem -Path (Join-Path $root 'img') -File -Recurse | Where-Object { $_.Extension -ne '.txt' } | ForEach-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') }  # img 하위 폴더(products 등)까지
$files += 'admin/api.php', 'admin/.htaccess', 'admin/store/.htaccess'

Write-Host "카페24 업로드: $base  ($($files.Count)개 파일)"
$fail = 0
try {
  foreach ($f in $files) { if (-not (Upload (Join-Path $root $f) $f)) { $fail++ } }

  foreach ($cfg in 'data/config.js', 'data/config.json') {
    if ($IncludeConfig -or -not (Remote-Exists $cfg)) { if (-not (Upload (Join-Path $root $cfg) $cfg)) { $fail++ } }
    else { Write-Host "  유지  $cfg (서버에 저장된 설정 유지. 덮어쓰려면 -IncludeConfig)" }
  }

  if ($adminPass) {
    if ($ResetAdminPassword -or -not (Remote-Exists 'admin/auth.php')) {
      if ($adminPass.Length -lt 8) { throw "CAFE24_ADMIN_PASS 는 8자 이상이어야 합니다." }
      $salt = -join ((1..16) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
      $sha = [Security.Cryptography.SHA256]::Create()
      $hex = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($salt + $adminPass)))).Replace('-', '').ToLower()
      $authTmp = New-TemporaryFile
      "<?php`n// 속시원 관리자 비밀번호 해시 (배포 스크립트가 생성). 직접 수정하지 마세요.`nreturn ['sha256' => '$salt', 'hash' => '$hex'];`n" | Set-Content -Path $authTmp.FullName -Encoding utf8
      if (-not (Upload $authTmp.FullName 'admin/auth.php')) { $fail++ }
      Remove-Item $authTmp.FullName -Force -ErrorAction SilentlyContinue
    } else { Write-Host "  유지  admin/auth.php (관리자 비밀번호 유지. 바꾸려면 -ResetAdminPassword)" }
  } else {
    Write-Host "  안내  CAFE24_ADMIN_PASS 가 없어 관리자 비밀번호는 admin.html 첫 접속 때 설정합니다."
  }
} finally {
  Remove-Item $netrc.FullName -Force -ErrorAction SilentlyContinue
}

if ($fail -gt 0) { Write-Host "$fail개 파일이 올라가지 않았습니다. FTP 아이디/비밀번호와 카페24 '나의서비스관리 > FTP 접속 설정'을 확인해 주세요." -ForegroundColor Red; exit 1 }
Write-Host "완료. 사이트: http://$ftpHost (도메인 연결 후 soksiwon-air.com) · 관리자: /admin.html" -ForegroundColor Green
