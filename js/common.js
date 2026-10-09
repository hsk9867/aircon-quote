/* 속시원 공통 스크립트: 단가, 브랜드, 유틸, 상단/하단 바, 예약 접수 */
(function(){
'use strict';

/* ---------- 단가 (원, [최소, 최대]) ---------- */
const TYPE_LABEL = {wall:'벽걸이', stand:'스탠드', two:'2in1', ceil:'천장형'};
const RATES = {
  base:    {wall:[150000,180000], stand:[200000,230000], two:[300000,340000], src:'가정 · 딜사이트 15~20만 원 참고 (배관 5m 포함)'},
  moveBase:{wall:[160000,160000], stand:[200000,200000], two:[340000,340000], src:'기준 · 에어아이 (배관 5m 포함)'},
  remove:  {wall:[50000,50000],   stand:[70000,70000],   two:[90000,90000],   src:'기준 · 에어아이'},
  pipePerM:{wall:[19000,19000],   stand:[22000,22000],   two:[22000,25000],   src:'기준 · 에어아이 (2in1은 가정)'},
  pipeReplace:{wall:[60000,100000], stand:[80000,130000], two:[120000,180000], src:'가정 · 매립 배관 교체'},
  angle:   {wall:[100000,100000], stand:[140000,140000], two:[140000,140000], src:'기준 · 에어아이'},
  gas:     {wall:[30000,50000],   stand:[40000,60000],   two:[50000,80000],   src:'가정 · 신규 설치 시 긴 배관 보충분'},
  gasFill: {wall:[80000,100000],  stand:[100000,130000], two:[130000,160000], src:'기준 · 에어아이 벽걸이 8만 원~'},
  clean:   {wall:[70000,80000],   stand:[100000,120000], two:[160000,180000], src:'기준 · 에어아이·당근 게시가'},
  fan:     {wall:[20000,30000],   stand:[30000,40000],   two:[40000,60000],   src:'가정 · 송풍팬 완전 분해'},
  paper:   {wall:[20000,40000],   stand:[30000,50000],   two:[40000,70000],   src:'가정 · 배관 자리 부분 도배'},
  protect: {wall:[10000,20000],   stand:[15000,25000],   two:[20000,30000],   src:'가정 · 거주 중 가구 이동·보양'},
  ladder:[300000,300000], hole:[30000,50000], elecBase:[50000,80000], elecPer:[20000,30000],
  outdoorClean:[30000,50000], visit:[30000,30000], regionOut:[20000,40000],
  floorMid:[0,20000], floorHigh:[0,30000], distCity:[20000,40000], distFar:[50000,100000],
  dirt:[[0,0],[0,10000],[10000,20000]], highMount:[10000,20000],
  gasFactor:{unknown:[1,1.2], r410:[1,1], r32:[1.1,1.2], r22:[1.3,1.6]}, leakCheck:[0,30000], oldPart:[20000,50000],
  housePipe:[3,8], multiDiscount:0.1, seasonFactor:1.1, commission:0.05,
  /* 3대 이상: 시스템 에어컨 (천장형 실내기 + 실외기 1대) */
  ceil:{ indoor:[250000,350000], outdoor:[200000,300000], hatch:[30000,50000], drain:[50000,100000],
         protect:[20000,30000], paper:[30000,60000], remove:[50000,90000], gas:[50000,100000],
         src:'가정 · 시스템 에어컨 시공 시세 참고' }
};
/* 브랜드별 예시 제품 (평수대 → 모델, 판매가) */
const BRANDS = [
  {id:'samsung', name:'삼성', line:'무풍·윈드프리', note:'무풍 냉방, 비스포크 색상', models:{
    wall:{6:['윈드프리 벽걸이 6평',520000],7:['윈드프리 벽걸이 7평',620000],9:['윈드프리 벽걸이 9평',790000]},
    stand:{11:['비스포크 무풍 11평',1290000],13:['비스포크 무풍 13평',1490000],15:['비스포크 무풍 15평',1690000],17:['비스포크 무풍 17평',1890000],19:['비스포크 무풍 19평',2090000],23:['비스포크 무풍 23평',2390000]},
    ceil:{9:['무풍 천장형 1way 9평',890000],15:['무풍 천장형 4way 15평',1290000],23:['무풍 천장형 4way 23평',1690000]}, outdoor:['시스템 실외기 (멀티)',2200000]}},
  {id:'lg', name:'LG', line:'휘센', note:'오브제 디자인, 인공지능 절전', models:{
    wall:{6:['휘센 벽걸이 6평',490000],7:['휘센 벽걸이 7평',590000],9:['휘센 벽걸이 9평',760000]},
    stand:{11:['휘센 오브제 11평',1240000],13:['휘센 오브제 13평',1440000],15:['휘센 오브제 15평',1640000],17:['휘센 오브제 17평',1790000],19:['휘센 오브제 19평',1990000],23:['휘센 오브제 23평',2290000]},
    ceil:{9:['휘센 천장형 1way 9평',860000],15:['휘센 천장형 4way 15평',1250000],23:['휘센 천장형 4way 23평',1640000]}, outdoor:['휘센 시스템 실외기 (멀티)',2100000]}},
  {id:'carrier', name:'캐리어', line:'인버터', note:'가성비, 기본 성능', models:{
    wall:{6:['캐리어 벽걸이 6평',450000],7:['캐리어 벽걸이 7평',520000],9:['캐리어 벽걸이 9평',650000]},
    stand:{11:['캐리어 스탠드 11평',990000],13:['캐리어 스탠드 13평',1150000],15:['캐리어 스탠드 15평',1290000],17:['캐리어 스탠드 17평',1450000],19:['캐리어 스탠드 19평',1650000],23:['캐리어 스탠드 23평',1890000]},
    ceil:{9:['캐리어 천장형 1way 9평',690000],15:['캐리어 천장형 4way 15평',990000],23:['캐리어 천장형 4way 23평',1290000]}, outdoor:['캐리어 시스템 실외기 (멀티)',1700000]}},
  {id:'winia', name:'위니아', line:'둘레바람', note:'국산 저가형, 단순 기능', models:{
    wall:{6:['위니아 벽걸이 6평',420000],7:['위니아 벽걸이 7평',490000],9:['위니아 벽걸이 9평',620000]},
    stand:{11:['위니아 스탠드 11평',950000],13:['위니아 스탠드 13평',1090000],15:['위니아 스탠드 15평',1230000],17:['위니아 스탠드 17평',1390000],19:['위니아 스탠드 19평',1590000],23:['위니아 스탠드 23평',1790000]},
    ceil:{9:['위니아 천장형 1way 9평',650000],15:['위니아 천장형 4way 15평',950000],23:['위니아 천장형 4way 23평',1250000]}, outdoor:['위니아 시스템 실외기 (멀티)',1600000]}}
];

/* ---------- 유틸 ---------- */
const $ = id => document.getElementById(id);
const won = n => Math.round(n).toLocaleString('ko-KR')+'원';
const manWon = n => { const m=Math.round(n/1000)/10; return (Number.isInteger(m)?m:m.toFixed(1))+'만'; };
const rangeText = (a,b) => a===b ? won(a) : won(a)+' ~ '+won(b);
const rangeShort = (a,b) => a===b ? manWon(a)+' 원' : manWon(a)+' ~ '+manWon(b)+' 원';
const mul = (r,k) => [r[0]*k, r[1]*k];
const add = (a,b) => [a[0]+b[0], a[1]+b[1]];
const sumItems = items => items.reduce((a,i)=>add(a,i.r),[0,0]);
const radio = name => (document.querySelector('input[name="'+name+'"]:checked')||{}).value;
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const isPeak = d => { if(!d) return false; const m=+d.slice(5,7); return m>=6&&m<=8; };
const load = k => { try{ return JSON.parse(localStorage.getItem(k)||'[]'); }catch(e){ return []; } };
const save = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const fmtDate = d => { if(!d) return '미정'; const [y,m,dd]=d.split('-'); return y+'년 '+(+m)+'월 '+(+dd)+'일'; };
const regionOnly = a => String(a||'').trim().split(/\s+/).slice(0,3).join(' ');
const plusDays = n => { const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
/* 희망일이 6~8월이면 시공비에 성수기 계수를 항목으로 추가 */
function applySeason(items, date){
  let labor = sumItems(items);
  if(isPeak(date)){ const ex=mul(labor, RATES.seasonFactor-1); items.push({label:'성수기 계수 ×'+RATES.seasonFactor+' (6~8월 시공비)', r:ex}); labor=add(labor,ex); }
  return labor;
}
function linesHtml(items, total, totalLabel){
  return '<div class="lines">'+items.map(it=>'<div class="line"><span class="k">'+esc(it.label)+'</span><span class="v num">'+rangeText(it.r[0],it.r[1])+'</span></div>').join('')+
    (total?'<div class="line tot"><span class="k">'+esc(totalLabel||'총액')+'</span><span class="v num">'+rangeText(total[0],total[1])+'</span></div>':'')+'</div>';
}

/* ---------- 로고 ---------- */
const LOGO_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="2" width="44" height="44" rx="12" fill="var(--accent)"/><path d="M12 17h18a4 4 0 1 1-3 6.7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M12 25h22a4.5 4.5 0 1 0-3.4-7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".55"/><path d="M12 33h12a3.5 3.5 0 1 1-2.6 5.8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>';
const NAV = [['install.html','설치 견적'],['clean.html','청소 견적'],['gas.html','냉매 충전'],['move.html','이전·설치'],['prices.html','단가표'],['recruit.html','기사 모집']];
function mountChrome(){
  const here = location.pathname.split('/').pop() || 'index.html';
  const top = document.querySelector('header.top');
  if(top) top.innerHTML = '<div class="in"><a class="logo" href="index.html">'+LOGO_SVG+'<span><span class="word">속시원</span></span></a>'+
    '<nav class="nav" aria-label="바로가기">'+NAV.map(([h,l])=>'<a href="'+h+'"'+(h===here?' aria-current="page"':'')+'>'+l+'</a>').join('')+'</nav></div>';
  const foot = document.querySelector('footer');
  if(foot && !foot.innerHTML.trim()) foot.innerHTML =
    '<div class="links"><a href="index.html">홈</a>'+NAV.map(([h,l])=>'<a href="'+h+'">'+l+'</a>').join('')+'<a href="admin.html">관리자</a></div>'+
    '<div><b>속시원</b> · 상호, 대표, 사업자등록번호, 통신판매업 신고번호, 주소는 확정 후 표기</div>'+
    '<div>이 페이지는 기획서(2026-10-08) 1차 범위의 시제품입니다. 금액은 참고용이며 실제 단가표 확정 후 갱신됩니다.</div>';
}

/* ---------- 예약 접수 (모든 견적 페이지 공통) ----------
   Booking.mount({ el: 예약 섹션 요소, getQuote: () => ({svc, summary, items, labor, total, product, models, addr, memo, site}) }) */
const Booking = {
  mount(opts){
    const el = opts.el; this.getQuote = opts.getQuote;
    el.innerHTML =
      '<form class="book" id="book-form" novalidate>'+
        '<div class="summary" id="book-summary"><span class="eyebrow">견적 요약</span><div class="muted">위에서 견적을 먼저 받아 주세요.</div></div>'+
        '<div class="grid2"><div class="fs"><label class="lbl" for="b-name">이름</label><input type="text" id="b-name" autocomplete="name" placeholder="홍길동"></div>'+
        '<div class="fs"><label class="lbl" for="b-phone">연락처</label><input type="tel" id="b-phone" autocomplete="tel" placeholder="010-1234-5678"></div></div>'+
        '<div class="fs"><label class="lbl" for="b-addr">방문 주소</label><input type="text" id="b-addr" autocomplete="street-address" placeholder="서울시 마포구 성산동 ○○아파트"><span class="hint">기사에게는 수락 전까지 동까지만 공개됩니다.</span></div>'+
        '<div class="fs"><label class="lbl" for="b-addr2">상세 주소</label><input type="text" id="b-addr2" placeholder="101동 1203호"></div>'+
        '<div class="grid2"><div class="fs"><label class="lbl" for="b-date">희망 일자</label><input type="date" id="b-date"></div>'+
        '<div class="fs"><label class="lbl" for="b-slot">시간대</label><select id="b-slot"><option>오전 (9~12시)</option><option>오후 (13~17시)</option><option>상관없음</option></select></div></div>'+
        '<div class="fs"><label class="lbl" for="b-memo">요청 사항 <span class="hint">선택</span></label><textarea id="b-memo" placeholder="주차 안내, 반려동물, 사다리차 진입로 등"></textarea></div>'+
        '<label class="consent"><input type="checkbox" id="b-consent"><span>시공 연결을 위해 이름, 연락처, 방문 주소를 배정된 제휴 기사에게 제공하는 데 동의합니다. 보유 기간은 시공 완료 후 1년입니다.</span></label>'+
        '<p class="err" id="b-err" hidden></p>'+
        '<button class="btn primary block" type="submit">예약 신청하기</button>'+
      '</form><div class="done" id="book-done" hidden></div>';
    $('b-date').min = plusDays(0);
    $('book-form').addEventListener('submit', e=>{ e.preventDefault(); this.submit(); });
    this.refresh();
  },
  refresh(){
    const q = this.getQuote(); const el=$('book-summary'); if(!el) return;
    if(!q){ el.innerHTML='<span class="eyebrow">견적 요약</span><div class="muted">위에서 견적을 먼저 받아 주세요.</div>'; return; }
    el.innerHTML='<span class="eyebrow">견적 요약</span><div><b>'+esc(q.summary)+'</b></div><div class="amt num">'+rangeShort(q.total[0],q.total[1])+'</div>'+
      '<div class="small muted">'+(q.models?q.models.map(esc).join(' · '):q.items.map(i=>esc(i.label)).join(' · '))+'</div>';
    if(q.addr && !$('b-addr').value) $('b-addr').value=q.addr;
    if(q.date && !$('b-date').value) $('b-date').value=q.date;
  },
  submit(){
    const q=this.getQuote(); const err=$('b-err'); const problems=[];
    if(!q) problems.push('견적 (위에서 먼저 계산)');
    const name=$('b-name').value.trim(), phone=$('b-phone').value.trim(), addr=$('b-addr').value.trim(), date=$('b-date').value;
    if(!name) problems.push('이름');
    if(!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone)) problems.push('연락처 형식');
    if(addr.split(/\s+/).length<3) problems.push('방문 주소 (시·구·동까지)');
    if(!date) problems.push('희망 일자');
    if(!$('b-consent').checked) problems.push('개인정보 제3자 제공 동의');
    if(problems.length){ err.hidden=false; err.textContent='확인이 필요합니다: '+problems.join(', '); return; }
    err.hidden=true;
    const b={
      id:'R'+Date.now().toString(36).toUpperCase().slice(-6), createdAt:new Date().toISOString(),
      svcLabel:q.svc, summary:q.summary, models:q.models||[], items:q.items.map(i=>({label:i.label,min:i.r[0],max:i.r[1]})),
      product:q.product||0, labor:q.labor, total:q.total,
      payout:[Math.round(q.labor[0]*(1-RATES.commission)), Math.round(q.labor[1]*(1-RATES.commission))],
      site:q.site||'', customer:{name, phone, addr, addr2:$('b-addr2').value.trim(), date, slot:$('b-slot').value, memo:$('b-memo').value.trim()},
      status:'알림 발송'
    };
    const list=load('ssw_bookings'); list.unshift(b); save('ssw_bookings',list);
    this.showDone(b);
  },
  showDone(b){
    $('book-form').hidden=true; const d=$('book-done'); d.hidden=false;
    const row=(k,v)=>'<div class="row"><span>'+k+'</span><span>'+v+'</span></div>';
    d.innerHTML=
      '<div class="notice">예약이 접수되었습니다. 접수번호 '+b.id+' · 배정되면 '+esc(b.customer.phone)+'로 안내드립니다.</div>'+
      '<div><span class="eyebrow">기사에게 발송되는 알림 미리보기</span><p class="small muted">실제 서비스에서는 카카오 알림톡 또는 문자로 발송됩니다. 상세 주소와 연락처는 수락 후에만 공개됩니다.</p></div>'+
      '<div class="alarm"><div class="hd"><span>[속시원] 새 예약 '+b.id+'</span><span class="tag acc" id="alarm-status">'+esc(b.status)+'</span></div><div class="bd">'+
        row('방문 지역',esc(regionOnly(b.customer.addr)))+
        row('작업',esc(b.svcLabel)+' · '+esc(b.summary))+
        (b.models.length?row('제품',esc(b.models.join(', '))+' (회사 창고 수령)'):'')+
        row('희망 일자',fmtDate(b.customer.date)+' '+esc(b.customer.slot))+
        row('작업 내용',b.items.map(i=>esc(i.label)).join(', '))+
        row('현장 정보',esc([b.site,b.customer.memo].filter(Boolean).join(' · ')||'고객 메모 없음'))+
        row('정산 금액','<b class="num">'+rangeText(b.payout[0],b.payout[1])+'</b> <span class="muted small">(시공비에서 수수료 5% 차감)</span>')+
        row('고객 연락처','<span class="muted">수락 후 공개</span>')+row('상세 주소','<span class="muted">수락 후 공개</span>')+
      '</div><div class="ft"><button class="btn primary sm" type="button" data-act="accept">수락</button><button class="btn sm" type="button" data-act="decline">거절</button><span class="small muted" style="align-self:center">2시간 안에 응답이 없으면 다음 기사에게 전달</span></div></div>'+
      '<a class="btn block" href="index.html">처음으로</a>';
    d.querySelector('[data-act=accept]').addEventListener('click',()=>Booking.setStatus(b.id,'기사 수락 · 고객 배정 안내 발송'));
    d.querySelector('[data-act=decline]').addEventListener('click',()=>Booking.setStatus(b.id,'거절 · 다음 기사에게 전달'));
  },
  setStatus(id,status){
    const list=load('ssw_bookings'); const b=list.find(x=>x.id===id); if(b){ b.status=status; save('ssw_bookings',list); }
    const el=$('alarm-status'); if(el){ el.textContent=status; el.className='tag '+(status.startsWith('거절')?'warn':'ok'); }
  }
};

window.SSW = {TYPE_LABEL, RATES, BRANDS, $, won, manWon, rangeText, rangeShort, mul, add, sumItems, radio, esc, isPeak, load, save, fmtDate, regionOnly, plusDays, applySeason, linesHtml, Booking, LOGO_SVG};
document.addEventListener('DOMContentLoaded', mountChrome);
})();
