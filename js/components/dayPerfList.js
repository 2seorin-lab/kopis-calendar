export function createDayPerfList({
  perfs,
  cellDate,
  getGenreColor,
  onPerformanceClick,
  onMoreClick,
}) {
  const wrap = document.createElement('div');
  wrap.className = 'day-perf-list';

  perfs.slice(0, 3).forEach((p) => {
    const item = document.createElement('div');
    item.className = 'perf-item';
    item.style.backgroundColor = getGenreColor(p.genre);
    item.textContent = p.name;
    item.title = `${p.name}\n@ ${p.place}\n${p.from} ~ ${p.to}`;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      onPerformanceClick(p);
    });

    wrap.appendChild(item);
  });

  if (perfs.length > 3) {
    const more = document.createElement('div');
    more.className = 'perf-more';
    more.textContent = `+ ${perfs.length - 3}개 더`;

    more.addEventListener('click', (e) => {
      e.stopPropagation();
      onMoreClick(cellDate, perfs);
    });

    wrap.appendChild(more);
  }

  return wrap;
}
