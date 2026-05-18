const WEATHER_API_KEY =
  '6Nrw9XYlsMRXPT9H4wIHN7ECnedPS%2B02RhYbUGf44u2jnQMK5E4RjPZmrg7kPoWrzLxzXqN%2BcFHoTSlKzakXKA%3D%3D';

const LAND_BASE_URL =
  'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';

const TEMP_BASE_URL =
  'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';

const DEFAULT_REGION = {
  landRegId: '11B00000',
  tempRegId: '11B10101',
};

export async function fetchLongTermWeather(
  year,
  month,
  { landRegId, tempRegId } = DEFAULT_REGION,
) {
  const tmFc = getLatestTmFc();

  const [landItem, tempItem] = await Promise.all([
    fetchMidLandForecast(landRegId, tmFc),
    fetchMidTemperatureForecast(tempRegId, tmFc),
  ]);

  const map = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const diff = getDayDiff(tmFc, date);

    if (diff < 4 || diff > 10) continue;

    const weather = summarizeLongTermWeather(diff, landItem, tempItem);
    if (!weather) continue;

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    map[key] = weather;
  }

  return map;
}

async function fetchMidLandForecast(regId, tmFc) {
  const apiUrl =
    `${LAND_BASE_URL}?serviceKey=${WEATHER_API_KEY}` +
    `&pageNo=1&numOfRows=10&dataType=JSON` +
    `&regId=${regId}&tmFc=${tmFc}`;

  const response = await fetchProxy(apiUrl);
  const data = await response.json();
  const items = data?.response?.body?.items?.item ?? [];

  if (!items.length) {
    throw new Error('중기 육상예보 데이터가 없습니다.');
  }

  return items[0];
}

async function fetchMidTemperatureForecast(regId, tmFc) {
  const apiUrl =
    `${TEMP_BASE_URL}?serviceKey=${WEATHER_API_KEY}` +
    `&pageNo=1&numOfRows=10&dataType=JSON` +
    `&regId=${regId}&tmFc=${tmFc}`;

  const response = await fetchProxy(apiUrl);
  const data = await response.json();
  const items = data?.response?.body?.items?.item ?? [];

  if (!items.length) {
    throw new Error('중기 기온 데이터가 없습니다.');
  }

  return items[0];
}

async function fetchProxy(apiUrl) {
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`날씨 API 요청 실패: ${response.status}`);
  }

  return response;
}

function summarizeLongTermWeather(diff, landItem, tempItem) {
  const label = pickLongTermLabel(diff, landItem);
  const min = tempItem[`taMin${diff}`];
  const max = tempItem[`taMax${diff}`];

  if (!label && min == null && max == null) {
    return null;
  }

  return {
    icon: pickLongTermIcon(label),
    label: label || '정보없음',
    temp: formatLongTermTemp(min, max),
  };
}

function pickLongTermLabel(diff, landItem) {
  if (diff <= 7) {
    return landItem[`wf${diff}Pm`] || landItem[`wf${diff}Am`] || null;
  }

  return landItem[`wf${diff}`] || null;
}

function pickLongTermIcon(label) {
  if (!label) return '-';
  if (label.includes('비') && label.includes('눈')) return '🌨️';
  if (label.includes('눈')) return '❄️';
  if (label.includes('비')) return '🌧️';
  if (label.includes('맑')) return '☀️';
  if (label.includes('구름많')) return '⛅';
  if (label.includes('흐')) return '☁️';
  return '🌤️';
}

function formatLongTermTemp(min, max) {
  if (min != null && max != null) return `${min}°/${max}°`;
  if (max != null) return `${max}°`;
  if (min != null) return `${min}°`;
  return '--';
}

function getLatestTmFc() {
  const now = new Date();
  const six = new Date(now);
  six.setHours(6, 0, 0, 0);

  const eighteen = new Date(now);
  eighteen.setHours(18, 0, 0, 0);

  let base = new Date(now);

  if (now >= eighteen) {
    base = eighteen;
  } else if (now >= six) {
    base = six;
  } else {
    base.setDate(base.getDate() - 1);
    base.setHours(18, 0, 0, 0);
  }

  return toCompactDateTime(base);
}

function getDayDiff(tmFc, date) {
  const baseDate = new Date(
    Number(tmFc.slice(0, 4)),
    Number(tmFc.slice(4, 6)) - 1,
    Number(tmFc.slice(6, 8)),
  );

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((targetDate - baseDate) / msPerDay);
}

function toCompactDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  return `${y}${m}${d}${hh}00`;
}
