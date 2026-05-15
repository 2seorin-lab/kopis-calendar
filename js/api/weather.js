const WEATHER_API_KEY =
  '6Nrw9XYlsMRXPT9H4wIHN7ECnedPS%2B02RhYbUGf44u2jnQMK5E4RjPZmrg7kPoWrzLxzXqN%2BcFHoTSlKzakXKA%3D%3D';

const BASE_URL =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

const DEFAULT_GRID = { nx: 60, ny: 127 }; // 서울

export async function fetchWeeklyWeather(year, month, { nx, ny } = DEFAULT_GRID) {  // 월별 날씨 맵과 달리, 주간 날씨는 달력 그릴 때마다 최신 정보로 불러오도록 함
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const targetDates = getFirstWeekDates(startDate, endDate);
  const latestBase = getLatestBaseDateTime();

  const apiUrl =
    `${BASE_URL}?serviceKey=${WEATHER_API_KEY}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${latestBase.baseDate}` +
    `&base_time=${latestBase.baseTime}` +
    `&nx=${nx}&ny=${ny}`;

  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`날씨 API 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item ?? [];

  return targetDates.map((date) => summarizeDayWeather(date, items));
}

export async function fetchMonthlyWeatherMap(year, month, { nx, ny } = DEFAULT_GRID) { // 월별 날씨 맵은 달력 그릴 때마다 불러오기엔 부담이 될 수 있어서, 월이 바뀔 때마다 한 번만 불러오도록 함
  const latestBase = getLatestBaseDateTime();

  const apiUrl = 
    `${BASE_URL}?serviceKey=${WEATHER_API_KEY}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${latestBase.baseDate}` +
    `&base_time=${latestBase.baseTime}` +
    `&nx=${nx}&ny=${ny}`;

  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl); // CORS 우회용 프록시
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`날씨 API 요청 실패: ${response.status}`);
  }

  const data = await response.json(); // API 응답에서 필요한 정보만 추려서 깔끔한 객체로 변환
  const items = data?.response?.body?.items?.item ?? [];  // API에서 받은 데이터는 시간대별로 쏟아지는데, 우리는 날짜별로 요약해서 보고 싶음. 그래서 날짜별로 날씨 정보를 요약하는 로직이 필요함.
  const map = {};

  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {  // 해당 월의 모든 날짜에 대해  
    const date = new Date(year, month, day);  // API에서 받은 시간대별 데이터를 날짜별로 요약해서 맵에 저장
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; // "2026-5-1" 같은 형태의 키
    map[key] = summarizeDayWeather(date, items); // summarizeDayWeather 함수는 해당 날짜에 해당하는 API 데이터를 찾아서 날씨 아이콘, 라벨, 온도 등을 요약해서 반환하는 함수. 이 함수 덕분에 달력에서 각 날짜마다 간단한 날씨 정보를 보여줄 수 있게 됨.
  }

  return map;
}

function getFirstWeekDates(startDate, endDate) {
  const dates = [];
  const firstWeekday = startDate.getDay();

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - firstWeekday + i);

    if (date < startDate || date > endDate) {
      dates.push(null);
      continue;
    }

    dates.push(date);
  }

  return dates;
}

function summarizeDayWeather(date, items) {
  if (!date) return null;

  const fcstDate = toCompactDate(date);
  const dayItems = items.filter((item) => item.fcstDate === fcstDate);

  if (!dayItems.length) {
    return {
      icon: '-',
      label: '정보없음',
      temp: '--',
    };
  }

  const tempItem = dayItems.find((item) => item.category === 'TMP' && item.fcstTime === '1200')
    || dayItems.find((item) => item.category === 'TMP');
  const skyItem = dayItems.find((item) => item.category === 'SKY' && item.fcstTime === '1200')
    || dayItems.find((item) => item.category === 'SKY');
  const ptyItem = dayItems.find((item) => item.category === 'PTY' && item.fcstTime === '1200')
    || dayItems.find((item) => item.category === 'PTY');

  const { icon, label } = pickWeatherDisplay( // 날씨 정보를 요약하여 아이콘과 라벨을 선택하는 함수. 강수형태(PTY)가 있으면 그걸 우선적으로 보고, 없으면 하늘상태(SKY)를 보고, 둘 다 없으면 기본값으로 맑음 아이콘을 보여줌.
    ptyItem?.fcstValue ?? '0',
    skyItem?.fcstValue ?? '1',
  );

  return {
    icon,
    label,
    temp: tempItem ? `${tempItem.fcstValue}°` : '--',
  };
}

function pickWeatherDisplay(pty, sky) {
  if (pty === '1') return { icon: '🌧️', label: '비' };
  if (pty === '2') return { icon: '🌨️', label: '비/눈' };
  if (pty === '3') return { icon: '❄️', label: '눈' };
  if (pty === '4') return { icon: '🌦️', label: '소나기' };
  if (sky === '1') return { icon: '☀️', label: '맑음' };
  if (sky === '3') return { icon: '⛅', label: '구름많음' };
  return { icon: '☁️', label: '흐림' };
}

function getLatestBaseDateTime() {
  const now = new Date();
  const slots = ['2300', '2000', '1700', '1400', '1100', '0800', '0500', '0200'];
  const hhmm = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  let baseDate = new Date(now);
  let baseTime = slots[slots.length - 1];

  for (const slot of slots) {
    if (hhmm >= slot) {
      baseTime = slot;
      return { baseDate: toCompactDate(baseDate), baseTime };
    }
  }

  baseDate.setDate(baseDate.getDate() - 1);
  return { baseDate: toCompactDate(baseDate), baseTime };
}

function toCompactDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
