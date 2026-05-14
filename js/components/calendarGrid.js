import { createDayPerfList } from './dayPerfList.js';

export function createCalendarGrid({
  year,
  month,
  byDay,
  weatherByDay,
  getGenreColor,
  onPerformanceClick,
  onDayClick,
  onMoreClick,
}) {
  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  for (let i = 0; i < 42; i++) {
    const cell = document.createElement('div');
    cell.className = 'day';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    const dayMain = document.createElement('div');
    dayMain.className = 'day-main';

    let dayNum;
    let cellDate;
    let isOut = false;

    if (i < firstDay) {
      dayNum = daysInPrev - firstDay + i + 1;
      cellDate = new Date(year, month - 1, dayNum);
      cell.classList.add('out');
      isOut = true;
    } else if (i >= firstDay + daysInMonth) {
      dayNum = i - (firstDay + daysInMonth) + 1;
      cellDate = new Date(year, month + 1, dayNum);
      cell.classList.add('out');
      isOut = true;
    } else {
      dayNum = i - firstDay + 1;
      cellDate = new Date(year, month, dayNum);
    }

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = dayNum;
    dayHeader.appendChild(numEl);

    if (!isOut) {
      const weatherKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
      const weather = weatherByDay[weatherKey];

      if (weather) {
        const weatherEl = document.createElement('div');
        weatherEl.className = 'day-weather';
        weatherEl.innerHTML = `
          <span class="day-weather-icon">${weather.icon || '-'}</span>
          <span class="day-weather-temp">${weather.temp || '--'}</span>
        `;
        dayHeader.appendChild(weatherEl);
      }
    }

    cell.appendChild(dayHeader);

    if (!isOut) {
      const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
      const perfs = byDay[key] || [];

      cell.addEventListener('click', () => {
        onDayClick(cellDate, perfs);
      });

      const perfList = createDayPerfList({
        perfs,
        cellDate,
        getGenreColor,
        onPerformanceClick,
        onMoreClick,
      });

      dayMain.appendChild(perfList);
    }

    cell.appendChild(dayMain);
    grid.appendChild(cell);
  }

  return grid;
}
