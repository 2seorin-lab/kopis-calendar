const WEATHER_API_KEY =
  '6Nrw9XYlsMRXPT9H4wIHN7ECnedPS%2B02RhYbUGf44u2jnQMK5E4RjPZmrg7kPoWrzLxzXqN%2BcFHoTSlKzakXKA%3D%3D';

const BASE_URL =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

const DEFAULT_GRID = { nx: 60, ny: 127 }; // 서울

export async function fetchWeeklyWeather(year, month, { nx, ny } = DEFAULT_GRID) {
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

export async function fetchMonthlyWeatherMap(year, month, { nx, ny } = DEFAULT_GRID) {
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
  const map = {};

  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const date = new Date(year, month, day);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    map[key] = summarizeDayWeather(date, items);
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

  const { icon, label } = pickWeatherDisplay(
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
