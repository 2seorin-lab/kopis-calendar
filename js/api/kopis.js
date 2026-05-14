const API_KEY = '80b12b1c7643456fa29cdc8fc0164e95'; 

/**
 * KOPIS에서 특정 달의 공연 목록을 가져옴
 * @param {number} year - 연도 (예: 2026) //param이란 함수의 매개변수를 설명하는 주석입니다. year는 숫자형으로 연도를 나타냅니다.
 * @param {number} month - 월 (0~11, JS Date 방식)
 * @returns {Promise<Array>} 공연 객체 배열
 */


/**
 * 특정 공연의 상세 정보를 가져옴
 * @param {string} id - 공연 ID (예: 'PF253123')
 */
export async function fetchPerformanceDetail(id) {
  const apiUrl =
    `http://www.kopis.or.kr/openApi/restful/pblprfr/${id}` +
    `?service=${API_KEY}`;

  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);

  const response = await fetch(proxyUrl);
  const xmlText = await response.text();
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const db = doc.querySelector('db');
  if (!db) return null;

  // 예매처 목록은 여러 개일 수 있어서 따로 처리
  const relates = [...db.querySelectorAll('relates relate')].map(r => ({
    name: getText(r, 'relatenm'),
    url:  getText(r, 'relateurl'),
  }));

  return {
    id,
    name:        getText(db, 'prfnm'),
    from:        getText(db, 'prfpdfrom'),
    to:          getText(db, 'prfpdto'),
    place:       getText(db, 'fcltynm'),
    cast:        getText(db, 'prfcast'),       // 출연
    crew:        getText(db, 'prfcrew'),       // 제작진
    runtime:     getText(db, 'prfruntime'),    // 관람시간
    age:         getText(db, 'prfage'),        // 관람연령
    producer:    getText(db, 'entrpsnm'),      // 기획제작
    price:       getText(db, 'pcseguidance'),  // 티켓가격
    poster:      getText(db, 'poster'),
    story:       getText(db, 'sty'),           // 줄거리
    schedule:    getText(db, 'dtguidance'),    // 공연시간 안내
    genre:       getText(db, 'genrenm'),
    state:       getText(db, 'prfstate'),
    area:        getText(db, 'area'),
    relates,                                    // 예매처 배열
  };
}


export async function fetchPerformances(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);

  const apiUrl =
    `http://www.kopis.or.kr/openApi/restful/pblprfr` +
    `?service=${API_KEY}` +
    `&stdate=${toYmd(first)}` +
    `&eddate=${toYmd(last)}` +
    `&cpage=1&rows=100`;

  // CORS 우회용 프록시
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);

  const response = await fetch(proxyUrl);
  const xmlText = await response.text();
  console.log('📦 raw 응답:', xmlText);

  // XML 문자열을 트리 구조로 파싱
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const items = [...doc.querySelectorAll('db')];

  // 필요한 정보만 추려서 깔끔한 객체로 변환
  return items.map(it => ({
    id:     getText(it, 'mt20id'),
    name:   getText(it, 'prfnm'),
    from:   getText(it, 'prfpdfrom'),  // "2026.05.01" 형태
    to:     getText(it, 'prfpdto'),
    place:  getText(it, 'fcltynm'),
    genre:  getText(it, 'genrenm'),
    age:    getText(it, 'prfage'),
    poster: getText(it, 'poster'),
    area:   getText(it, 'area'),
  }));
}

// 헬퍼: Date를 "20260501" 형태 문자열로
function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// 헬퍼: XML 노드에서 특정 태그의 텍스트 꺼내기
function getText(node, tagName) {
  return node.querySelector(tagName)?.textContent ?? '';
}

// "2026.05.01" → Date 객체로 변환 (다른 파일에서도 쓸 거라 export)
export function parseKopisDate(str) {
  const [y, m, d] = str.split('.').map(Number);
  return new Date(y, m - 1, d);
}
