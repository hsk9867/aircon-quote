/* 속시원 공통 스크립트: 단가, 브랜드, 유틸, 상단/하단 바, 예약 접수 */
(function(){
'use strict';

/* ---------- 단가 (원, [최소, 최대]) ---------- */
const TYPE_LABEL = {wall:'벽걸이', stand:'스탠드', two:'2in1', ceil:'천장형'};
const RATES_DEFAULT = {
  base:    {wall:[150000,180000], stand:[200000,230000], two:[300000,340000] },
  moveBase:{wall:[160000,160000], stand:[200000,200000], two:[340000,340000] },
  remove:  {wall:[50000,50000],   stand:[70000,70000],   two:[90000,90000] },
  pipePerM:{wall:[19000,19000],   stand:[22000,22000],   two:[22000,25000] },
  pipeReplace:{wall:[60000,100000], stand:[80000,130000], two:[120000,180000] },
  angle:   {wall:[100000,100000], stand:[140000,140000], two:[140000,140000] },
  gas:     {wall:[30000,50000],   stand:[40000,60000],   two:[50000,80000] },
  gasFill: {wall:[80000,100000],  stand:[100000,130000], two:[130000,160000] },
  clean:   {wall:[70000,80000],   stand:[100000,120000], two:[160000,180000] },
  fan:     {wall:[20000,30000],   stand:[30000,40000],   two:[40000,60000] },
  paper:   {wall:[20000,40000],   stand:[30000,50000],   two:[40000,70000] },
  protect: {wall:[10000,20000],   stand:[15000,25000],   two:[20000,30000] },
  ladder:[300000,300000], hole:[30000,50000], elecBase:[50000,80000], elecPer:[20000,30000],
  outdoorClean:[30000,50000], visit:[30000,30000], regionOut:[20000,40000],
  floorMid:[0,20000], floorHigh:[0,30000], distCity:[20000,40000], distFar:[50000,100000],
  dirt:[[0,0],[0,10000],[10000,20000]], highMount:[10000,20000],
  gasFactor:{unknown:[1,1.2], r410:[1,1], r32:[1.1,1.2], r22:[1.3,1.6]}, leakCheck:[0,30000], oldPart:[20000,50000],
  housePipe:[3,8], multiDiscount:0.1, seasonFactor:1.1, commission:0.05,
  /* 3대 이상: 시스템 에어컨 (천장형 실내기 + 실외기 1대) */
  ceil:{ indoor:[250000,350000], outdoor:[200000,300000], hatch:[30000,50000], drain:[50000,100000],
         protect:[20000,30000], paper:[30000,60000], remove:[50000,90000], gas:[50000,100000],
         clean:[120000,150000], fan:[40000,60000] }
};
/* 브랜드별 제품 (평수 → 모델, 판매가 원). 2026-10-06 유통 단가표 기준. 관리자 페이지 > 브랜드·제품에서 수정 */
const BRANDS_DEFAULT = [
 {
  id: "samsung",
  name: "삼성",
  line: "무풍·Q9000",
  note: "2026-10-06 단가표 기준 (배송 포함가)",
  models: {
   wall: {
    6: [
     "벽걸이 6평 AR06D1150HZS",
     409000
    ],
    7: [
     "무풍 벽걸이 7평 AR60F07D12WS",
     640000
    ],
    9: [
     "무풍 벽걸이 9평 AR60F09D11WS",
     800000
    ],
    11: [
     "무풍 벽걸이 11평 AR60F11D11WS",
     840000
    ],
    13: [
     "무풍 벽걸이 13평 AR60F13D12WS",
     970000
    ],
    15: [
     "무풍 벽걸이 15평 AR60F15D12WS",
     1040000
    ]
   },
   stand: {
    17: [
     "Q9000 스탠드 17평 AF60F17D11WRS",
     1150000
    ],
    19: [
     "Q9000 스탠드 19평 AF60F19D11WRS",
     1290000
    ],
    23: [
     "중대형 스탠드 23평 AP083BAPPBH2S",
     1520000
    ],
    30: [
     "중대형 스탠드 30평 AP110BAPPBH2S",
     1910000
    ],
    36: [
     "중대형 스탠드 36평 AP130BAPPBH2S",
     2090000
    ],
    40: [
     "중대형 스탠드 40평 AP145BAPPHH2S",
     2060000
    ],
    60: [
     "전면토출 60평 AP230DAPDHH1S",
     4490000
    ],
    80: [
     "전면토출 80평 AP290DAPDHH1S",
     4940000
    ]
   },
   two: {
    17: [
     "Q9000 투인원 17평+6평 AF60F17D11WRS",
     1350000
    ],
    19: [
     "Q9000 투인원 19평+6평 AF60F19D11WRS",
     1490000
    ]
   },
   ceil: {
    6: [
     "천장형 1WAY 6평 AC023CS1DBC1SY",
     740000
    ],
    8: [
     "천장형 1WAY 8평 AC032CS1DBC1SY",
     810000
    ],
    10: [
     "천장형 1WAY 10평 AC040CS1DBC1SY",
     940000
    ],
    13: [
     "천장형 1WAY 13평 AC052CS1DBC1SY",
     1080000
    ],
    15: [
     "천장형 1WAY 15평 AC060CS1DBC1SY",
     1090000
    ],
    18: [
     "천장형 1WAY 18평 AC072CS1DBC1SY",
     1160000
    ],
    23: [
     "천장형 4WAY 23평 AC083CS4DBC1SY",
     1440000
    ],
    28: [
     "천장형 4WAY 28평 AC100CS4DBC1SY",
     1530000
    ],
    30: [
     "천장형 4WAY 30평 AC110CS4DBC1SY",
     1740000
    ],
    40: [
     "천장형 4WAY 40평 AC145CS4DBC1SY",
     1990000
    ]
   },
   outdoor: [
    "실외기 (싱글 세트 가격에 포함)",
    0
   ]
  }
 },
 {
  id: "lg",
  name: "LG",
  line: "휘센",
  note: "벽걸이·스탠드·2in1은 2026-10 LG B2B 공급단가(배관 제외가), 시스템은 LG 공급가격표 도매가 (단배관 RNQ·RPUQ, 다배관 MNV·MUV)",
  models: {
   wall: {
    6: [
     "휘센 벽걸이 6평 SQ06EZ1WBS",
     380000,
     380000
    ],
    9: [
     "휘센 벽걸이 9평 SQ09GJ1WAS",
     760000,
     760000
    ],
    10: [
     "휘센 벽걸이 10평 SQ10GJ1WAS (신모델)",
     789000,
     789000
    ],
    11: [
     "휘센 벽걸이 11평 SQ11GK1WES (1등급)",
     1047000,
     1047000
    ],
    13: [
     "휘센 벽걸이 13평 SQ13GK1WAS",
     1102000,
     1102000
    ],
    16: [
     "휘센 벽걸이 16평 SQ16GK1WAS",
     1246000,
     1246000
    ]
   },
   stand: {
    18: [
     "휘센 위너 스탠드 18평 FQ18GW1HN1",
     1324000,
     1324000
    ],
    23: [
     "휘센 상업용 스탠드 23평 PQ0900T2SF (냉방 전용)",
     1270000,
     1270000
    ],
    31: [
     "휘센 상업용 스탠드 31평 PQ1100T2FR (냉방 전용)",
     1550000,
     1550000
    ],
    36: [
     "휘센 중대형 스탠드 36평 PW1301T2L (냉난방)",
     1974000,
     1974000
    ],
    40: [
     "휘센 상업용 스탠드 40평 PQ1450T2FR (냉방 전용)",
     2016000,
     2016000
    ],
    63: [
     "휘센 상업용 스탠드 63평 PQ2300F9SF (삼상·배관 없음)",
     4180000,
     4180000
    ],
    80: [
     "휘센 상업용 스탠드 80평 PQ2900F9SF (삼상·배관 없음)",
     4800000,
     4800000
    ],
    125: [
     "휘센 상업용 스탠드 125평 PQ4500N9SF (삼상)",
     8050000,
     8050000
    ],
    160: [
     "휘센 상업용 스탠드 160평 PQ5800N9SF (삼상)",
     9040000,
     9040000
    ]
   },
   two: {
    18: [
     "휘센 위너 투인원 18평+6평 FQ18GW1HN2",
     1537000,
     1537000
    ]
   },
   ceil: {
    3: [
     "주거용 멀티 1WAY 3평 RNQ0120K2WP (단배관)",
     322740,
     322740
    ],
    4: [
     "주거용 멀티 1WAY 4평 RNQ0160K2WP (단배관)",
     326700,
     326700
    ],
    5: [
     "주거용 멀티 1WAY 5평 RNQ0200C2WP (단배관)",
     332640,
     332640
    ],
    6: [
     "주거용 멀티 1WAY 6평 RNQ0230C2WP (단배관)",
     339900,
     339900
    ],
    8: [
     "주거용 멀티 1WAY 8평 RNQ0320C2WP (단배관)",
     347820,
     347820
    ],
    10: [
     "주거용 멀티 1WAY 10평 RNQ0400C2WP (단배관)",
     355080,
     355080
    ],
    13: [
     "주거용 멀티 1WAY 13평 RNQ0520C2WP (단배관)",
     436920,
     436920
    ],
    15: [
     "주거용 멀티 1WAY 15평 RNQ0600C2WP (단배관)",
     508200,
     508200
    ],
    18: [
     "주거용 멀티 1WAY 18평 RNQ0720C2WP (단배관)",
     522060,
     522060
    ]
   },
   outdoor: [
    "주거용 멀티 실외기 (용량에 맞춰 자동 선택)",
    0
   ],
   outdoors: [
    {
     hp: 2.5,
     kw: 7.3,
     name: "주거용 멀티 실외기 2.5마력 RPUQ025SA2R (단배관)",
     price: 792000,
     cost: 792000
    },
    {
     hp: 3,
     kw: 8,
     name: "주거용 멀티 실외기 3마력 RPUQ030SA2R (단배관)",
     price: 917400,
     cost: 917400
    },
    {
     hp: 4,
     kw: 11.2,
     name: "주거용 멀티 실외기 4마력 RPUQ040SB2R (단배관)",
     price: 1069200,
     cost: 1069200
    },
    {
     hp: 5,
     kw: 14.5,
     name: "주거용 멀티 실외기 5마력 RPUQ050SG2R (단배관)",
     price: 1478400,
     cost: 1478400
    },
    {
     hp: 6,
     kw: 16,
     name: "주거용 멀티 실외기 6마력 RPUQ060SG2R (단배관)",
     price: 1762200,
     cost: 1762200
    },
    {
     hp: 8,
     kw: 22.4,
     name: "주거용 멀티 실외기 8마력 RPUQ080S2S9R (단배관)",
     price: 2178000,
     cost: 2178000
    },
    {
     hp: 10,
     kw: 28,
     name: "주거용 멀티 실외기 10마력 RPUQ100S2S9R (단배관)",
     price: 2996400,
     cost: 2996400
    }
   ],
   ceilMulti: {
    5: [
     "올인원 1WAY 5평 MNV0201C2S (다배관)",
     292842,
     292842
    ],
    6: [
     "올인원 1WAY 6평 MNV0231C2S (다배관)",
     299860,
     299860
    ],
    8: [
     "올인원 1WAY 8평 MNV0321C2S (다배관)",
     306240,
     306240
    ],
    10: [
     "올인원 1WAY 10평 MNV0401C2S (다배관)",
     313258,
     313258
    ],
    13: [
     "올인원 1WAY 13평 MNV0521C2S (다배관)",
     386628,
     386628
    ],
    15: [
     "올인원 1WAY 15평 MNV0601C2S (다배관)",
     426822,
     426822
    ],
    18: [
     "올인원 1WAY 18평 MNV0721C2S (다배관)",
     440220,
     440220
    ]
   },
   outdoorsMulti: [
    {
     hp: 2.5,
     kw: 7.3,
     name: "올인원 실외기 2.5마력 MUV0721A23V (다배관)",
     price: 778360,
     cost: 778360
    },
    {
     hp: 3,
     kw: 8,
     name: "올인원 실외기 3마력 MUV0901A24V (다배관)",
     price: 957000,
     cost: 957000
    },
    {
     hp: 4,
     kw: 11.2,
     name: "올인원 실외기 4마력 MUV1101B25V (다배관)",
     price: 1116500,
     cost: 1116500
    },
    {
     hp: 5,
     kw: 14.5,
     name: "올인원 실외기 5마력 MUV1451S25V (다배관)",
     price: 1658800,
     cost: 1658800
    }
   ]
  }
 },
 {
  id: "carrier",
  name: "캐리어",
  line: "에어로 20단·인버터",
  note: "2026-10-06 단가표 기준. 천장형 단가 없음 (3대 이상 시스템 견적에서 제외)",
  models: {
   wall: {
    6: [
     "캐리어 벽걸이 6평 DARB-0062GDWSD",
     395000
    ],
    8: [
     "캐리어 벽걸이 8평 AARB-0081FAWSD",
     530000
    ],
    10: [
     "캐리어 벽걸이 10평 AARB-0102GDWSD",
     565000
    ],
    13: [
     "캐리어 벽걸이 13평 DARB-0132GDWSD",
     780000
    ],
    16: [
     "캐리어 벽걸이 16평 DARB-0162GDWSD",
     960000
    ]
   },
   stand: {
    16: [
     "에어로 20단 스탠드 16평 DASB-0163XAWND",
     1040000
    ],
    18: [
     "에어로 20단 스탠드 18평 DASB-0181XAWMD",
     1190000
    ],
    23: [
     "에어로 20단 스탠드 23평 DASC-0234XAWMD",
     1310000
    ],
    30: [
     "중대형 스탠드 30평 DAMQ-1101EAWSD",
     1760000
    ],
    40: [
     "중대형 스탠드 40평 DAMQ-1451EAWSX",
     1810000
    ],
    60: [
     "대형 60평 DALQ-2302LAWSX",
     4420000
    ],
    80: [
     "대형 80평 DALQ-2902LAWSX",
     4800000
    ]
   },
   two: {
    16: [
     "에어로 투인원 16평+벽걸이 DASB-0163XAWND",
     1200000
    ],
    18: [
     "에어로 투인원 18평+벽걸이 DASB-0181XAWMD",
     1350000
    ],
    23: [
     "에어로 투인원 23평+벽걸이 DASC-0234XAWMD",
     1470000
    ]
   },
   ceil: {},
   outdoor: [
    "실외기 (싱글 세트 가격에 포함)",
    0
   ]
  }
 }
];
/* 렌탈 계산 가정: 월 렌탈료 = 제품가 × 렌탈 계수 ÷ 약정 개월 + 설치비 분할 + 관리 서비스 + 보증·보험 */
const RENT_DEFAULT = { factor:{36:[1.18,1.26],48:[1.24,1.34],60:[1.30,1.42]}, care:{0:[0,0],1:[5500,7000],2:[10500,13500]}, warranty:[2500,3500], multiDiscount:0.05,
  installExtra:{apt:[0,0], house:[20000,60000], biz:[20000,80000]} };
/* 사이트 문구·연락처 기본값 (관리자 페이지에서 덮어씀) */
const SITE_DEFAULT = {
   "brand": {
    "name": "속시원",
    "tagline": "에어컨 가격, 현장에서 바뀌지 않게. 조건만 고르면 금액이 바로 나오는 무료 견적입니다."
   },
   "contact": {
    "phone": "010-0000-0000",
    "kakaoId": "@속시원",
    "kakaoChat": "https://pf.kakao.com/_sokshiwon/chat",
    "bizEmail": "biz@sokshiwon.kr",
    "note": "운영 전이라 예시입니다"
   },
   "biz": {
    "company": "",
    "ceo": "",
    "regNo": "",
    "mailOrderNo": "",
    "address": "",
    "footerNote": "이 페이지는 기획서(2026-10-08) 1차 범위의 시제품입니다. 금액은 참고용이며 실제 단가표 확정 후 갱신됩니다."
   },
   "home": {
    "menu": {
     "install": {
      "title": "가정용 설치 견적 내기",
      "desc": "제품 구매와 신규 설치를 한 번에. 브랜드별 총액 비교",
      "show": true
     },
     "shop": {
      "title": "상가·사무실 설치 견적 내기",
      "desc": "매장·사무실·학원 설치. 천장형 시스템과 스탠드 브랜드별 총액",
      "show": true
     },
     "clean": {
      "title": "분해 청소 견적",
      "desc": "기종·대수·사용 연수로 금액 안내",
      "show": true
     },
     "gas": {
      "title": "냉매 충전 견적",
      "desc": "안 시원할 때. 냉매 종류·기종별 충전 비용",
      "show": true
     },
     "move": {
      "title": "이전/설치 견적 내기",
      "desc": "이사할 때 철거하고 새집에 설치. 거리·층수 반영",
      "show": true
     },
     "rental": {
      "title": "에어컨 렌탈",
      "desc": "설치비 0원, 월 렌탈료만. 약정 후 소유권 이전",
      "show": true
     },
     "business": {
      "title": "기업 전용 문의",
      "desc": "사무실·매장·임대 건물 다량 견적. 카톡·메일로 접수",
      "show": true
     }
    },
    "links": {
     "prices": "단가표 전체 보기",
     "contact": "전화·카카오톡 상담"
    },
    "promo": [
     {"title": "에어컨 가격,\n현장에서 바뀌지 않게", "desc": "조건만 고르면 설치까지 총액이 바로 나옵니다", "cta": "설치 견적 내기", "href": "install.html", "img": "img/home-slide1.jpg"},
     {"title": "여름 오기 전,\n분해 청소 예약", "desc": "기종과 사용 연수만 고르면 금액이 바로", "cta": "청소 견적 내기", "href": "clean.html", "img": "img/home-slide2.jpg"},
     {"title": "설치비 0원,\n월 렌탈료만", "desc": "약정 기간별 월 렌탈료를 브랜드별로 비교", "cta": "렌탈 상담", "href": "rental.html", "img": "img/products/lg-stand.webp"}
    ],
    "quick": {"install": "가정용 설치", "shop": "상가·사무실", "move": "이전 설치", "clean": "분해 청소", "gas": "냉매 충전", "business": "기업 문의"},
    "titles": {"quick": "속시원하게 무료견적내기!", "reviews": "속시원한 고객 후기!", "promise": "속시원하게 약속!", "steps": "속시원하게 진행!", "contact": "궁금한 건 전화나 카톡으로 연락주세요!\n속시원하게 답변드립니다!"}
   },
   "reviews": [
    {
     "name": "김*현",
     "area": "서울 마포구",
     "svc": "벽걸이 설치",
     "text": "견적에 나온 금액 그대로 끝났어요. 배관 길이 미리 적어둔 게 맞아서 추가 비용 없이 깔끔하게 설치해 주셨습니다.",
     "type": "설치",
    "img": "img/reviews/r01.jpg",
     "date": "2026-10"
    },
    {
     "name": "박*영",
     "area": "경기 고양시",
     "svc": "스탠드 설치",
     "text": "전화 돌리지 않고 사이트에서 바로 총액 보고 예약했어요. 기사님이 시간 딱 맞춰 오셔서 두 시간 만에 끝났습니다.",
     "type": "설치",
    "img": "img/reviews/r02.jpg",
     "date": "2026-10"
    },
    {
     "name": "이*진",
     "area": "서울 강서구",
     "svc": "분해 청소",
     "text": "실외기까지 같이 청소했는데 냄새가 완전히 사라졌어요. 분해한 부품 사진도 보여주셔서 믿음이 갔습니다.",
     "type": "청소",
    "img": "img/reviews/r03.jpg",
     "date": "2026-09"
    },
    {
     "name": "최*우",
     "area": "인천 서구",
     "svc": "시스템 에어컨 설치",
     "text": "천장형 3대 설치했는데 실외기 한 대로 구성해 주셔서 베란다가 넓어졌어요. 점검구 위치도 미리 설명해 주셨습니다.",
     "type": "설치",
    "img": "img/reviews/r04.jpg",
     "date": "2026-09"
    },
    {
     "name": "정*아",
     "area": "서울 은평구",
     "svc": "이전 설치",
     "text": "이사하면서 철거부터 새집 설치까지 한 번에 했어요. 층수 가산까지 견적에 있어서 당일에 더 낸 돈이 없었습니다.",
     "type": "설치",
    "img": "img/reviews/r05.jpg",
     "date": "2026-09"
    },
    {
     "name": "한*수",
     "area": "경기 김포시",
     "svc": "천장형 청소",
     "text": "사무실 천장형 2대 분해 청소했는데 필터 안쪽 곰팡이까지 다 꺼내 보여주셨어요. 바람 냄새가 바로 달라졌습니다.",
     "type": "청소",
    "img": "img/reviews/r06.jpg",
     "date": "2026-08"
    },
    {
     "name": "오*민",
     "area": "서울 양천구",
     "svc": "상가 설치",
     "text": "매장 천장형 2대 견적이 바로 나와서 사장님께 바로 보고했어요. 영업 중이라 새벽 시간에 맞춰 시공해 주셨습니다.",
     "type": "설치",
    "img": "img/reviews/r07.jpg",
     "date": "2026-08"
    },
    {
     "name": "윤*서",
     "area": "경기 부천시",
     "svc": "벽걸이 설치",
     "text": "주택이라 외벽 배관이 걱정이었는데 사진 보내니 범위를 먼저 알려주셨어요. 배관 커버까지 깔끔하게 마감됐습니다.",
     "type": "설치",
    "img": "img/reviews/r08.jpg",
     "date": "2026-08"
    },
    {
     "name": "장*호",
     "area": "서울 영등포구",
     "svc": "분해 청소",
     "text": "사용 연수 고르니 오염도 가산까지 미리 보여줘서 좋았어요. 청소 후 바람 세기가 확실히 달라졌습니다.",
     "type": "청소",
    "img": "img/reviews/r09.jpg",
     "date": "2026-07"
    },
    {
     "name": "서*연",
     "area": "경기 파주시",
     "svc": "스탠드 청소",
     "text": "실외기 1대까지 같이 청소 신청했는데 대수대로 금액이 바로 나와서 좋았어요. 작업 후 바닥 정리까지 깔끔했습니다.",
     "type": "청소",
    "img": "img/reviews/r10.jpg",
     "date": "2026-07"
    }
   ],
   "stats": {
    "show": true,
    "items": [
     {"label": "완료된 시공", "auto": "done", "base": 0, "value": "", "unit": "건"},
     {"label": "견적 그대로 시공", "auto": "", "base": 0, "value": "약속", "unit": ""},
     {"label": "접수 후 연락", "auto": "", "base": 0, "value": "1시간 내", "unit": ""},
     {"label": "검증된 기사", "auto": "techs", "base": 0, "value": "", "unit": "명"}
    ]
   },
   "plan": {
    "note": "입력한 조건(거주 형태, 대수·평수, 거주 여부)으로 작성한 일반적인 설치 방식입니다. 실제 자리는 기사 방문 시 확정됩니다.",
    "system": {
     "indoor": "천장 매립형. 방 중앙 또는 출입문 반대편 천장에 설치하고 점검구를 함께 냅니다.",
     "outdoorHouse": "실외기 1대를 외벽 앵글 또는 지상·옥상에 두고 모든 실내기 배관을 모읍니다.",
     "outdoorApt": "실외기 1대를 베란다 또는 실외기실에 두고 모든 실내기 배관을 한 경로로 모읍니다.",
     "pipe": "천장 속으로 냉매 배관과 드레인 배관을 지나 실외기까지 연결합니다. 드레인 기울기 확보가 필요합니다.",
     "cautionLiving": "천장 작업이라 가구를 옮기고 바닥·벽을 보양한 뒤 진행합니다.",
     "cautionEmpty": "입주 전 설치라 천장 마감과 부분 도배를 같은 날 끝낼 수 있습니다.",
     "overall": "시스템 에어컨 구성은 실외기 1대로 {n}개 공간을 냉방해 베란다 공간을 아끼고 외관이 깔끔합니다. 천장고와 점검구 위치는 방문 전 사진으로 확인하면 범위를 좁힐 수 있습니다.",
     "tips": ["천장 속 배관 경로를 짧게 잡으려면 실외기와 가까운 방부터 배치합니다.", "여러 대 동시 가동 시 전력 여유가 필요해 전용 전기 작업 옵션을 권합니다."]
    },
    "normal": {
     "indoorStand": "베란다 쪽 벽면 옆, 콘센트와 배수가 가까운 자리",
     "indoorWall": "창문 위쪽 벽 상단, 침대 머리맡을 피한 위치",
     "outdoorHouse": "외벽 앵글 또는 지상 받침대. 소음이 침실로 들어오지 않는 면",
     "outdoorAptStand": "거실 앞 베란다 바닥 또는 실외기실",
     "outdoorAptWall": "방 쪽 베란다 바닥, 거실 실외기와 나란히",
     "pipeHouse": "외벽 타공 후 외부 배관 {min}~{max}m, 배관 커버 마감",
     "pipeApt": "베란다 벽 타공 또는 매립 배관 이용, 배관 5m 기본 포함 (초과분 1m당 추가)",
     "cautionLiving": "가구를 옮기고 바닥·벽을 보양한 뒤 작업합니다.",
     "cautionEmpty": "입주 전 설치라 배관 자리 부분 도배까지 같은 날 마감할 수 있습니다.",
     "overallHouse": "주택은 실외기 자리와 배관 경로가 집마다 달라 방문 전 외벽 사진을 받으면 범위를 좁힐 수 있습니다.",
     "overallApt": "아파트는 세대 배관 구조가 비슷해 기본 설치비 범위 안에서 대부분 마무리됩니다.",
     "tips": ["실외기 여러 대는 같은 베란다에 나란히 두면 배관이 짧아집니다.", "전용 콘센트가 없으면 전기 작업 옵션이 필요합니다."]
    }
   },
   "pages": {
    "shop": {
     "eyebrow": "상가·사무실 설치 견적 · 구매 + 설치",
     "title": "매장과 사무실 설치, 브랜드별 총액을 바로 봅니다",
     "desc": "건물 형태, 설치 대수와 평수, 영업 여부, 추가 옵션을 입력하면 삼성·LG·캐리어 제품으로 설치까지 한 총액을 비교해 드립니다. 3대 이상은 시스템 에어컨(천장형 + 실외기 1대)으로 계산합니다."
    },
    "install": {
     "eyebrow": "설치 견적 · 구매 + 신규 설치",
     "title": "설치 조건만 고르면 브랜드별 총액이 바로 나옵니다",
     "desc": "거주 형태, 설치 대수와 평수, 주소, 거주 여부, 추가 옵션을 입력하면 삼성·LG·캐리어 제품으로 설치까지 한 총액을 비교해 드립니다. 3대 이상은 시스템 에어컨(천장형 + 실외기 1대)으로 계산합니다."
    },
    "clean": {
     "eyebrow": "청소 견적 · 분해 세척",
     "title": "기종과 대수를 고르면 청소 금액이 바로 나옵니다",
     "desc": "냄새·곰팡이, 여름 전 정기 세척. 실내기 완전 분해 세척 기준이고 실외기 세척과 송풍팬 분해는 옵션으로 더합니다. 3대부터 10% 할인입니다."
    },
    "gas": {
     "eyebrow": "냉매 충전 견적",
     "title": "찬 바람이 약하면 냉매부터 확인합니다",
     "desc": "기종, 냉매 종류, 제조 연도를 고르면 출장 점검비와 충전 비용이 바로 나옵니다. 누설이 있으면 부위를 찾아 용접한 뒤 충전하며, 그 비용은 범위로 함께 보여 드립니다."
    },
    "move": {
     "eyebrow": "이전/설치 견적 · 철거 + 운반 + 재설치",
     "title": "이사할 때 떼고, 새집에 다시 답니다",
     "desc": "기종, 대수, 이동 거리, 도착지 조건을 고르면 철거비·운반비·재설치비가 항목별로 나옵니다. 배관 5m, 기존 위치 철거가 기본에 포함됩니다."
    },
    "rental": {
     "eyebrow": "에어컨 렌탈 · 설치비 0원, 월 렌탈료만",
     "title": "목돈 없이 설치하고, 관리는 속시원이 맡습니다",
     "desc": "기종과 평수, 약정 기간, 관리 서비스를 고르면 브랜드별 월 렌탈료가 바로 나옵니다. 설치비와 설치 하자 보증이 렌탈료에 포함되고, 약정이 끝나면 제품은 고객 소유가 됩니다."
    },
    "business": {
     "eyebrow": "기업 전용 문의",
     "title": "설치 내용을 적어 카카오톡이나 메일로 보내 주세요",
     "desc": "사무실, 매장, 학원, 임대 건물처럼 여러 대를 한 번에 설치·청소·관리해야 하는 기업과 소상공인을 위한 창구입니다. 아래에 현장과 설치 내용을 적으면 문의서가 자동으로 만들어지고, 카카오톡 채널 또는 메일로 바로 보낼 수 있습니다. 담당자가 영업일 기준 1일 안에 다량 견적서로 회신합니다."
    },
    "prices": {
     "eyebrow": "가격 안내",
     "title": "설치·청소·충전 단가표 전체 공개",
     "desc": "모든 견적 페이지는 아래 단가로 계산합니다. 부가세 별도 참고가이며, 현장 조건에 따라 범위 안에서 확정됩니다. 배관은 1m 단위로 계산합니다."
    }
   },
   "priceLabels": {
    "base": "신규 설치 기본 (배관 5m 포함)",
    "moveBase": "이전 설치 기본 (배관 별도)",
    "remove": "기존 에어컨 철거",
    "pipePerM": "배관 (1m당)",
    "pipeReplace": "매립 배관 교체·연결",
    "angle": "실외기 앵글",
    "clean": "분해 청소 (1대)",
    "fan": "송풍팬 완전 분해",
    "gasFill": "냉매 충전 (수리·충전 방문)",
    "gas": "냉매 보충 (설치 시 긴 배관 분)",
    "paper": "부분 도배 마감",
    "protect": "거주 중 가구 이동·보양",
    "ceilIndoor": "천장형 실내기 설치 (1대)",
    "ceilHatch": "천장 타공 + 드레인 배관 (1대)",
    "ceilOutdoor": "시스템 실외기 1대 설치 (실내기 공용)",
    "ceilClean": "천장형 분해 청소 (1대)",
    "ceilProtect": "거주 중 천장 작업 보양 (1대)",
    "ceilPaper": "실크 도배 마감 (시스템 설치 시 필수)",
    "ceilGas": "냉매 추가 충전 (긴 배관 분)",
    "hole": "타공 (1곳)",
    "elec": "전용 전기 작업",
    "ladder": "사다리차·스카이차 (4시간)",
    "outdoorClean": "실외기 청소 (대당)",
    "visit": "수리·충전 출장 점검비",
    "leakCheck": "누설 점검·용접",
    "oldPart": "구형 모델 부품 수급 가산",
    "regionOut": "인접 지역 출장 가산",
    "dist": "운반 (같은 시·군 / 다른 시·도)",
    "floor": "층수 가산 (3~5층 / 6층 이상)",
    "multiDiscount": "동시 설치 할인",
    "cleanDiscount": "청소 다량 할인",
    "housePipe": "주택 배관 연장",
    "seasonFactor": "성수기 계수 (6~8월)",
    "gasFactor": "냉매 종류 계수"
   },
   "promises": [
    {
     "title": "단가 사전 공개",
     "desc": "기본 설치비와 모든 추가 항목 단가를 이 페이지에 공개합니다."
    },
    {
     "title": "추가 비용 사전 동의",
     "desc": "견적에 없던 항목은 사유와 금액을 안내한 뒤 고객이 동의해야만 진행합니다."
    },
    {
     "title": "설치 하자 1년 보증",
     "desc": "소비자분쟁해결기준에 맞춰 회사가 직접 보증합니다. 제품 하자는 제조사 보증을 따릅니다."
    },
    {
     "title": "검증된 기사",
     "desc": "심사를 거치고 배상 보험에 가입한 제휴 기사만 배정합니다."
    }
   ],
   "steps": [
    {
     "title": "견적 확인",
     "desc": "조건을 고르면 항목별 예상 금액이 바로 나옵니다. 회원가입이 없습니다."
    },
    {
     "title": "예약 신청",
     "desc": "희망 일자와 주소, 연락처를 남기면 접수가 끝납니다."
    },
    {
     "title": "기사 배정",
     "desc": "지역의 제휴 설치 기사에게 알림이 가고, 수락한 기사 정보를 문자로 안내합니다."
    },
    {
     "title": "방문 시공",
     "desc": "구매 건은 회사 재고에서 제품이 나갑니다. 견적 외 비용이 생기면 사유와 금액을 먼저 안내하고 동의 후 진행합니다."
    },
    {
     "title": "결제·후기·A/S",
     "desc": "시공 완료 후 결제합니다. 설치 하자는 회사가 1년간 보증합니다."
    }
   ],
   "faq": [
    {
     "q": "견적 금액이 왜 범위로 나오나요?",
     "a": "배관 길이, 벽 두께, 실외기 자리처럼 현장에서만 확인되는 변수가 있어서입니다. 설치 자리 사진을 보내 주시면 범위를 좁혀 드립니다."
    },
    {
     "q": "현장에서 추가 비용이 생기면 어떻게 되나요?",
     "a": "기사가 사유와 금액을 먼저 안내하고, 고객님이 동의한 경우에만 진행합니다. 동의하지 않으면 기본 작업만 진행하거나 일정을 다시 잡습니다."
    },
    {
     "q": "어느 지역에서 이용할 수 있나요?",
     "a": "1차 서비스 지역에서 먼저 운영합니다. 인접 지역은 출장 가산이 붙고, 지역은 순차적으로 넓힐 예정입니다."
    },
    {
     "q": "A/S는 누가 책임지나요?",
     "a": "설치 하자(누수, 냉매 누설, 고정 불량 등)는 회사가 1년간 보증합니다. 제품 자체 하자는 제조사 보증으로 처리하며 접수를 도와 드립니다."
    },
    {
     "q": "계약금이 필요한가요?",
     "a": "현재는 계약금 없이 예약 접수만 받고 시공 후 결제합니다. 온라인 결제는 다음 단계에서 도입합니다."
    }
   ]
  };

/* ---------- 관리자 설정 덮어쓰기 ----------
   data/config.js 가 window.SSW_CONFIG = {site, rates, brands, rent} 를 넣어 주면 기본값 위에 덮어씁니다.
   관리자 페이지의 "미리보기"는 localStorage 초안을 이 탭에서만 적용합니다. */
const isObj = v => !!v && typeof v==='object' && !Array.isArray(v);
function deepMerge(base, over){
  if(!isObj(base) || !isObj(over)) return over===undefined ? base : over;
  const out = Object.assign({}, base);
  for(const k of Object.keys(over)) out[k] = (isObj(base[k]) && isObj(over[k])) ? deepMerge(base[k], over[k]) : over[k];
  return out;
}
let PREVIEW=false;
try{
  const q=new URLSearchParams(location.search).get('preview');
  if(q==='1') sessionStorage.setItem('ssw_preview','1'); if(q==='0') sessionStorage.removeItem('ssw_preview');
  PREVIEW = sessionStorage.getItem('ssw_preview')==='1';
}catch(e){}
let CFG = isObj(window.SSW_CONFIG) ? window.SSW_CONFIG : {};
if(PREVIEW){ try{ const d=JSON.parse(localStorage.getItem('ssw_preview_cfg')||'null'); if(isObj(d)) CFG=d; }catch(e){} }
const RATES  = deepMerge(RATES_DEFAULT, isObj(CFG.rates)?CFG.rates:{});
const BRANDS = (Array.isArray(CFG.brands) && CFG.brands.length) ? CFG.brands : BRANDS_DEFAULT;
const RENT   = deepMerge(RENT_DEFAULT, isObj(CFG.rent)?CFG.rent:{});
const SITE   = deepMerge(SITE_DEFAULT, isObj(CFG.site)?CFG.site:{});
/* 예전 기본값으로 저장된 첫 화면 메뉴 이름은 새 이름으로 읽음 (관리자 페이지에서 다시 저장하면 그 값 우선) */
if(SITE.home && SITE.home.menu && SITE.home.menu.install && SITE.home.menu.install.title==='설치 견적 내기') SITE.home.menu.install.title='가정용 설치 견적 내기';
if(SITE.priceLabels && SITE.priceLabels.ceilHatch==='천장 점검구·타공 + 드레인 배관 (1대)') SITE.priceLabels.ceilHatch='천장 타공 + 드레인 배관 (1대)';
if(SITE.priceLabels && SITE.priceLabels.base==='신규 설치 기본 (배관 별도)') SITE.priceLabels.base='신규 설치 기본 (배관 5m 포함)';
if(SITE.priceLabels && SITE.priceLabels.outdoorClean==='실외기 세척 (1대)') SITE.priceLabels.outdoorClean='실외기 청소 (대당)';

/* 시스템 에어컨 실외기 선택: 실내기 냉방 용량 합(평수 × 0.4kW)에 맞는 가장 작은 멀티 실외기. 조합률 130%까지 허용 */
const kwOfPy = py => Math.round(py*0.4*10)/10;
function pickOutdoor(brand, pys, key){
  const list = brand.models[key||'outdoors'];
  if(!Array.isArray(list) || !list.length) return brand.models.outdoor ? {name:brand.models.outdoor[0], price:brand.models.outdoor[1], kw:0} : null;
  const need = pys.reduce((a,p)=>a+kwOfPy(p),0);
  const sorted = list.slice().sort((a,b)=>a.kw-b.kw);
  return sorted.find(o=>o.kw*1.3>=need) || sorted[sorted.length-1];
}
/* 브랜드 로고: brand.logo(이미지 주소)가 있으면 <img>, 없으면 브랜드 색 글자 배지 */
const BRAND_STYLE = { samsung:{text:'SAMSUNG',bg:'#1428A0',fg:'#fff',font:'700 .62rem/1 "IBM Plex Sans KR",Arial,sans-serif',pad:'0 7px',radius:'4px',ls:'.02em'},
  lg:{text:'LG',bg:'#A50034',fg:'#fff',font:'800 .78rem/1 Arial,sans-serif',pad:'0',radius:'50%',w:'26px'},
  carrier:{text:'Carrier',bg:'#0A3D91',fg:'#fff',font:'italic 700 .68rem/1 Arial,sans-serif',pad:'0 7px',radius:'4px'} };
function brandLogo(b){
  if(b && b.logo) return '<img class="blogo" src="'+esc(b.logo)+'" alt="'+esc(b.name||'')+' 로고">';
  const st = BRAND_STYLE[b && b.id] || {text:String((b&&b.name)||'?').slice(0,2), bg:'var(--accent)', fg:'#fff', font:'700 .7rem/1 "IBM Plex Sans KR",sans-serif', pad:'0 6px', radius:'4px'};
  return '<span class="blogo badge-logo" style="background:'+st.bg+';color:'+st.fg+';font:'+st.font+';padding:'+st.pad+';border-radius:'+st.radius+(st.w?';width:'+st.w+';min-width:'+st.w:'')+(st.ls?';letter-spacing:'+st.ls:'')+'" aria-hidden="true">'+esc(st.text)+'</span>';
}
const getPath = (o,p) => p.split('.').reduce((a,k)=>(a==null?undefined:a[k]), o);

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
  return '<div class="lines">'+items.map(it=>'<div class="line"><span class="k">'+esc(it.label)+'</span><span class="v num">'+(it.info?esc(it.info):rangeText(it.r[0],it.r[1]))+'</span></div>').join('')+
    (total?'<div class="line tot"><span class="k">'+esc(totalLabel||'총액')+'</span><span class="v num">'+rangeText(total[0],total[1])+'</span></div>':'')+'</div>';
}

/* 모의 설치 플랜 문구 (설치·상가 견적 공통). 관리자 > 설치 플랜에서 수정. {n}=대수, {min}·{max}=주택 추가 배관 길이 */
function planFrom(inp, sys, typeOf){
  const P=SITE.plan||{}, house=inp.home==='house', living=inp.occupied==='living';
  const fill=s=>String(s||'').split('{n}').join(inp.units.length).split('{min}').join(RATES.housePipe[0]).split('{max}').join(RATES.housePipe[1]);
  if(sys){ const q=P.system||{}; return { units: inp.units.map(u=>({room:u.room, kind:'천장형 '+u.py+'평', indoor:fill(q.indoor), outdoor:fill(house?q.outdoorHouse:q.outdoorApt), pipe:fill(q.pipe), caution:fill(living?q.cautionLiving:q.cautionEmpty)})), overall:fill(q.overall), tips:(q.tips||[]).map(fill).filter(Boolean) }; }
  const q=P.normal||{};
  return { units: inp.units.map(u=>{ const t=typeOf(u.py); return {room:u.room, kind:TYPE_LABEL[t]+' '+u.py+'평', indoor:fill(t==='stand'?q.indoorStand:q.indoorWall), outdoor:fill(house?q.outdoorHouse:(t==='stand'?q.outdoorAptStand:q.outdoorAptWall)), pipe:fill(house?q.pipeHouse:q.pipeApt), caution:fill(living?q.cautionLiving:q.cautionEmpty)}; }), overall:fill(house?q.overallHouse:q.overallApt), tips:(q.tips||[]).map(fill).filter(Boolean) };
}

/* ---------- 로고 ---------- */
const LOGO_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="2" width="44" height="44" rx="12" fill="var(--accent)"/><path d="M12 17h18a4 4 0 1 1-3 6.7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M12 25h22a4.5 4.5 0 1 0-3.4-7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".55"/><path d="M12 33h12a3.5 3.5 0 1 1-2.6 5.8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>';
const NAV = [['install.html','설치 견적'],['shop.html','상가·사무실'],['clean.html','청소 견적'],['gas.html','냉매 충전'],['move.html','이전·설치'],['business.html','기업 문의']];
function mountChrome(){
  const here = location.pathname.split('/').pop() || 'index.html';
  const top = document.querySelector('header.top');
  /* 상단: 로고 + 카테고리 버튼. 버튼을 누르면 견적 종류 목록이 펼쳐짐 (이름은 관리자 > 첫 화면 > 아이콘 이름) */
  const c = SITE.contact;
  const kakaoHref = c.kakaoChat || '#', telHref = c.phone ? 'tel:'+String(c.phone).replace(/[^0-9+]/g,'') : '#';
  const CAT = [['install','install.html'],['shop','shop.html'],['move','move.html'],['clean','clean.html'],['gas','gas.html'],['business','business.html']];
  const CAT_ICON = {"install":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"9\" rx=\"2\"/><path d=\"M7 14v3M17 14v3M9 10h6\"/></svg>","shop":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 10l1.5-5h15L21 10\"/><path d=\"M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0\"/><path d=\"M5 12v8h14v-8\"/><path d=\"M10 20v-5h4v5\"/></svg>","move":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 8h8v8H3zM11 11h5l3 3v2h-8\"/><circle cx=\"6.5\" cy=\"18\" r=\"1.5\"/><circle cx=\"16.5\" cy=\"18\" r=\"1.5\"/></svg>","clean":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"2.5\"/><path d=\"M12 9.5c0-4 2-6 4-6 1.5 0 2 1.5 1 3-1 1.2-3 1.8-5 3zM14.5 12c4 0 6 2 6 4 0 1.5-1.5 2-3 1-1.2-1-1.8-3-3-5zM12 14.5c0 4-2 6-4 6-1.5 0-2-1.5-1-3 1-1.2 3-1.8 5-3zM9.5 12c-4 0-6-2-6-4 0-1.5 1.5-2 3-1 1.2 1 1.8 3 3 5z\"/></svg>","gas":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M10 3h4v3h-4zM8 6h8v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z\"/><path d=\"M8 13h8M12 13v6\"/></svg>","business":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11\"/><path d=\"M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1\"/></svg>"};
  if(top){
    const items = CAT.filter(([k])=>!(SITE.home.menu[k] && SITE.home.menu[k].show===false)).map(([k,h])=>'<a href="'+h+'"'+(h===here?' aria-current="page"':'')+'><span class="ci">'+CAT_ICON[k]+'</span>'+esc((SITE.home.quick||{})[k]||k)+'</a>').join('');
    const topItems = CAT.filter(([k])=>!(SITE.home.menu[k] && SITE.home.menu[k].show===false)).map(([k,h])=>'<a href="'+h+'"'+(h===here?' aria-current="page"':'')+'>'+esc((SITE.home.quick||{})[k]||k)+'</a>').join('');
    top.innerHTML = '<div class="in"><a class="logo" href="index.html"><img src="img/logo-word.png" alt="'+esc(SITE.brand.name)+'" width="862" height="302" decoding="async"></a>'+
      '<nav class="top-nav" aria-label="견적 종류">'+topItems+'</nav><button class="cat-btn" type="button" aria-expanded="false" aria-controls="cat-menu"><span class="ic-open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span><span class="ic-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></span><span>카테고리</span></button></div>'+
      '<nav class="cat-menu" id="cat-menu" aria-label="견적 종류" hidden><div class="in">'+items+'</div></nav>';
    const btn = top.querySelector('.cat-btn'), menu = top.querySelector('.cat-menu');
    const setOpen = o => { menu.hidden = !o; btn.setAttribute('aria-expanded', o?'true':'false'); top.classList.toggle('cat-open', o); };
    btn.addEventListener('click', ()=>setOpen(menu.hidden));
    document.addEventListener('click', e=>{ if(!menu.hidden && !top.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !menu.hidden) setOpen(false); });
  }
  const foot = document.querySelector('footer');
  if(foot && !foot.innerHTML.trim()) foot.innerHTML =
    '<div class="f-in"><div class="f-brand">'+esc(SITE.brand.name)+'</div>'+
    '<div class="f-grid">'+
      '<div class="f-biz">'+(bizLine()||'상호, 대표, 사업자등록번호, 통신판매업 신고번호, 주소는 확정 후 표기')+(SITE.biz.footerNote?'<br>'+esc(SITE.biz.footerNote):'')+'</div>'+
      '<div class="f-contact"><b>고객센터 <span class="num">'+esc(c.phone||'')+'</span></b>카카오톡 채널 <span class="k">'+esc(c.kakaoId||'')+'</span>'+(c.bizEmail?'<br>기업 문의 <span class="k">'+esc(c.bizEmail)+'</span>':'')+'</div>'+
      '<div class="links"><a href="index.html">홈</a>'+NAV.map(([h,l])=>'<a href="'+h+'">'+l+'</a>').join('')+'<a href="admin.html">관리자</a></div>'+
    '</div>'+
    '<div class="copy">Copyright © <em>'+esc(SITE.brand.name)+'</em>. All rights reserved.</div></div>';
  /* 오른쪽 아래 떠 있는 카카오톡·전화 버튼 (링크는 관리자 연락처 값) */
  const qk = document.createElement('div'); qk.className='quick'; qk.setAttribute('aria-label','빠른 문의');
  qk.innerHTML = '<a class="kakao" href="'+esc(kakaoHref)+'"'+(kakaoHref!=='#'?' target="_blank" rel="noopener"':'')+' aria-label="카카오톡 상담"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.2 4.6 6.6L5.5 21l4.3-2.6c.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg><span>카카오톡</span></a>'+
    '<a class="tel" href="'+esc(telHref)+'" aria-label="전화 상담"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><span>전화</span></a>';
  document.body.appendChild(qk);
  /* 맨 위로 버튼 */
  const up = document.createElement('button'); up.type='button'; up.className='totop'; up.setAttribute('aria-label','맨 위로');
  up.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  up.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));
  document.body.appendChild(up);
  const onScroll = ()=>up.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  applySite();
  if(PREVIEW){ const b=document.createElement('div'); b.className='preview-bar'; b.innerHTML='<span>관리자 미리보기 모드 · 저장 전 초안이 이 탭에만 보입니다</span><a href="admin.html?preview=0">관리자로</a><a href="index.html?preview=0">종료</a>'; document.body.appendChild(b); }
}
function bizLine(){
  const b=SITE.biz; const parts=[];
  if(b.company) parts.push('상호 '+esc(b.company)); if(b.ceo) parts.push('대표 '+esc(b.ceo)); if(b.regNo) parts.push('사업자등록번호 '+esc(b.regNo));
  if(b.mailOrderNo) parts.push('통신판매업 '+esc(b.mailOrderNo)); if(b.address) parts.push(esc(b.address)); if(SITE.contact.phone) parts.push('상담 '+esc(SITE.contact.phone));
  return parts.join(' · ');
}
/* data-t="경로" 요소의 글자를 설정값으로, data-menu 카드는 표시 여부 반영 */
function applySite(){
  document.querySelectorAll('[data-t]').forEach(el=>{ const v=getPath(SITE, el.dataset.t); if(typeof v!=='string') return; if(v.includes('\n')) el.innerHTML=esc(v).replace(/\n/g,'<br>'); else el.textContent=v; });
  document.querySelectorAll('[data-menu]').forEach(el=>{ const m=SITE.home.menu[el.dataset.menu]; if(m && m.show===false) el.hidden=true; });
  if(SITE.brand.name && SITE.brand.name!=='속시원') document.title=document.title.replace('속시원', SITE.brand.name);
}

/* 서버 접수: 카페24(PHP)에서는 admin/api.php 가 admin/store 에 저장해 관리자 페이지에 바로 뜸. PHP가 없는 곳(GitHub Pages)에서는 조용히 실패하고 로컬 저장만 남음 */
function sendToServer(action, data){
  const ctrl = typeof AbortController!=='undefined' ? new AbortController() : null; if(ctrl) setTimeout(()=>ctrl.abort(), 8000);
  return fetch('admin/api.php?action='+action, {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','X-Requested-With':'SSW'}, body:JSON.stringify(data), signal: ctrl?ctrl.signal:undefined})
    .then(r=>r.text()).then(t=>{ try{ return JSON.parse(t); }catch(e){ return null; } });
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
    if(addr.replace(/\s+/g,'').length<4) problems.push('방문 주소');
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
    const btn=document.querySelector('#book-form button[type=submit]'); if(btn){ btn.disabled=true; btn.textContent='접수 중…'; }
    sendToServer('book', {booking:b}).then(r=>{ if(r&&r.ok){ b.server=true; b.id=r.id||b.id; } }).catch(()=>{}).finally(()=>{ this.showDone(b); });
  },
  showDone(b){
    $('book-form').hidden=true; const d=$('book-done'); d.hidden=false;
    const row=(k,v)=>'<div class="row"><span>'+k+'</span><span>'+v+'</span></div>';
    d.innerHTML=
      '<div class="notice">예약이 접수되었습니다. 접수번호 '+esc(b.id)+' · 담당자가 확인한 뒤 '+esc(b.customer.phone)+'로 연락드립니다.</div>'+
      '<div class="alarm"><div class="hd"><span>접수 내용</span><span class="tag acc">접수 완료</span></div><div class="bd">'+
        row('작업',esc(b.svcLabel)+' · '+esc(b.summary))+
        (b.models.length?row('제품',esc(b.models.join(', '))):'')+
        row('방문 주소',esc(b.customer.addr)+' '+esc(b.customer.addr2))+
        row('희망 일자',fmtDate(b.customer.date)+' '+esc(b.customer.slot))+
        row('예상 금액','<b class="num">'+rangeText(b.total[0],b.total[1])+'</b>')+
        (b.customer.memo?row('요청 사항',esc(b.customer.memo)):'')+
      '</div></div>'+
      '<p class="small muted">견적에 없던 항목은 현장에서 사유와 금액을 먼저 안내하고 동의 후에만 진행합니다.</p>'+
      '<a class="btn block" href="index.html">처음으로</a>';
  }
};

window.SSW = {TYPE_LABEL, RATES, BRANDS, RENT, SITE, CFG, PREVIEW, sendToServer, planFrom, DEFAULTS:{rates:RATES_DEFAULT, brands:BRANDS_DEFAULT, rent:RENT_DEFAULT, site:SITE_DEFAULT}, deepMerge, getPath, kwOfPy, pickOutdoor, brandLogo, $, won, manWon, rangeText, rangeShort, mul, add, sumItems, radio, esc, isPeak, load, save, fmtDate, regionOnly, plusDays, applySeason, linesHtml, Booking, LOGO_SVG};
document.addEventListener('DOMContentLoaded', mountChrome);
/* 시작 화면은 각 페이지 <head>의 스크립트와 css(html.splash-on)가 처리. 화면을 누르면 바로 닫습니다 */
document.addEventListener('click', ()=>document.documentElement.classList.remove('splash-on'), {once:true});
})();
