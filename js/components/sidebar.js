const GENRE_OPTIONS = [
  { value: '', label: '전체 장르', color: '#ffffff' },
  { value: 'AAAA', label: '연극', color: '#c1c2f3' },
  { value: 'GGGA', label: '뮤지컬', color: '#e9accb' },
  { value: 'CCCA', label: '서양음악(클래식)', color: '#a0ddf9' },
  { value: 'CCCC', label: '한국음악(국악)', color: '#ddc2f7' },
  { value: 'CCCD', label: '대중음악', color: '#f59e0b' },
  { value: 'BBBC', label: '무용', color: '#14b8a6' },
  { value: 'EEEA', label: '복합', color: '#afb2b7' },
  { value: 'EEEB', label: '서커스/마술', color: '#f43f5e' },
];

export function createSidebar(container, options = {}) {
  // 부모가 넘겨주는 콜백 - 필터가 바뀔 때마다 호출됨
  const onChange = options.onChange || (() => {});
  let locationOptions = [];

  // 내부 상태 - 현재 선택된 필터들
  const filters = {
    search: '',
    genre: '',
    location: '',
    kidsOnly: false,
    // TODO: 나중에 region, priceMin, priceMax, prfstate 등 추가
  };

  // === HTML 그리기 ===
  container.innerHTML = `
    <div class="filter-group">
      <h3>🔍 검색</h3>
      <input type="text" class="filter-search" placeholder="공연명/극장 검색..." />
    </div>

    <div class="filter-group">
      <h3>🎨 장르</h3>
      <select class="filter-genre">
        ${GENRE_OPTIONS.map((option) => `
          <option value="${option.value}" data-color="${option.color}">
            ${option.label}
          </option>
        `).join('')}
      </select>
      <div class="genre-legend">
        ${GENRE_OPTIONS
          .filter((option) => option.value)
          .map((option) => `
            <button
              type="button"
              class="genre-chip"
              data-value="${option.value}"
              title="${option.label}"
            >
              <span class="genre-swatch" style="background-color: ${option.color};"></span>
              <span class="genre-label">${option.label}</span>
            </button>
          `).join('')}
      </div>
    </div>

    <div class="filter-group">
      <h3>📍 위치</h3>
      <select class="filter-location">
        <option value="">전체 시</option>
      </select>
    </div>

    <div class="filter-group">
      <h3>👶 옵션</h3>
      <label class="filter-check">
        <input type="checkbox" class="filter-kids" />
        <span>아동 공연만 보기</span>
      </label>
    </div>

    <button class="filter-reset">필터 초기화</button>
  `;

  // === 요소들 잡아두기 ===
  const $search = container.querySelector('.filter-search');
  const $genre  = container.querySelector('.filter-genre');
  const $location = container.querySelector('.filter-location');
  const $kids   = container.querySelector('.filter-kids');
  const $reset  = container.querySelector('.filter-reset');
  const $genreChips = [...container.querySelectorAll('.genre-chip')];

  function updateGenreSelectColor() {
    const selectedOption = $genre.selectedOptions[0];
    const color = selectedOption?.dataset.color || '#ffffff';
    $genre.style.setProperty('--genre-accent', color);
  }

  function updateGenreChipState() {
    $genreChips.forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.value === filters.genre);
    });
  }

  function renderLocationOptions() {
    $location.innerHTML = `
      <option value="">전체 시</option>
      ${locationOptions.map((location) => `
        <option value="${location}">${location}</option>
      `).join('')}
    `;
    $location.value = filters.location;
  }

  // === 이벤트 연결 ===
  $search.addEventListener('input', (e) => {
    filters.search = e.target.value;
    onChange(filters);  // 부모에게 알림!
  });

  $genre.addEventListener('change', (e) => {
    filters.genre = e.target.value;
    updateGenreSelectColor();
    updateGenreChipState();
    onChange(filters);
  });

  $genreChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const nextValue = chip.dataset.value;
      filters.genre = filters.genre === nextValue ? '' : nextValue;
      $genre.value = filters.genre;
      updateGenreSelectColor();
      updateGenreChipState();
      onChange(filters);
    });
  });

  $location.addEventListener('change', (e) => {
    filters.location = e.target.value;
    onChange(filters);
  });

  $kids.addEventListener('change', (e) => {
    filters.kidsOnly = e.target.checked;
    onChange(filters);
  });

  $reset.addEventListener('click', () => {
    filters.search = '';
    filters.genre = '';
    filters.location = '';
    filters.kidsOnly = false;
    $search.value = '';
    $genre.value = '';
    $location.value = '';
    $kids.checked = false;
    updateGenreSelectColor();
    updateGenreChipState();
    onChange(filters);
  });

  updateGenreSelectColor();
  updateGenreChipState();

  // === 외부에 노출할 API ===
  return {
    getFilters: () => ({ ...filters }),  // 현재 필터 복사본을 돌려줌
    setLocationOptions: (locations) => {
      locationOptions = [...locations];
      if (filters.location && !locationOptions.includes(filters.location)) {
        filters.location = '';
      }
      renderLocationOptions();
    },
  };
}
