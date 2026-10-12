# 이 파일을 복사해 같은 폴더에 cafe24.local.ps1 로 저장하고 값을 채우세요.
# cafe24.local.ps1 은 .gitignore 에 들어 있어 GitHub에 올라가지 않습니다.
$env:CAFE24_FTP_USER = '카페24호스팅아이디'      # 예: sokshiwon
$env:CAFE24_FTP_PASS = 'FTP비밀번호'              # 나의서비스관리 > 호스팅 관리 > FTP 비밀번호
# $env:CAFE24_FTP_HOST = '183.110.224.226'   # 서버 IP 또는 연결한 도메인. 나의서비스관리 > 서버아이피
# $env:CAFE24_REMOTE_DIR = 'www'                   # 카페24 웹 문서 폴더. 기본 www
# $env:CAFE24_ADMIN_PASS = '관리자비밀번호8자이상'  # 적으면 배포 때 admin/auth.php 를 만들어 올립니다. 비워 두면 admin.html 첫 접속 때 설정
