// ── Overlays ─────────────────────────────────────────────────────
// 전체화면 오버레이: 보스 경고 연출 + IDLE / PAUSED / GAMEOVER / CLEAR

// ── 공통 헬퍼 ────────────────────────────────────────────────────

/**
 * 조작키 목록 테이블 렌더링 (key: right-align, value: left-align).
 * @param {Array} items     [[keyLabel, valueLabel], ...] 배열
 * @param {number} centerX  key / value 기준선 X 좌표
 * @param {number} startY   첫 행 Y 좌표
 * @param {number} rowH     행 간격 (px)
 * @param {string} keyCol   키 라벨 색상
 * @param {string} valCol   값 라벨 색상
 */
function drawControlsBlock(items, centerX, startY, rowH, keyCol, valCol) {
  items.forEach(([k, v], i) => {
    const y = startY + i * rowH;
    cx.fillStyle = keyCol; cx.textAlign = 'right'; cx.font = '9px Courier New';
    cx.fillText(k, centerX - 8, y);
    cx.fillStyle = valCol; cx.textAlign = 'left';  cx.font = 'bold 9px Courier New';
    cx.fillText(v, centerX + 8, y);
  });
}

/** NEW HI-SCORE 깜빡임 텍스트 렌더링 (450ms 주기) */
function drawNewHiScoreFlash(y) {
  if (Math.floor(performance.now() / 450) % 2 !== 0) return;
  cx.shadowBlur  = 8;
  cx.shadowColor = '#f80';
  cx.fillStyle   = '#ff8800';
  cx.font        = 'bold 13px Courier New';
  cx.fillText('✦  NEW HI-SCORE  ✦', W / 2, y);
  cx.shadowBlur  = 0;
}

// ── Boss Warning Cutscene ─────────────────────────────────────────

function drawBossWarning() {
  if (!bossWarnActive) return;
  const now   = performance.now();
  const flash = Math.floor(bossWarnT * 4) % 2 === 0; // 초당 4회 교번

  // ① 전체 화면 빨간 오버레이
  cx.fillStyle = `rgba(160,0,0,${flash ? .58 : .10})`;
  cx.fillRect(0, 0, W, H);

  // ② CRT 스캔라인
  cx.fillStyle = 'rgba(0,0,0,.20)';
  for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);

  // ③ 픽셀 아트 코너 브래킷 (4모서리, 각 6칸×4px)
  const S = 4, M = 14, L = 6;
  cx.fillStyle = flash ? '#ff2222' : '#880000';
  [[M, M, 1, 1], [W - M, M, -1, 1], [M, H - M, 1, -1], [W - M, H - M, -1, -1]].forEach(([ox, oy, sx, sy]) => {
    for (let i = 0; i < L; i++) cx.fillRect(ox + sx * i * S, oy, S, S);
    for (let i = 1; i < L; i++) cx.fillRect(ox, oy + sy * i * S, S, S);
  });

  // ④ 중앙 구분선 (점선 픽셀)
  cx.fillStyle = flash ? '#cc0000' : '#440000';
  for (let x = 0; x < W; x += 8) {
    cx.fillRect(x, H / 2 - 34, 5, 2);
    cx.fillRect(x, H / 2 + 20, 5, 2);
  }

  cx.textAlign = 'center';
  const pulse  = .88 + .12 * Math.sin(now * .014);
  cx.globalAlpha = pulse;

  // ⑤ WARNING 텍스트 (외곽 글로우 2겹 후 본체)
  cx.shadowColor = '#ff0000';
  cx.shadowBlur  = 48;
  cx.fillStyle   = 'rgba(255,0,0,.4)';
  cx.font        = 'bold 50px Courier New';
  cx.fillText('⚠  WARNING  ⚠', W / 2, H / 2 - 48);
  cx.shadowBlur  = 22;
  cx.fillStyle   = flash ? '#ffffff' : '#ff3333';
  cx.fillText('⚠  WARNING  ⚠', W / 2, H / 2 - 48);

  // ⑥ 서브타이틀
  cx.shadowBlur  = 10;
  cx.shadowColor = '#ff0000';
  cx.fillStyle   = flash ? '#ffcccc' : '#aa4444';
  cx.font        = 'bold 15px Courier New';
  cx.fillText('BOSS  IS  APPROACHING', W / 2, H / 2 + 4);

  // ⑦ 카운트다운 (박동 스케일 애니메이션)
  const cnt  = Math.ceil(bossWarnT);
  const beat = 1 + .12 * Math.max(0, Math.sin(now * .018));
  cx.save();
  cx.translate(W / 2, H / 2 + 64);
  cx.scale(beat, beat);
  cx.shadowBlur  = 44;
  cx.shadowColor = '#ff0000';
  cx.fillStyle   = flash ? '#ffffff' : '#ff5555';
  cx.font        = 'bold 62px Courier New';
  cx.fillText(cnt, 0, 0);
  cx.restore();

  cx.shadowBlur  = 0;
  cx.globalAlpha = 1;
  cx.textAlign   = 'left';
}

// ── IDLE 화면 ─────────────────────────────────────────────────────

function drawIdle() {
  cx.fillStyle = 'rgba(0,0,0,.88)';
  cx.fillRect(0, 0, W, H);
  cx.textAlign = 'center';

  // 타이틀
  cx.shadowBlur  = 32; cx.shadowColor = '#f80'; cx.fillStyle = '#f80';
  cx.font        = 'bold 56px Courier New';
  cx.fillText('STRIKERS', W / 2, H / 2 - 86);
  cx.shadowBlur  = 16; cx.shadowColor = '#ff0'; cx.fillStyle = '#ffcc00';
  cx.font        = 'bold 34px Courier New';
  cx.fillText('1945+', W / 2, H / 2 - 44);
  cx.shadowBlur  = 0;

  // 조작 안내 패널
  const bx = W / 2 - 132, by = H / 2 - 26, bw = 264, bh = 116;
  cx.fillStyle   = 'rgba(255,255,255,.035)';
  cx.fillRect(bx, by, bw, bh);
  cx.strokeStyle = '#2a2a2a'; cx.lineWidth = 1;
  cx.strokeRect(bx, by, bw, bh);
  cx.fillStyle   = '#3a3a3a'; cx.font = '9px Courier New';
  cx.fillText('— CONTROLS —', W / 2, by + 14);

  const ctrl = [
    ['MOVE',  '← → ↑ ↓  /  W A S D'],
    ['FIRE',  'AUTO'],
    ['BOMB',  'Z'],
    ['SKILL', 'X  (20 kills → charged)'],
    ['PAUSE', 'SPACE'],
  ];
  drawControlsBlock(ctrl, W / 2, by + 28, 17, '#444', '#aaa');

  // PRESS ENTER (깜빡임)
  const blink = Math.floor(performance.now() / 550) % 2 === 0;
  cx.shadowBlur  = blink ? 12 : 0; cx.shadowColor = '#ff0';
  cx.fillStyle   = blink ? '#ffee00' : '#665500';
  cx.font        = 'bold 16px Courier New'; cx.textAlign = 'center';
  cx.fillText('PRESS  ENTER  TO  START', W / 2, H / 2 + 106);
  cx.shadowBlur  = 0;

  // 하이스코어
  cx.fillStyle = '#3a3a3a'; cx.font = '11px Courier New';
  cx.fillText(`HI-SCORE  ${String(hiScore).padStart(8, '0')}`, W / 2, H / 2 + 130);

  // 스테이터스 바 가이드 패널
  const hx = W / 2 - 148, hy = H / 2 + 152, hw = 296, hh = 86;
  cx.fillStyle   = 'rgba(255,255,255,.025)';
  cx.fillRect(hx, hy, hw, hh);
  cx.strokeStyle = '#222'; cx.lineWidth = 1;
  cx.strokeRect(hx, hy, hw, hh);
  cx.fillStyle   = '#2a2a2a'; cx.font = '9px Courier New'; cx.textAlign = 'center';
  cx.fillText('— STATUS BAR GUIDE —', W / 2, hy + 13);

  const guide = [
    ['✈',       'LIFE',    '피격 1회마다 감소. 0이면 게임 오버'],
    ['◉',       'BOMB',    'Z로 발동. 전체 적 즉시 제거'],
    ['▬▬',     'SKILL',   '20킬 충전 후 X로 파이어볼 발동'],
    ['P·R·N·S', 'ITEM',    '파워업 아이템 — 무기/속사/관통/쉴드'],
  ];
  guide.forEach(([icon, label, desc], i) => {
    const gy = hy + 26 + i * 15;
    cx.fillStyle = '#ffcc44'; cx.textAlign = 'left'; cx.font = 'bold 9px Courier New';
    cx.fillText(icon,  hx + 8,  gy);
    cx.fillStyle = '#555'; cx.font = '9px Courier New';
    cx.fillText(label, hx + 46, gy);
    cx.fillStyle = '#888';
    cx.fillText(desc,  hx + 90, gy);
  });

  cx.textAlign = 'left';
}

// ── PAUSED 화면 ───────────────────────────────────────────────────

function drawPaused() {
  cx.fillStyle = 'rgba(0,0,0,.75)';
  cx.fillRect(0, 0, W, H);
  cx.textAlign = 'center';

  // 타이틀
  cx.shadowBlur  = 18; cx.shadowColor = '#4af'; cx.fillStyle = '#88ddff';
  cx.font        = 'bold 38px Courier New';
  cx.fillText('PAUSED', W / 2, H / 2 - 148);
  cx.shadowBlur  = 0;

  // 웨이브 / 점수 카드
  const sx = W / 2 - 116, sy = H / 2 - 130, sw = 232, sh = 50;
  cx.fillStyle   = 'rgba(255,255,255,.04)';
  cx.fillRect(sx, sy, sw, sh);
  cx.strokeStyle = '#2a3a4a'; cx.lineWidth = 1;
  cx.strokeRect(sx, sy, sw, sh);

  cx.fillStyle = '#445566'; cx.font = '9px Courier New'; cx.textAlign = 'left';
  cx.fillText('WAVE', sx + 14, sy + 16);
  cx.fillStyle = '#aaddff'; cx.font = 'bold 20px Courier New';
  cx.fillText(String(wave || '-').padStart(2, ' '), sx + 14, sy + 40);

  cx.strokeStyle = '#1e2e3e'; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(W / 2, sy + 8); cx.lineTo(W / 2, sy + sh - 8); cx.stroke();

  cx.fillStyle = '#445566'; cx.font = '9px Courier New'; cx.textAlign = 'right';
  cx.fillText('SCORE', sx + sw - 14, sy + 16);
  cx.fillStyle = '#ffee88'; cx.font = 'bold 20px Courier New';
  cx.fillText(String(score).padStart(8, '0'), sx + sw - 14, sy + 40);

  // 조작 안내 패널
  const cy = H / 2 - 58, px = W / 2 - 116, ph = 120;
  cx.fillStyle   = 'rgba(255,255,255,.03)';
  cx.fillRect(px, cy, 232, ph);
  cx.strokeStyle = '#222'; cx.lineWidth = 1;
  cx.strokeRect(px, cy, 232, ph);
  cx.fillStyle   = '#334'; cx.font = '9px Courier New'; cx.textAlign = 'center';
  cx.fillText('— CONTROLS —', W / 2, cy + 14);

  const ctrl = [
    ['MOVE',  '← → ↑ ↓  /  W A S D'],
    ['BOMB',  'Z'],
    ['SKILL', 'X  (20킬 충전 후)'],
    ['PAUSE', 'SPACE'],
  ];
  drawControlsBlock(ctrl, W / 2, cy + 30, 20, '#3a4a5a', '#99bbcc');

  // SPACE RESUME (깜빡임)
  const blink = Math.floor(performance.now() / 600) % 2 === 0;
  cx.shadowBlur  = blink ? 8 : 0; cx.shadowColor = '#4af';
  cx.fillStyle   = blink ? '#88ddff' : '#223344';
  cx.font        = 'bold 13px Courier New'; cx.textAlign = 'center';
  cx.fillText('[ SPACE ]  RESUME', W / 2, H / 2 + 76);
  cx.shadowBlur  = 0;
  cx.textAlign   = 'left';
}

// ── GAMEOVER 화면 ─────────────────────────────────────────────────

function drawGameOver() {
  cx.fillStyle = 'rgba(0,0,0,.82)';
  cx.fillRect(0, 0, W, H);
  cx.textAlign = 'center';

  // 타이틀
  cx.shadowBlur  = 18; cx.shadowColor = '#cc0000'; cx.fillStyle = '#ff4444';
  cx.font        = 'bold 44px Courier New';
  cx.fillText('GAME  OVER', W / 2, H / 2 - 68);
  cx.shadowBlur  = 0;

  // 점수 카드
  cx.fillStyle   = 'rgba(255,255,255,.04)';
  cx.fillRect(W / 2 - 110, H / 2 - 50, 220, 88);
  cx.strokeStyle = '#2a2a2a'; cx.lineWidth = 1;
  cx.strokeRect(W / 2 - 110, H / 2 - 50, 220, 88);

  cx.fillStyle = '#444'; cx.font = '10px Courier New';
  cx.fillText('SCORE', W / 2, H / 2 - 30);
  cx.fillStyle = '#ffffff'; cx.font = 'bold 26px Courier New';
  cx.fillText(String(score).padStart(8, '0'), W / 2, H / 2 - 6);

  cx.fillStyle = '#333'; cx.font = '9px Courier New';
  cx.fillText('HI-SCORE', W / 2, H / 2 + 16);
  cx.fillStyle = '#aa9900'; cx.font = 'bold 15px Courier New';
  cx.fillText(String(hiScore).padStart(8, '0'), W / 2, H / 2 + 34);

  if (score > 0 && score >= hiScore) drawNewHiScoreFlash(H / 2 + 56);

  // PRESS ENTER (깜빡임)
  const blink = Math.floor(performance.now() / 620) % 2 === 0;
  cx.fillStyle = blink ? '#ffee00' : '#554400';
  cx.font      = 'bold 14px Courier New';
  cx.fillText('PRESS  ENTER  TO  RETRY', W / 2, H / 2 + 82);
  cx.textAlign = 'left';
}

// ── GAMECLEAR 화면 ────────────────────────────────────────────────

function drawGameClear() {
  cx.fillStyle = 'rgba(0,0,0,.88)';
  cx.fillRect(0, 0, W, H);
  cx.textAlign = 'center';

  // 타이틀
  cx.shadowBlur  = 40; cx.shadowColor = '#ffdd00'; cx.fillStyle = '#ffee44';
  cx.font        = 'bold 48px Courier New';
  cx.fillText('GAME  CLEAR', W / 2, H / 2 - 90);
  cx.shadowBlur  = 0;

  cx.fillStyle = '#88ffcc'; cx.font = 'bold 14px Courier New';
  cx.fillText('ALL  30  WAVES  COMPLETED', W / 2, H / 2 - 56);

  // 점수 카드
  cx.fillStyle   = 'rgba(255,255,100,.06)';
  cx.fillRect(W / 2 - 110, H / 2 - 40, 220, 96);
  cx.strokeStyle = '#443300'; cx.lineWidth = 1;
  cx.strokeRect(W / 2 - 110, H / 2 - 40, 220, 96);

  cx.fillStyle = '#665500'; cx.font = '10px Courier New';
  cx.fillText('FINAL SCORE', W / 2, H / 2 - 18);
  cx.fillStyle = '#ffee00'; cx.font = 'bold 28px Courier New';
  cx.fillText(String(score).padStart(8, '0'), W / 2, H / 2 + 10);

  cx.fillStyle = '#444'; cx.font = '9px Courier New';
  cx.fillText('HI-SCORE', W / 2, H / 2 + 30);
  cx.fillStyle = '#aa9900'; cx.font = 'bold 14px Courier New';
  cx.fillText(String(hiScore).padStart(8, '0'), W / 2, H / 2 + 48);

  if (score >= hiScore && score > 0) drawNewHiScoreFlash(H / 2 + 68);

  // PRESS ENTER (깜빡임)
  const blink = Math.floor(performance.now() / 600) % 2 === 0;
  cx.shadowBlur  = blink ? 10 : 0; cx.shadowColor = '#ffdd00';
  cx.fillStyle   = blink ? '#ffee00' : '#554400';
  cx.font        = 'bold 14px Courier New';
  cx.fillText('PRESS  ENTER  TO  PLAY  AGAIN', W / 2, H / 2 + 96);
  cx.shadowBlur  = 0;
  cx.textAlign   = 'left';
}
