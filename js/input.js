// ── Input ────────────────────────────────────────────────────────
const keys = new Set();

// 키코드 → DOM 엘리먼트 ID (키 피드백 하이라이트용)
const KEY_VIS = {
  ArrowUp:    'ku', KeyW: 'ku',
  ArrowDown:  'kd', KeyS: 'kd',
  ArrowLeft:  'kl', KeyA: 'kl',
  ArrowRight: 'kr', KeyD: 'kr',
  KeyZ: 'k-z', KeyX: 'k-x',
  Space: 'k-space', Enter: 'k-start',
};

// 이스터에그 감지 대상 이동키
const MOVE_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
]);

/** 키 비주얼 피드백 토글 */
function setKeyVis(code, on) {
  const id = KEY_VIS[code];
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.classList.toggle('active', on);
}

/** Space: PLAYING ↔ PAUSED 전환 */
function handlePause(code) {
  if (code !== 'Space') return;
  if      (STATE === 'PLAYING') STATE = 'PAUSED';
  else if (STATE === 'PAUSED')  STATE = 'PLAYING';
}

/** Enter / Space: 게임 시작 또는 재시작 */
function handleGameStart(code) {
  if (code !== 'Enter' && code !== 'Space') return;
  if (STATE === 'IDLE' || STATE === 'GAMEOVER' || STATE === 'CLEAR') startGame();
}

/** 이스터에그: Shift 5회 연속 입력 → 무적 토글 */
function handleGodModeEasterEgg(code) {
  if (code !== 'ShiftLeft' && code !== 'ShiftRight') return;
  cPressCount++;
  if (cPressCount < 5) return;
  cPressCount = 0;
  godMode = !godMode;
  addFx(
    godMode ? '✦ GOD MODE ✦' : '✦ MORTAL ✦',
    W / 2, H / 2 - 10,
    godMode ? '#ffd700' : '#aaa',
    20,
  );
  flashIt(godMode ? 'rgba(255,215,0,.35)' : 'rgba(180,180,180,.3)');
}

addEventListener('keydown', e => {
  if (keys.has(e.code)) return;
  keys.add(e.code);
  setKeyVis(e.code, true);

  // 이동키 입력 시 이스터에그 플래그 해제
  if (STATE === 'PLAYING' && MOVE_KEYS.has(e.code)) hasMoved = true;

  // 브라우저 기본 스크롤 방지
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code))
    e.preventDefault();

  handlePause(e.code);
  handleGameStart(e.code);

  if (STATE === 'PLAYING') {
    if (e.code === 'KeyZ') useBomb();
    if (e.code === 'KeyX') useSkill();
    handleGodModeEasterEgg(e.code);
  }
});

addEventListener('keyup', e => {
  keys.delete(e.code);
  setKeyVis(e.code, false);
});
