import { createCalendar } from './components/calendar.js';
import { createSidebar } from './components/sidebar.js';
import { createModal } from './components/modal.js';
import { fetchPerformances, fetchPerformanceDetail } from './api/kopis.js';

const GENRE_CODE_TO_NAME = {
  AAAA: '연극',
  GGGA: '뮤지컬',
  CCCA: '서양음악(클래식)',
  CCCC: '한국음악(국악)',
  CCCD: '대중음악',
  BBBC: '무용',
  EEEA: '복합',
  EEEB: '서커스/마술',
};

const modal = createModal();

let allPerformances = [];
let currentFilters = {
  search: '',
  genre: '',
  location: '',
  kidsOnly: false,
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isKidsPerformance(ageText) {
  return /아동|어린이|유아|가족/.test(ageText || '');
}

function getCityName(areaText) {
  return String(areaText || '').trim().split(/\s+/)[0] || '';
}

function applyFilters() {
  const search = normalizeText(currentFilters.search);
  const selectedGenre = GENRE_CODE_TO_NAME[currentFilters.genre] || '';
  const selectedLocation = currentFilters.location;

  const filtered = allPerformances.filter((performance) => {
    const matchesSearch =
      !search ||
      normalizeText(performance.name).includes(search) ||
      normalizeText(performance.place).includes(search);

    const matchesGenre =
      !selectedGenre || performance.genre === selectedGenre;

    const matchesLocation =
      !selectedLocation || getCityName(performance.area) === selectedLocation;

    const matchesKids =
      !currentFilters.kidsOnly || isKidsPerformance(performance.age);

    return matchesSearch && matchesGenre && matchesLocation && matchesKids;
  });

  calendar.setPerformances(filtered);
  console.log(`🎯 필터 적용 완료: ${filtered.length}개`);
}

const sidebar = createSidebar(document.querySelector('.sidebar'), {
  onChange: (filters) => {
    currentFilters = { ...filters };
    console.log('필터 변경됨:', currentFilters);
    applyFilters();
  }
});

const calendar = createCalendar(document.querySelector('.main-content'), {
  onMonthChange: async (year, month) => {
    try {
      allPerformances = await fetchPerformances(year, month);
      const cityOptions = [...new Set(
        allPerformances
          .map((performance) => getCityName(performance.area))
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, 'ko'));
      sidebar.setLocationOptions(cityOptions);
      console.log(`📅 ${year}년 ${month + 1}월 공연 ${allPerformances.length}개 로딩`);
      applyFilters();
    } catch (error) {
      console.error('공연 로딩 실패', error);
      allPerformances = [];
      applyFilters();
    }
  },

  onPerformanceClick: async (performance) => {
    modal.open('<p style="text-align:center;padding:40px;">⏳ 로딩 중...</p>');

    try {
      const detail = await fetchPerformanceDetail(performance.id);
      if (!detail) {
        modal.open('<p style="text-align:center;padding:40px;">상세 정보를 가져올 수 없어요.</p>');
        return;
      }

      modal.open(renderDetailHTML(detail));
    } catch (error) {
      console.error('상세 정보 로딩 실패', error);
      modal.open('<p style="text-align:center;padding:40px;">상세 정보를 불러오는 중 오류가 났어요.</p>');
    }
  }
});

function renderDetailHTML(d) {
  const rows = [
    ['공연기간', `${d.from} ~ ${d.to}`],
    ['공연장', d.place],
    ['공연시간', d.schedule],
    ['관람시간', d.runtime],
    ['관람연령', d.age],
    ['출연', d.cast],
    ['제작진', d.crew],
    ['기획제작', d.producer],
    ['티켓가격', d.price],
    ['장르', d.genre],
    ['지역', d.area],
    ['상태', d.state],
  ].filter(([_, value]) => value);

  return `
    <div class="detail">
      <div class="detail-top">
        <img src="${d.poster}" alt="" class="detail-poster"
             onerror="this.style.display='none'" />
        <div class="detail-meta">
          <h2>${d.name}</h2>
          <dl>
            ${rows.map(([label, value]) => `
              <div class="detail-row">
                <dt>${label}</dt>
                <dd>${value}</dd>
              </div>
            `).join('')}
          </dl>
        </div>
      </div>

      ${d.story ? `
        <div class="detail-section">
          <h3>줄거리</h3>
          <p>${d.story}</p>
        </div>
      ` : ''}

      ${d.relates.length > 0 ? `
        <div class="detail-section">
          <h3>예매처</h3>
          <ul class="detail-relates">
            ${d.relates.map((r) => `
              <li><a href="${r.url}" target="_blank">${r.name} →</a></li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}
