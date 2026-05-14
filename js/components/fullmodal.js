export function createFullModal({ onItemClick = () => {} } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'fullmodal-overlay';

  overlay.innerHTML = `
    <div class="fullmodal">
      <button class="fullmodal-close" aria-label="닫기">×</button>
      <div class="fullmodal-header">
        <h2 class="fullmodal-title"></h2>
      </div>
      <div class="fullmodal-body"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const titleEl = overlay.querySelector('.fullmodal-title');
  const bodyEl = overlay.querySelector('.fullmodal-body');
  const closeBtn = overlay.querySelector('.fullmodal-close');

  function close() {
    overlay.classList.remove('show');
  }

  function open(date, perfs) {
    titleEl.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 공연`;

    bodyEl.innerHTML = '';

    if (!perfs.length) {
      bodyEl.innerHTML = `<p class="fullmodal-empty">이 날짜에는 공연이 없습니다.</p>`;
      overlay.classList.add('show');
      return;
    }

    perfs.forEach((p) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'fullmodal-item';

      item.innerHTML = `
        <div class="fullmodal-item-top">
          <span class="fullmodal-badge">${p.genre || '기타'}</span>
          <strong class="fullmodal-name">${p.name}</strong>
        </div>
        <div class="fullmodal-meta">@ ${p.place || '-'}</div>
        <div class="fullmodal-meta">${p.from} ~ ${p.to}</div>
      `;

      item.addEventListener('click', () => onItemClick(p));
      bodyEl.appendChild(item);
    });

    overlay.classList.add('show');
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return { open, close };
}
