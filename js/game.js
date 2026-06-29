// ── Game Loop ─────────────────────────────────────────────────────

function startGame() {
  // 점수 및 플레이어 자원 초기화
  score      = 0;
  lives      = 3;
  bombs      = 2;
  wave       = 0;

  // 콤보 및 스킬 초기화
  combo      = 0;
  comboT     = 0;
  skillKills = 0;

  // 파워업 타이머 초기화
  fireballT = 0;
  ghostT    = 0;
  rapidT    = 0;
  pierceT   = 0;
  shieldT   = 0;

  // 아이템 관련 초기화
  bombDist   = BOMB_DIST;
  fDropGroup = 0;
  fDropCount = 0;

  // 이스터에그 초기화
  hasMoved    = false;
  godMode     = false;
  cPressCount = 0;

  // 오브젝트 배열 초기화
  pBullets   = [];
  eBullets   = [];
  pups       = [];
  parts      = [];
  fxts       = [];
  blasts     = [];
  waveSquads = [];

  // 보스 및 웨이브 상태 초기화
  boss           = null;
  bossWave       = false;
  bossWarnActive = false;
  betweenWave    = false;
  betweenT       = 0;

  P = makePlayer();
  initBackground();
  launchWave(1);
  STATE = 'PLAYING';
  updateHUD();
}

function update(dt) {
  if (STATE !== 'PLAYING') return;

  updateBG(dt);
  updatePlayer(dt);
  updateWaves(dt);
  updateBullets(dt);
  updateItems(dt);
  checkCollisions();
  updateParts(dt);

  // 콤보 타이머
  if (comboT > 0) {
    comboT -= dt;
    if (comboT <= 0) combo = 0;
  }

  // 전면 플래시 페이드 아웃
  if (flashA > 0) flashA = Math.max(0, flashA - dt * 3.5);

  // 화면 흔들림
  if (shakeDur > 0) {
    shakeDur -= dt;
    shakeX    = (Math.random() - .5) * shakeAmt * 2;
    shakeY    = (Math.random() - .5) * shakeAmt * 2;
  } else {
    shakeX = 0;
    shakeY = 0;
  }
}

function draw() {
  cx.save();
  cx.translate(Math.round(shakeX), Math.round(shakeY));

  // 게임 오브젝트
  drawBG();
  drawEnemies();
  drawBullets();
  drawItems();
  drawPlayer();
  drawParts();

  // 보스 경고 연출 오버레이 (게임플레이 위)
  drawBossWarning();

  // 전면 플래시 오버레이
  if (flashA > 0) {
    cx.globalAlpha = flashA;
    cx.fillStyle   = flashCol;
    cx.fillRect(0, 0, W, H);
    cx.globalAlpha = 1;
  }

  // HUD
  drawProgressBar();
  drawHUDCanvas();

  // 상태별 오버레이
  if (STATE === 'IDLE')     drawIdle();
  if (STATE === 'PAUSED')   drawPaused();
  if (STATE === 'GAMEOVER') drawGameOver();
  if (STATE === 'CLEAR')    drawGameClear();

  cx.restore();
}

let lastT = 0;

function loop(ts) {
  const dt = Math.min((ts - lastT) / 1000, .05); // 최대 50ms 클램프 (스파이크 보정)
  lastT = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// 초기 실행
initBackground();
P = makePlayer();
updateHUD();
requestAnimationFrame(ts => { lastT = ts; requestAnimationFrame(loop); });
