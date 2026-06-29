// ── HUD ──────────────────────────────────────────────────────────

/** DOM HUD 업데이트 (점수, 목숨, 폭탄, 스킬 게이지, 무기명) */
function updateHUD() {
  document.getElementById('scoreEl').textContent = String(score).padStart(8, '0');
  document.getElementById('hiEl').textContent    = String(hiScore).padStart(8, '0');
  document.getElementById('waveEl').textContent  = wave || '-';

  document.getElementById('livesEl').textContent =
    Array.from({ length: Math.max(0, lives) }, () => '✈').join(' ') || '---';
  document.getElementById('bombsEl').textContent =
    Array.from({ length: Math.max(0, bombs) }, () => '◉').join(' ') || '-';

  document.getElementById('skillFill').style.width =
    `${Math.min(100, skillKills / SKILL_GOAL * 100)}%`;

  const wn = document.getElementById('wpName');
  wn.textContent  = WPN_NAMES[P?.weapon || 1];
  wn.style.color  = WPN_COLS[P?.weapon || 1] || '#ff8';

  document.getElementById('ghostEl').textContent = ghostT > 0 ? `${Math.ceil(ghostT)}s` : '-';
}

/** 우측 파워업 패널 업데이트 */
function updatePowerupPanel() {
  const cfg = [
    { id: 'life',   t: lives,         max: LIFE_MAX,   dur: false, fmt: v => `${Math.max(0, v | 0)}` },
    { id: 'bomb',   t: bombs,         max: BOMB_MAX,   dur: false, fmt: v => `${Math.max(0, v | 0)}/${BOMB_MAX}` },
    { id: 'power',  t: P?.wpTimer||0, max: POWER_DUR,  dur: true  },
    { id: 'wing',   t: ghostT,        max: GHOST_DUR,  dur: true  },
    { id: 'rapid',  t: rapidT,        max: RAPID_DUR,  dur: true  },
    { id: 'pierce', t: pierceT,       max: PIERCE_DUR, dur: true  },
    { id: 'shield', t: shieldT,       max: 1,          dur: true,  fmt: () => 'ON', noExp: true },
  ];

  cfg.forEach(({ id, t, max, dur, fmt, noExp }) => {
    const slot = document.getElementById(`pu-${id}`);
    const fill = document.getElementById(`puf-${id}`);
    const time = document.getElementById(`put-${id}`);
    if (!slot) return;

    const on = dur ? t > 0 : true;
    slot.classList.toggle('active',   on);
    slot.classList.toggle('expiring', !noExp && dur && on && t < 3);

    if (on) {
      fill.style.width  = `${Math.min(100, t / max * 100).toFixed(1)}%`;
      time.textContent  = fmt ? fmt(t) : `${Math.ceil(t)}s`;
    } else {
      fill.style.width = '0%';
    }
  });
}

// ── Canvas HUD 요소 ───────────────────────────────────────────────

/** 스킬 충전 완료 힌트 (우하단, 깜빡임) */
function drawSkillReadyHint() {
  if (skillKills < SKILL_GOAL || P?.weapon === 5) return;
  const a = .5 + .4 * Math.sin(performance.now() * .006);
  cx.globalAlpha = a;
  cx.fillStyle   = '#ff0';
  cx.font        = 'bold 11px Courier New';
  cx.textAlign   = 'right';
  cx.fillText('SKILL READY [X]', W - 14, H - 28);
  cx.globalAlpha = 1;
  cx.textAlign   = 'left';
}

/** 윙맨 타이머 경고 (4초 미만 시 표시) */
function drawWingmanTimer() {
  if (ghostT <= 0 || ghostT >= 4) return;
  cx.globalAlpha = Math.min(1, ghostT);
  cx.fillStyle   = '#8df';
  cx.font        = 'bold 13px Courier New';
  cx.textAlign   = 'right';
  cx.fillText(`◎ WING ${Math.ceil(ghostT)}s`, W - 14, H - 46);
  cx.globalAlpha = 1;
  cx.textAlign   = 'left';
}

/** 파이어볼 타이머 표시 */
function drawFireballTimer() {
  if (fireballT <= 0) return;
  cx.globalAlpha = .8 + .18 * Math.sin(performance.now() * .01);
  cx.fillStyle   = '#f60';
  cx.font        = 'bold 13px Courier New';
  cx.textAlign   = 'right';
  cx.fillText(`FIREBALL ${Math.ceil(fireballT)}s`, W - 14, H - 64);
  cx.globalAlpha = 1;
  cx.textAlign   = 'left';
}

/** 콤보 카운터 표시 (3콤보 이상 + 타이머 내) */
function drawComboDisplay() {
  if (combo <= 2 || comboT <= 0) return;
  cx.globalAlpha = Math.min(1, comboT);
  cx.fillStyle   = '#f80';
  cx.font        = 'bold 13px Courier New';
  cx.textAlign   = 'right';
  cx.fillText(`${combo}x COMBO`, W - 14, H - 10);
  cx.globalAlpha = 1;
  cx.textAlign   = 'left';
}

/** 웨이브 클리어 배너 (다음 웨이브 진행 바 포함) */
function drawWaveClearBanner() {
  if (!betweenWave) return;

  const prog = Math.max(0, 1 - betweenT / 1.5);
  cx.fillStyle = 'rgba(0,0,0,.72)';
  cx.fillRect(12, H * .35, W - 24, 112);

  cx.textAlign = 'center';
  cx.shadowBlur   = 18;
  cx.shadowColor  = '#ff0';
  cx.fillStyle    = '#ffee00';
  cx.font         = 'bold 30px Courier New';
  cx.fillText(`WAVE  ${waveIdx}  CLEAR!`, W / 2, H * .35 + 46);
  cx.shadowBlur   = 0;

  // 진행 바
  const bx = W / 2 - 90, by = H * .35 + 60, bw = 180, bh = 6;
  cx.fillStyle = '#1a1a1a';
  cx.fillRect(bx, by, bw, bh);
  cx.fillStyle = '#ffcc00';
  cx.fillRect(bx, by, Math.round(bw * prog), bh);
  cx.strokeStyle = '#333';
  cx.lineWidth   = 1;
  cx.strokeRect(bx, by, bw, bh);

  cx.fillStyle = '#555';
  cx.font      = '10px Courier New';
  cx.fillText('NEXT WAVE', W / 2, H * .35 + 88);
  cx.textAlign = 'left';
}

function drawHUDCanvas() {
  drawSkillReadyHint();
  drawWingmanTimer();
  drawFireballTimer();
  drawComboDisplay();
  drawWaveClearBanner();
  updatePowerupPanel();
}

// ── 우측 수직 진행 바 ──────────────────────────────────────────────
// 현재 웨이브를 TOTAL_WAVES 기준으로 아래→위 방향으로 표시.
// 보스 웨이브(5·10·15·20·25·30)마다 빨간 마커, 완주 시 노랗게 점멸.

const PROG_BAR_X = W - 6;
const PROG_BAR_W = 4;
const PROG_BAR_Y = 26;
const PROG_BAR_H = H - 34;

function drawProgressBar() {
  if (STATE === 'IDLE') return;

  const BX = PROG_BAR_X, BW = PROG_BAR_W;
  const BY = PROG_BAR_Y, BH = PROG_BAR_H;

  const progress = (STATE === 'PLAYING' || STATE === 'PAUSED')
    ? Math.min(1, Math.max(0, (waveIdx - 1) / (TOTAL_WAVES - 1)))
    : waveIdx >= TOTAL_WAVES ? 1 : 0;

  // 배경
  cx.fillStyle = 'rgba(0,0,0,.55)';
  cx.fillRect(BX, BY, BW, BH);

  // 채움 (하→상 그라디언트)
  const fillH = Math.round(BH * progress);
  if (fillH > 0) {
    const gr = cx.createLinearGradient(0, BY + BH, 0, BY);
    gr.addColorStop(0,    '#1a6fc8');
    gr.addColorStop(.14,  '#0a1a3a');
    gr.addColorStop(.28,  '#300c0c');
    gr.addColorStop(.42,  '#083040');
    gr.addColorStop(.57,  '#07081a');
    gr.addColorStop(.72,  '#030010');
    gr.addColorStop(1,    '#020d04');
    cx.fillStyle = gr;
    cx.fillRect(BX, BY + BH - fillH, BW, fillH);
  }

  // 보스 웨이브 마커 (5·10·15·20·25·30)
  [5, 10, 15, 20, 25, 30].forEach(bw => {
    const ratio   = (bw - 1) / (TOTAL_WAVES - 1);
    const my      = BY + BH - Math.round(BH * ratio);
    const reached = waveIdx >= bw;
    cx.fillStyle  = reached ? '#ff3333' : '#2a0000';
    cx.fillRect(BX - 2, my - 1, BW + 4, 2);
    cx.fillStyle  = reached ? '#ff3333' : '#1a0000';
    cx.fillRect(BX - 4, my - 2, 2, 4);
  });

  // 현재 위치 표시기 (깜빡이는 노란 선)
  if ((STATE === 'PLAYING' || STATE === 'PAUSED') && wave > 0) {
    const iy    = BY + BH - Math.round(BH * progress);
    const pulse = .7 + .3 * Math.sin(performance.now() * .007);
    cx.globalAlpha = pulse;
    cx.fillStyle   = '#ffee00';
    cx.fillRect(BX - 3, iy - 1, BW + 6, 3);
    cx.globalAlpha = 1;
    cx.fillStyle   = '#ffee00';
    cx.fillRect(BX - 2, iy - 4, 2, 2);
    cx.fillRect(BX - 3, iy - 2, 4, 2);
  }

  // 완주 시 전체 점멸
  if (progress >= 1) {
    const gl = .4 + .4 * Math.sin(performance.now() * .01);
    cx.globalAlpha = gl;
    cx.fillStyle   = '#ffee00';
    cx.fillRect(BX, BY, BW, BH);
    cx.globalAlpha = 1;
  }

  // 테두리 + 상단 별 아이콘
  cx.strokeStyle = '#181818';
  cx.lineWidth   = 1;
  cx.strokeRect(BX, BY, BW, BH);
  cx.fillStyle   = progress >= 1 ? '#ffee00' : '#252525';
  cx.font        = '6px Courier New';
  cx.textAlign   = 'center';
  cx.fillText('★', BX + BW / 2, BY - 2);
  cx.textAlign   = 'left';
}
