// js/components/modal.js

export function createModal() {
  // 모달 HTML을 body 끝에 추가
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="닫기">×</button>
      <div class="modal-content"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const content = overlay.querySelector('.modal-content');

  function close() {
    overlay.classList.remove('show');
  }

  function open(html) {
    content.innerHTML = html;
    overlay.classList.add('show');
  }

  // 닫기 이벤트들
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();   // 바깥 클릭 시 닫기
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();      // ESC로 닫기
  });

  return { open, close };
}