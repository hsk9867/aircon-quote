<?php
/* 속시원 관리자 저장 API (카페24 웹호스팅 PHP 7.0 이상)
   - admin.html 이 호출합니다. 설정은 data/config.json 과 data/config.js 에 저장됩니다.
   - 비밀번호 해시는 admin/auth.php 에 저장됩니다. 파일이 없으면 관리자 페이지에서 처음 한 번 설정합니다.
   - 배포 스크립트가 CAFE24_ADMIN_PASS 로 auth.php 를 만들어 올릴 수도 있습니다 (sha256 방식). */
declare(strict_types=1);

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'secure' => $secure, 'samesite' => 'Lax']);
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $secure, true);
}
session_name('SSWADMIN');
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$root     = dirname(__DIR__);
$authFile = __DIR__ . '/auth.php';
$lockFile = __DIR__ . '/.lock.json';
$jsonFile = $root . '/data/config.json';
$jsFile   = $root . '/data/config.js';
$storeDir = __DIR__ . '/store';                 // 접수 저장소 (admin/store/.htaccess 로 외부 접근 차단)
$bookFile = $storeDir . '/bookings.json';       // 예약·렌탈 상담
$inqFile  = $storeDir . '/inquiries.json';      // 기업 전용 문의
$memFile  = $storeDir . '/members.json';        // 회원 (이름·연락처) + 발급 쿠폰

function readList(string $file): array {
    if (!is_file($file)) return [];
    $d = json_decode((string)@file_get_contents($file), true);
    return is_array($d) ? $d : [];
}
function writeList(string $file, array $list): bool {
    $json = json_encode(array_values($list), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json !== false && writeAtomic($file, $json . "\n");
}
/* 외부 접수: 같은 IP에서 1시간에 20건까지 */
function tooMany(array $list, string $ipHash): bool {
    $since = time() - 3600; $n = 0;
    foreach ($list as $r) { if (($r['ipHash'] ?? '') === $ipHash && strtotime($r['receivedAt'] ?? '1970-01-01') >= $since) $n++; }
    return $n >= 20;
}
function cleanStr($v, int $max = 300): string { return mb_substr(trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', (string)$v)), 0, $max); }

function out(array $a): void { echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $err, string $msg = ''): void { out(['ok' => false, 'error' => $err, 'message' => $msg]); }
function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 2 * 1024 * 1024) fail('too_large', '요청이 너무 큽니다.');
    $j = json_decode($raw, true);
    return is_array($j) ? $j : [];
}
function writeAtomic(string $path, string $content): bool {
    $dir = dirname($path);
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) return false;
    $tmp = $path . '.tmp' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $content, LOCK_EX) === false) return false;
    if (!@rename($tmp, $path)) { @unlink($tmp); return false; }
    return true;
}
function authData(string $file): ?array {
    if (!is_file($file)) return null;
    $d = include $file;
    return is_array($d) ? $d : null;
}
function verifyPw(array $auth, string $pw): bool {
    if (isset($auth['sha256'], $auth['hash'])) return hash_equals((string)$auth['hash'], hash('sha256', $auth['sha256'] . $pw));
    if (isset($auth['hash'])) return password_verify($pw, (string)$auth['hash']);
    return false;
}
function saveAuth(string $file, string $pw): bool {
    $hash = password_hash($pw, PASSWORD_DEFAULT);
    return writeAtomic($file, "<?php\n// 속시원 관리자 비밀번호 해시. 직접 수정하지 마세요. 잊었으면 이 파일을 지우고 관리자 페이지에서 다시 설정합니다.\nreturn ['hash' => " . var_export($hash, true) . "];\n");
}
function lockState(string $file): array {
    $d = is_file($file) ? json_decode((string)@file_get_contents($file), true) : null;
    return is_array($d) ? $d + ['fails' => 0, 'until' => 0] : ['fails' => 0, 'until' => 0];
}

/* ---------- 회원·쿠폰 ---------- */
function phoneKey(string $p): string { return preg_replace('/\D+/', '', $p); }
/* 쿠폰 설정은 관리자 > 기본 정보 > 회원 쿠폰 (data/config.json 의 site.coupon). 없으면 기본값 */
function couponCfg(string $jsonFile): array {
    $def = ['enabled' => true, 'type' => 'won', 'value' => 10000, 'label' => '회원 견적 쿠폰', 'validDays' => 30, 'minTotal' => 0];
    $cfg = is_file($jsonFile) ? json_decode((string)@file_get_contents($jsonFile), true) : null;
    $c = (is_array($cfg) && isset($cfg['site']['coupon']) && is_array($cfg['site']['coupon'])) ? $cfg['site']['coupon'] : [];
    $c = $c + $def;
    $c['type'] = ($c['type'] ?? '') === 'pct' ? 'pct' : 'won';
    $c['value'] = max(0, (float)$c['value']); $c['validDays'] = max(1, (int)$c['validDays']); $c['minTotal'] = max(0, (int)$c['minTotal']);
    $c['enabled'] = !empty($c['enabled']) && $c['value'] > 0; $c['label'] = cleanStr($c['label'], 60);
    return $c;
}
function memberByToken(array $list, string $token): ?int {
    if (strlen($token) < 16) return null;
    foreach ($list as $i => $m) { if (hash_equals((string)($m['token'] ?? ''), $token)) return $i; }
    return null;
}
function publicCoupon(array $c): array { unset($c['quote']); return $c; }
function publicMember(array $m): array {
    return ['id' => (string)($m['id'] ?? ''), 'name' => (string)($m['name'] ?? ''), 'phone' => (string)($m['phone'] ?? ''), 'joinedAt' => (string)($m['joinedAt'] ?? ''),
            'coupons' => array_values(array_map('publicCoupon', is_array($m['coupons'] ?? null) ? $m['coupons'] : []))];
}
function couponDiscount(array $c, array $total): array {
    $t0 = (float)($total[0] ?? 0); $t1 = (float)($total[1] ?? $t0); $v = (float)($c['value'] ?? 0);
    if (($c['type'] ?? 'won') === 'pct') return [round($t0 * $v / 100), round($t1 * $v / 100)];
    return [min($t0, $v), min($t1, $v)];
}
function ensureStore(string $storeDir): void {
    if (!is_dir($storeDir) && !@mkdir($storeDir, 0755, true)) fail('write', 'admin/store 폴더를 만들 수 없습니다.');
    if (!is_file($storeDir . '/.htaccess')) @file_put_contents($storeDir . '/.htaccess', "Require all denied\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
}

$action = isset($_GET['action']) ? (string)$_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'SSW')) fail('bad_request');
if ($method !== 'GET' && $method !== 'POST') fail('bad_request');

$hasPw  = is_file($authFile);
$logged = !empty($_SESSION['ssw_admin']);
$writable = (is_dir(dirname($jsFile)) ? is_writable(dirname($jsFile)) : is_writable($root)) && (!is_file($jsFile) || is_writable($jsFile)) && (!is_file($jsonFile) || is_writable($jsonFile));

switch ($action) {
    case 'status':
        out(['ok' => true, 'server' => true, 'hasPassword' => $hasPw, 'loggedIn' => $logged, 'hasConfig' => is_file($jsonFile), 'writable' => $writable, 'php' => PHP_VERSION]);

    case 'setup':
        if ($method !== 'POST') fail('bad_request');
        if ($hasPw) fail('already_set');
        $pw = (string)(body()['password'] ?? '');
        if (strlen($pw) < 8) fail('short', '8자 이상이어야 합니다.');
        if (!saveAuth($authFile, $pw)) fail('write', 'admin 폴더에 쓸 수 없습니다. FTP에서 admin 폴더 권한을 707로 바꿔 주세요.');
        session_regenerate_id(true); $_SESSION['ssw_admin'] = true;
        out(['ok' => true]);

    case 'login':
        if ($method !== 'POST') fail('bad_request');
        if (!$hasPw) fail('no_password');
        $lock = lockState($lockFile);
        if ($lock['until'] > time()) fail('locked');
        $auth = authData($authFile);
        $pw = (string)(body()['password'] ?? '');
        if ($auth && verifyPw($auth, $pw)) {
            @unlink($lockFile);
            session_regenerate_id(true); $_SESSION['ssw_admin'] = true;
            out(['ok' => true]);
        }
        $lock['fails']++;
        if ($lock['fails'] >= 8) { $lock['fails'] = 0; $lock['until'] = time() + 15 * 60; }
        @file_put_contents($lockFile, json_encode($lock), LOCK_EX);
        sleep(1);
        fail('wrong');

    case 'logout':
        $_SESSION = []; session_destroy();
        out(['ok' => true]);

    case 'password':
        if ($method !== 'POST') fail('bad_request');
        if (!$logged) fail('auth');
        $b = body(); $auth = authData($authFile);
        if (!$auth || !verifyPw($auth, (string)($b['current'] ?? ''))) fail('wrong');
        $nw = (string)($b['password'] ?? '');
        if (strlen($nw) < 8) fail('short', '8자 이상이어야 합니다.');
        if (!saveAuth($authFile, $nw)) fail('write');
        out(['ok' => true]);

    /* ---------- 고객 접수 (로그인 불필요) ---------- */
    case 'book':
    case 'inquiry':
        if ($method !== 'POST') fail('bad_request');
        $isBook = ($action === 'book');
        $file = $isBook ? $bookFile : $inqFile;
        $raw = file_get_contents('php://input');
        if ($raw === false || strlen($raw) > 40 * 1024) fail('too_large');
        $b = json_decode($raw, true);
        $rec = is_array($b) ? ($b[$isBook ? 'booking' : 'inquiry'] ?? null) : null;
        if (!is_array($rec)) fail('bad_record');
        $ipHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|ssw'), 0, 16);
        if (!is_dir($storeDir) && !@mkdir($storeDir, 0755, true)) fail('write', 'admin/store 폴더를 만들 수 없습니다.');
        if (!is_file($storeDir . '/.htaccess')) @file_put_contents($storeDir . '/.htaccess', "Require all denied\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
        $fp = fopen($file . '.lock', 'c'); if ($fp) flock($fp, LOCK_EX);
        $list = readList($file);
        if (tooMany($list, $ipHash)) { if ($fp) { flock($fp, LOCK_UN); fclose($fp); } fail('rate_limited', '접수가 너무 잦습니다. 잠시 후 다시 시도해 주세요.'); }
        $id = cleanStr($rec['id'] ?? '', 20); if ($id === '') $id = ($isBook ? 'R' : 'B') . strtoupper(base_convert((string)time(), 10, 36));
        foreach ($list as $r) { if (($r['id'] ?? '') === $id) { $id .= '-' . substr(bin2hex(random_bytes(2)), 0, 3); break; } }
        $rec['id'] = $id;
        $rec['receivedAt'] = gmdate('c');
        $rec['ipHash'] = $ipHash;
        $rec['status'] = $isBook ? '신규' : '신규';
        $rec['ua'] = cleanStr($_SERVER['HTTP_USER_AGENT'] ?? '', 120);
        if ($isBook) {
            $c = is_array($rec['customer'] ?? null) ? $rec['customer'] : [];
            foreach (['name','phone','addr','addr2','date','slot','memo'] as $k) $c[$k] = cleanStr($c[$k] ?? '', $k === 'memo' ? 500 : 120);
            if ($c['name'] === '' || $c['phone'] === '') fail('bad_record', '이름과 연락처가 필요합니다.');
            $rec['customer'] = $c;
            foreach (['svcLabel','summary','site'] as $k) $rec[$k] = cleanStr($rec[$k] ?? '', 300);
            $cp = is_array($rec['coupon'] ?? null) ? $rec['coupon'] : null; unset($rec['coupon'], $rec['totalAfter']);
            if ($cp) {
                $code = strtoupper(cleanStr($cp['code'] ?? '', 20)); $token = cleanStr($cp['token'] ?? '', 64); $applied = null;
                if ($code !== '' && $token !== '') {
                    $mfp = fopen($memFile . '.lock', 'c'); if ($mfp) flock($mfp, LOCK_EX);
                    $ml = readList($memFile); $mi = memberByToken($ml, $token);
                    if ($mi !== null && is_array($ml[$mi]['coupons'] ?? null)) {
                        foreach ($ml[$mi]['coupons'] as $ci => $cc) {
                            if (($cc['code'] ?? '') === $code && ($cc['status'] ?? '') === 'unused' && ($cc['expiresAt'] ?? '') >= gmdate('Y-m-d')) {
                                $ml[$mi]['coupons'][$ci]['status'] = 'used'; $ml[$mi]['coupons'][$ci]['usedAt'] = gmdate('c'); $ml[$mi]['coupons'][$ci]['bookingId'] = $id;
                                $applied = ['code' => $code, 'label' => (string)$cc['label'], 'type' => (string)$cc['type'], 'value' => $cc['value'], 'memberId' => (string)$ml[$mi]['id'], 'memberName' => (string)$ml[$mi]['name']];
                                writeList($memFile, $ml); break;
                            }
                        }
                    }
                    if ($mfp) { flock($mfp, LOCK_UN); fclose($mfp); }
                }
                if ($applied && is_array($rec['total'] ?? null) && count($rec['total']) === 2) {
                    $d = couponDiscount($applied, $rec['total']); $applied['discount'] = $d;
                    $rec['totalAfter'] = [max(0, (float)$rec['total'][0] - $d[0]), max(0, (float)$rec['total'][1] - $d[1])];
                    $rec['coupon'] = $applied;
                } elseif ($cp) { $rec['couponFailed'] = $code; }   /* 코드가 안 맞거나 이미 쓴 쿠폰: 할인 없이 접수, 관리자에게 표시 */
            }
        } else {
            foreach (['company','name','phone','email','kind','state','addr','date','brand','memo','via','text'] as $k) if (isset($rec[$k])) $rec[$k] = cleanStr($rec[$k], $k === 'text' ? 4000 : 300);
            if (($rec['company'] ?? '') === '' || ($rec['phone'] ?? '') === '') fail('bad_record', '회사와 연락처가 필요합니다.');
        }
        array_unshift($list, $rec);
        if (count($list) > 2000) $list = array_slice($list, 0, 2000);
        $ok = writeList($file, $list);
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        if (!$ok) fail('write', '접수 파일을 쓸 수 없습니다. FTP에서 admin 폴더 권한을 707로 바꿔 주세요.');
        out(['ok' => true, 'id' => $id, 'receivedAt' => $rec['receivedAt']]);

    /* ---------- 공개: 회원가입 (이름·휴대폰). 같은 번호면 기존 회원으로 이어서 사용 ---------- */
    case 'member_join':
        if ($method !== 'POST') fail('bad_request');
        $b = body();
        $name = cleanStr($b['name'] ?? '', 40); $phone = cleanStr($b['phone'] ?? '', 20); $key = phoneKey($phone);
        if ($name === '' || !preg_match('/^01\d{8,9}$/', $key)) fail('bad_record', '이름과 휴대폰 번호를 확인해 주세요.');
        if (empty($b['consent'])) fail('consent', '개인정보 수집·이용에 동의해 주세요.');
        $ipHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|ssw'), 0, 16);
        ensureStore($storeDir);
        $fp = fopen($memFile . '.lock', 'c'); if ($fp) flock($fp, LOCK_EX);
        $list = readList($memFile); $idx = null;
        foreach ($list as $i => $m) { if (($m['phoneKey'] ?? '') === $key) { $idx = $i; break; } }
        $new = ($idx === null);
        if ($new) {
            if (tooMany($list, $ipHash)) { if ($fp) { flock($fp, LOCK_UN); fclose($fp); } fail('rate_limited', '가입 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.'); }
            $m = ['id' => 'M' . strtoupper(base_convert((string)time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(1)), 0, 2)), 'name' => $name, 'phone' => $phone, 'phoneKey' => $key,
                  'joinedAt' => gmdate('c'), 'receivedAt' => gmdate('c'), 'ipHash' => $ipHash, 'token' => bin2hex(random_bytes(16)), 'coupons' => [], 'ua' => cleanStr($_SERVER['HTTP_USER_AGENT'] ?? '', 120)];
            array_unshift($list, $m); $idx = 0;
        } else {
            $list[$idx]['token'] = bin2hex(random_bytes(16)); $list[$idx]['lastSeenAt'] = gmdate('c');
            if (empty($list[$idx]['name'])) $list[$idx]['name'] = $name;
        }
        if (count($list) > 5000) $list = array_slice($list, 0, 5000);
        $ok = writeList($memFile, $list);
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        if (!$ok) fail('write', '회원 정보를 저장할 수 없습니다.');
        out(['ok' => true, 'new' => $new, 'token' => $list[$idx]['token'], 'member' => publicMember($list[$idx]), 'coupon' => couponCfg($jsonFile)]);

    /* ---------- 공개: 내 정보·쿠폰 (토큰) ---------- */
    case 'member_me':
        if ($method !== 'POST') fail('bad_request');
        $b = body(); $token = cleanStr($b['token'] ?? '', 64);
        $list = readList($memFile); $mi = memberByToken($list, $token);
        if ($mi === null) fail('auth', '다시 가입해 주세요.');
        out(['ok' => true, 'member' => publicMember($list[$mi]), 'coupon' => couponCfg($jsonFile)]);

    /* ---------- 공개: 견적 후 쿠폰 발급. 같은 서비스의 안 쓴 쿠폰이 있으면 그 쿠폰을 그대로 돌려줌 ---------- */
    case 'coupon_issue':
        if ($method !== 'POST') fail('bad_request');
        $b = body(); $token = cleanStr($b['token'] ?? '', 64);
        $cfg = couponCfg($jsonFile);
        if (!$cfg['enabled']) fail('disabled', '지금은 쿠폰을 발급하지 않습니다.');
        $svc = cleanStr($b['svc'] ?? '', 40); if ($svc === '') $svc = '견적';
        $summary = cleanStr($b['summary'] ?? '', 200); $total = is_array($b['total'] ?? null) ? array_slice(array_map('floatval', $b['total']), 0, 2) : [];
        if ($cfg['minTotal'] > 0 && count($total) === 2 && $total[1] < $cfg['minTotal']) fail('min_total', number_format($cfg['minTotal']) . '원 이상 견적부터 쿠폰이 나갑니다.');
        $fp = fopen($memFile . '.lock', 'c'); if ($fp) flock($fp, LOCK_EX);
        $list = readList($memFile); $mi = memberByToken($list, $token);
        if ($mi === null) { if ($fp) { flock($fp, LOCK_UN); fclose($fp); } fail('auth', '다시 가입해 주세요.'); }
        $today = gmdate('Y-m-d'); $cps = is_array($list[$mi]['coupons'] ?? null) ? $list[$mi]['coupons'] : []; $found = null;
        foreach ($cps as $c) { if (($c['status'] ?? '') === 'unused' && ($c['svc'] ?? '') === $svc && ($c['expiresAt'] ?? '') >= $today) { $found = $c; break; } }
        $issued = false;
        if (!$found) {
            $code = 'SS-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
            $found = ['code' => $code, 'svc' => $svc, 'type' => $cfg['type'], 'value' => $cfg['value'], 'label' => $cfg['label'], 'issuedAt' => gmdate('c'),
                      'expiresAt' => gmdate('Y-m-d', time() + $cfg['validDays'] * 86400), 'status' => 'unused', 'quote' => ['summary' => $summary, 'total' => $total, 'page' => cleanStr($b['page'] ?? '', 40)]];
            array_unshift($cps, $found); $issued = true;
            if (count($cps) > 30) $cps = array_slice($cps, 0, 30);
            $list[$mi]['coupons'] = $cps;
            $ok = writeList($memFile, $list);
            if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
            if (!$ok) fail('write', '쿠폰을 저장할 수 없습니다.');
        } else { if ($fp) { flock($fp, LOCK_UN); fclose($fp); } }
        out(['ok' => true, 'issued' => $issued, 'coupon' => publicCoupon($found), 'member' => publicMember($list[$mi])]);

    /* ---------- 관리자: 회원·쿠폰 목록 ---------- */
    case 'members':
        if (!$logged) fail('auth');
        $ml = readList($memFile); foreach ($ml as &$m) { unset($m['token'], $m['ipHash'], $m['ua'], $m['phoneKey']); } unset($m);
        out(['ok' => true, 'members' => $ml, 'coupon' => couponCfg($jsonFile)]);

    case 'member_update':
        if ($method !== 'POST') fail('bad_request');
        if (!$logged) fail('auth');
        $b = body(); $id = cleanStr($b['id'] ?? '', 40); if ($id === '') fail('bad_request');
        $fp = fopen($memFile . '.lock', 'c'); if ($fp) flock($fp, LOCK_EX);
        $list = readList($memFile); $found = false;
        foreach ($list as $i => $m) {
            if (($m['id'] ?? '') !== $id) continue;
            $found = true;
            if (!empty($b['delete'])) { unset($list[$i]); break; }
            if (isset($b['note'])) $list[$i]['adminNote'] = cleanStr($b['note'], 300);
            if (isset($b['couponCode'], $b['couponStatus']) && is_array($list[$i]['coupons'] ?? null)) {
                foreach ($list[$i]['coupons'] as $ci => $cc) {
                    if (($cc['code'] ?? '') === strtoupper(cleanStr($b['couponCode'], 20))) {
                        if (!empty($b['couponDelete'])) { array_splice($list[$i]['coupons'], $ci, 1); break; }
                        $list[$i]['coupons'][$ci]['status'] = in_array($b['couponStatus'], ['unused', 'used', 'void'], true) ? $b['couponStatus'] : 'unused';
                        $list[$i]['coupons'][$ci]['updatedAt'] = gmdate('c'); break;
                    }
                }
            }
            break;
        }
        $ok = $found ? writeList($memFile, $list) : false;
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        if (!$found) fail('not_found');
        if (!$ok) fail('write');
        out(['ok' => true]);

    /* ---------- 관리자: 접수 목록 ---------- */
    case 'inbox':
        if (!$logged) fail('auth');
        $strip = function (array $l): array { foreach ($l as &$r) { unset($r['ipHash'], $r['ua']); } return $l; };
        out(['ok' => true, 'bookings' => $strip(readList($bookFile)), 'inquiries' => $strip(readList($inqFile)), 'now' => gmdate('c')]);

    case 'inbox_update':
        if ($method !== 'POST') fail('bad_request');
        if (!$logged) fail('auth');
        $b = body();
        $type = ($b['type'] ?? '') === 'inquiry' ? 'inquiry' : 'booking';
        $file = $type === 'booking' ? $bookFile : $inqFile;
        $id = cleanStr($b['id'] ?? '', 40); if ($id === '') fail('bad_request');
        $fp = fopen($file . '.lock', 'c'); if ($fp) flock($fp, LOCK_EX);
        $list = readList($file); $found = false;
        foreach ($list as $i => $r) {
            if (($r['id'] ?? '') !== $id) continue;
            $found = true;
            if (!empty($b['delete'])) { unset($list[$i]); break; }
            if (isset($b['status'])) $list[$i]['status'] = cleanStr($b['status'], 40);
            if (isset($b['note'])) $list[$i]['adminNote'] = cleanStr($b['note'], 500);
            if (isset($b['tech'])) { $list[$i]['tech'] = cleanStr($b['tech'], 60); $list[$i]['notifiedAt'] = gmdate('c'); }
            $list[$i]['updatedAt'] = gmdate('c');
            break;
        }
        $ok = $found ? writeList($file, $list) : false;
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        if (!$found) fail('not_found');
        if (!$ok) fail('write');
        out(['ok' => true]);

    /* ---------- 관리자: 제휴 기사 목록 ---------- */
    /* ---------- 공개: 실적 숫자 (첫 화면 띠). 접수·진행·완료 건수와 활동 기사 수 ---------- */
    case 'stats':
        $bk = readList($bookFile); $iq = readList($inqFile); $tq = readList($storeDir . '/techs.json');
        $prog = ['기사 알림', '연락 완료', '기사 배정', '회신 완료', '견적 발송', '계약'];
        $n = ['received' => count($bk) + count($iq), 'inProgress' => 0, 'done' => 0, 'techs' => 0, 'members' => count(readList($memFile))];
        foreach (array_merge($bk, $iq) as $r) { $st = (string)($r['status'] ?? ''); if (in_array($st, $prog, true)) $n['inProgress']++; if ($st === '시공 완료') $n['done']++; }
        foreach ($tq as $t) { if (!empty($t['active']) || !isset($t['active'])) $n['techs']++; }
        out(['ok' => true] + $n);

    case 'techs':
        if (!$logged) fail('auth');
        out(['ok' => true, 'techs' => readList($storeDir . '/techs.json')]);

    case 'techs_save':
        if ($method !== 'POST') fail('bad_request');
        if (!$logged) fail('auth');
        $in = body()['techs'] ?? null;
        if (!is_array($in)) fail('bad_request');
        $clean = [];
        foreach (array_slice($in, 0, 200) as $t) {
            if (!is_array($t)) continue;
            $row = [];
            foreach (['id','name','phone','area','skills','memo'] as $k) $row[$k] = cleanStr($t[$k] ?? '', $k === 'memo' ? 300 : 80);
            if ($row['name'] === '' && $row['phone'] === '') continue;
            if ($row['id'] === '') $row['id'] = 'T' . substr(bin2hex(random_bytes(3)), 0, 6);
            $row['active'] = !empty($t['active']) || !isset($t['active']);
            $clean[] = $row;
        }
        if (!is_dir($storeDir) && !@mkdir($storeDir, 0755, true)) fail('write');
        if (!writeList($storeDir . '/techs.json', $clean)) fail('write', 'admin/store 에 쓸 수 없습니다.');
        out(['ok' => true, 'techs' => $clean]);

    case 'load':
        if (!$logged) fail('auth');
        $cfg = is_file($jsonFile) ? json_decode((string)file_get_contents($jsonFile), true) : [];
        out(['ok' => true, 'config' => is_array($cfg) ? $cfg : [], 'writable' => $writable]);

    case 'save':
        if ($method !== 'POST') fail('bad_request');
        if (!$logged) fail('auth');
        $cfg = body()['config'] ?? null;
        if (!is_array($cfg)) fail('bad_config', '설정 형식이 올바르지 않습니다.');
        foreach ($cfg as $k => $v) {
            if (!in_array($k, ['site', 'rates', 'brands', 'rent', 'savedAt'], true)) unset($cfg[$k]);
        }
        $cfg['savedAt'] = gmdate('c');
        $json = json_encode($cfg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_PRETTY_PRINT);
        if ($json === false) fail('encode', json_last_error_msg());
        if (!writeAtomic($jsonFile, $json . "\n") || !writeAtomic($jsFile, "window.SSW_CONFIG = " . $json . ";\n")) {
            fail('write', 'data 폴더에 쓸 수 없습니다. FTP에서 data 폴더와 config.js 권한을 707/666으로 바꿔 주세요.');
        }
        out(['ok' => true, 'savedAt' => $cfg['savedAt']]);

    default:
        fail('unknown_action');
}
