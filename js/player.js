// ── Player ───────────────────────────────────────────────────────

const GHOST_X_OFFSET = 65; // 윙맨 기체의 수평 오프셋 (px)
const SHIELD_RADIUS  = 24; // 쉴드 링 반경 (px)

let P = null;

function makePlayer() {
  return {
    x: W / 2, y: H - 90,
    w: P_W, h: P_H,
    fireT: 0, invT: 0, propA: 0,
    weapon: 1, wpTimer: 0, alive: true,
  };
}

// ── 기체 렌더링 ───────────────────────────────────────────────────

/** 단일 전투기 스프라이트를 지정 위치에 렌더링 (플레이어 + 윙맨 공용) */
function drawShipAt(sx, sy, pal, propA, glowCol, sc = 1) {
  cx.save();
  cx.translate(sx, sy);
  cx.scale(sc, sc);
  cx.translate(-sx, -sy);

  // 엔진 배기 불꽃 (랜덤 길이로 깜빡임 연출)
  cx.fillStyle = `rgba(${glowCol || '80,160,255'},${rnd(.15, .45)})`;
  const ex = Math.round(sx - PX * .5);
  const ey = Math.round(sy + 7 * PX);
  cx.fillRect(ex,          ey, PX, rnd(3, 6) * PX | 0);
  cx.fillRect(ex + PX * 2, ey, PX, rnd(2, 5) * PX | 0);

  pxDraw(SPR_P, pal, sx, sy);

  // 프로펠러 (회전 애니메이션)
  cx.save();
  cx.translate(Math.round(sx), Math.round(sy - 7 * PX));
  cx.rotate(propA);
  cx.fillStyle = pal[5];
  cx.fillRect(-5 * PX / 2, 0,          PX, PX * 3);
  cx.fillRect(5 * PX / 2 - PX, 0,      PX, PX * 3);
  cx.fillRect(0, -5 * PX / 2,          PX * 3, PX);
  cx.fillRect(0, 5 * PX / 2 - PX,      PX * 3, PX);
  cx.fillStyle = pal[6];
  cx.fillRect(-PX / 2, -PX / 2, PX, PX);
  cx.restore();

  cx.restore();
}

/** 윙맨 고스트 기체 2대 렌더링 (ghostT > 0 일 때) */
function drawGhostWingmen() {
  if (ghostT <= 0) return;
  const alpha = Math.min(1, ghostT) * (.55 + .2 * Math.sin(performance.now() * .005));
  cx.globalAlpha = alpha;
  drawShipAt(P.x - GHOST_X_OFFSET, P.y + 10, PAL_G, P.propA * .75, '100,140,255', 0.7);
  drawShipAt(P.x + GHOST_X_OFFSET, P.y + 10, PAL_G, P.propA * .75, '100,140,255', 0.7);
  cx.globalAlpha = 1;
}

/** 파이어볼 활성 시 기체 주변 화염 오라 렌더링 */
function drawFireballAura() {
  if (fireballT <= 0) return;
  cx.globalAlpha = .3 + .15 * Math.sin(performance.now() * .009);
  cx.fillStyle = '#ff6600';
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (r * r + c * c < 6)
        cx.fillRect(Math.round(P.x + c * PX * 2), Math.round(P.y + r * PX * 2), PX * 2, PX * 2);
    }
  }
  cx.globalAlpha = 1;
}

/** 폭탄 폭발 반경 점선 원 렌더링 (폭탄 보유 시 항상 표시) */
function drawBombRadius() {
  if (bombs <= 0) return;
  const radius = bombDist * BOMB_DIST_UNIT;
  cx.globalAlpha  = 0.9;
  cx.strokeStyle  = '#ff8800';
  cx.lineWidth    = 1;
  cx.setLineDash([6, 5]);
  cx.beginPath();
  cx.arc(Math.round(P.x), Math.round(P.y), radius, 0, Math.PI * 2);
  cx.stroke();
  cx.setLineDash([]);
  cx.globalAlpha = 1;
  cx.lineWidth   = 1;
}

/** 쉴드 활성 시 방어막 링 렌더링 (박동 애니메이션) */
function drawShieldRing() {
  if (shieldT <= 0) return;
  const pulse = .5 + .4 * Math.sin(performance.now() * .009);
  cx.globalAlpha = pulse;
  cx.strokeStyle = '#00ff88';
  cx.lineWidth   = 2.5;
  cx.beginPath();
  cx.arc(Math.round(P.x), Math.round(P.y), SHIELD_RADIUS, 0, Math.PI * 2);
  cx.stroke();
  cx.globalAlpha = 1;
  cx.lineWidth   = 1;
}

function drawPlayer() {
  if (!P || !P.alive) return;
  // 무적 상태 깜빡임 (10fps 주기)
  if (P.invT > 0 && Math.floor(P.invT * 10) % 2 === 0) return;

  drawGhostWingmen();
  drawFireballAura();
  drawBombRadius();
  drawShieldRing();
  drawShipAt(P.x, P.y, PAL_P, P.propA, '80,160,255', 0.7);
}

// ── 플레이어 업데이트 ─────────────────────────────────────────────

/** 입력 기반 이동 및 프로펠러 애니메이션 */
function movePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft')  || keys.has('KeyA')) dx = -1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dx =  1;
  if (keys.has('ArrowUp')    || keys.has('KeyW')) dy = -1;
  if (keys.has('ArrowDown')  || keys.has('KeyS')) dy =  1;

  // 대각선 이동 시 속도 정규화
  if (dx && dy) { dx *= .707; dy *= .707; }

  P.x = clamp(P.x + dx * P_SPD * dt, P_W / 2, W - P_W / 2);
  P.y = clamp(P.y + dy * P_SPD * dt, P_H / 2, H - P_H / 2);
  P.propA += 14 * dt;
}

/** 자동 연사 처리 (윙맨 포함) */
function autoShoot(dt) {
  P.fireT -= dt;
  if (P.fireT > 0) return;

  shootFrom(P.x, P.y - P.h / 2 + 4, P.weapon);
  if (ghostT > 0) {
    shootFrom(P.x - GHOST_X_OFFSET, P.y + 8, P.weapon);
    shootFrom(P.x + GHOST_X_OFFSET, P.y + 8, P.weapon);
  }

  // 파이어볼은 더 느린 연사 간격 적용
  P.fireT = P.weapon === 5
    ? (rapidT > 0 ? .12 : .22)
    : (rapidT > 0 ? FIRE_RATE * .45 : FIRE_RATE);
}

/** 각종 파워업·상태 타이머 감소 */
function updatePlayerTimers(dt) {
  if (P.invT > 0) P.invT -= dt;

  // 무기 업그레이드 타이머 (만료 시 SINGLE 복귀, 단 파이어볼 미사용 조건)
  if (P.wpTimer > 0) {
    P.wpTimer -= dt;
    if (P.wpTimer <= 0 && !fireballT) P.weapon = 1;
  }

  // 파이어볼 타이머 (만료 시 무조건 SINGLE 복귀)
  if (fireballT > 0) {
    fireballT -= dt;
    if (fireballT <= 0) { fireballT = 0; P.weapon = 1; P.wpTimer = 0; }
  }

  // 파워업 타이머 (음수 방지)
  if (ghostT  > 0) { ghostT  -= dt; if (ghostT  < 0) ghostT  = 0; }
  if (rapidT  > 0) { rapidT  -= dt; if (rapidT  < 0) rapidT  = 0; }
  if (pierceT > 0) { pierceT -= dt; if (pierceT < 0) pierceT = 0; }
}

function updatePlayer(dt) {
  if (!P || !P.alive) return;
  movePlayer(dt);
  autoShoot(dt);
  updatePlayerTimers(dt);
}

// ── 총알 발사 ─────────────────────────────────────────────────────

function shootFrom(x, y, wpn) {
  const fb       = wpn === 5;
  const doPierce = fb || pierceT > 0;
  const sp       = BULLET_SPEED;

  // 총알 기본 속성 팩토리
  const mk = (ox, oy, vx, vy) => ({
    x: x + ox, y: y + oy,
    vx, vy,
    w: fb ? 14 : 4,
    h: fb ? 14 : 12,
    dmg: fb ? 2 : 1,
    pierce: doPierce,
    hset:   doPierce ? new Set() : null,
    alive:  true,
    fireball: fb,
    pcol:   !fb && pierceT > 0, // 관통탄 보라색 표시
  });

  switch (wpn) {
    case 1: // SINGLE — 정면 1발
      pBullets.push(mk(0, 0, 0, -sp));
      break;
    case 2: // DOUBLE — 좌우 2발
      pBullets.push(mk(-7, 0, 0, -sp));
      pBullets.push(mk( 7, 0, 0, -sp));
      break;
    case 3: // TRIPLE — 정면 + 좌우 사선
      pBullets.push(mk( 0, 0,  0,          -sp));
      pBullets.push(mk(-9, 4, -sp * .22,   -sp * .975));
      pBullets.push(mk( 9, 4,  sp * .22,   -sp * .975));
      break;
    case 4: // SPREAD — 5방향 부채꼴
      [-2, -1, 0, 1, 2].forEach(i => {
        const a = i * 16 * Math.PI / 180;
        pBullets.push(mk(0, 0, Math.sin(a) * sp, -Math.cos(a) * sp));
      });
      break;
    case 5: // FIREBALL — 3발 동시, 관통 고정, 더 느린 속도
      [-10, 0, 10].forEach(ox => pBullets.push(mk(ox, -8, 0, -FIREBALL_SPEED)));
      break;
  }
}
