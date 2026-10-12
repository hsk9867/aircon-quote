# FTP 비밀번호를 창에서 입력받아 deploy\cafe24.local.ps1 에 저장합니다 (비밀번호가 화면이나 채팅에 남지 않음).
# 실행: powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File deploy\set-ftp-password.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$local = Join-Path $PSScriptRoot 'cafe24.local.ps1'
$user = 'hsk9867'; $ftpHost = '183.110.224.226'; $dir = 'www'; $adminPass = ''
if (Test-Path $local) {
  $t = Get-Content $local -Raw
  if ($t -match "CAFE24_FTP_USER\s*=\s*'([^']*)'") { $user = $Matches[1] }
  if ($t -match "CAFE24_FTP_HOST\s*=\s*'([^']*)'") { $ftpHost = $Matches[1] }
  if ($t -match "CAFE24_REMOTE_DIR\s*=\s*'([^']*)'") { $dir = $Matches[1] }
  if ($t -match "^\s*\`$env:CAFE24_ADMIN_PASS\s*=\s*'([^']*)'" ) { $adminPass = $Matches[1] }
}

$form = New-Object Windows.Forms.Form
$form.Text = '속시원 · 카페24 FTP 비밀번호 저장'
$form.Size = New-Object Drawing.Size(460, 300)
$form.StartPosition = 'CenterScreen'; $form.TopMost = $true; $form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false
$font = New-Object Drawing.Font('Malgun Gothic', 10)
$form.Font = $font

$lbl = New-Object Windows.Forms.Label; $lbl.Text = "FTP 아이디: $user`n서버: $ftpHost`n`n호스팅 신청 때 정한 FTP/SSH/DB 비밀번호를 입력하세요."; $lbl.Location = New-Object Drawing.Point(16, 14); $lbl.Size = New-Object Drawing.Size(420, 80)
$pw = New-Object Windows.Forms.TextBox; $pw.UseSystemPasswordChar = $true; $pw.Location = New-Object Drawing.Point(16, 100); $pw.Size = New-Object Drawing.Size(420, 28)
$lbl2 = New-Object Windows.Forms.Label; $lbl2.Text = '한 번 더 입력'; $lbl2.Location = New-Object Drawing.Point(16, 136); $lbl2.Size = New-Object Drawing.Size(420, 22)
$pw2 = New-Object Windows.Forms.TextBox; $pw2.UseSystemPasswordChar = $true; $pw2.Location = New-Object Drawing.Point(16, 160); $pw2.Size = New-Object Drawing.Size(420, 28)
$show = New-Object Windows.Forms.CheckBox; $show.Text = '입력한 글자 보기'; $show.Location = New-Object Drawing.Point(16, 196); $show.Size = New-Object Drawing.Size(200, 24)
$show.Add_CheckedChanged({ $pw.UseSystemPasswordChar = -not $show.Checked; $pw2.UseSystemPasswordChar = -not $show.Checked })
$ok = New-Object Windows.Forms.Button; $ok.Text = '저장'; $ok.Location = New-Object Drawing.Point(256, 222); $ok.Size = New-Object Drawing.Size(86, 32)
$cancel = New-Object Windows.Forms.Button; $cancel.Text = '취소'; $cancel.Location = New-Object Drawing.Point(350, 222); $cancel.Size = New-Object Drawing.Size(86, 32); $cancel.DialogResult = 'Cancel'
$ok.Add_Click({
  if ($pw.Text.Length -lt 4) { [Windows.Forms.MessageBox]::Show('비밀번호를 입력하세요.', '확인') | Out-Null; return }
  if ($pw.Text -ne $pw2.Text) { [Windows.Forms.MessageBox]::Show('두 입력이 다릅니다.', '확인') | Out-Null; return }
  $form.DialogResult = 'OK'; $form.Close()
})
$form.Controls.AddRange(@($lbl, $pw, $lbl2, $pw2, $show, $ok, $cancel)); $form.AcceptButton = $ok; $form.CancelButton = $cancel
$form.Add_Shown({ $pw.Focus() })

if ($form.ShowDialog() -ne 'OK') { exit 1 }
$esc = $pw.Text.Replace("'", "''")
$adminLine = if ($adminPass) { "`$env:CAFE24_ADMIN_PASS = '$($adminPass.Replace("'", "''"))'" } else { "# `$env:CAFE24_ADMIN_PASS = '관리자비밀번호8자이상'    # 적으면 배포 때 관리자 비밀번호도 함께 설정. 비우면 admin.html 첫 접속 때 설정" }
$content = @"
# 카페24 FTP 접속 정보. 이 파일은 .gitignore 에 있어 GitHub에 올라가지 않습니다.
`$env:CAFE24_FTP_USER = '$user'
`$env:CAFE24_FTP_PASS = '$esc'
`$env:CAFE24_FTP_HOST = '$ftpHost'            # 서버 IP (나의서비스관리 > 서버아이피). 도메인 DNS가 퍼지면 'soksiwon-air.com' 으로 바꿔도 됨
`$env:CAFE24_REMOTE_DIR = '$dir'
$adminLine
"@
[IO.File]::WriteAllText($local, $content, (New-Object Text.UTF8Encoding $true))
[Windows.Forms.MessageBox]::Show("저장했습니다.`n$local`n`n이제 Claude 창에서 '저장했어'라고 알려 주세요.", '속시원') | Out-Null
