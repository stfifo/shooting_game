// ── Formations ───────────────────────────────────────────────────

// 대형 정의: 각 멤버의 피벗 기준 상대 좌표 [dx, dy]
const FMTS = {
  SOLO:     [[0, 0]],
  TWIN2:    [[-55, 0], [55, 0]],
  V5:       [[0, -44], [-44, 0], [44, 0], [-88, 44], [88, 44]],
  LINE5:    [[-96, 0], [-48, 0], [0, 0], [48, 0], [96, 0]],
  LINE7:    [[-132, 0], [-88, 0], [-44, 0], [0, 0], [44, 0], [88, 0], [132, 0]],
  ARROW7:   [[0, -88], [-44, -44], [44, -44], [-88, 0], [88, 0], [-44, 44], [44, 44]],
  BOX9:     [[-88, -55], [-44, -55], [0, -55], [-88, 0], [-44, 0], [0, 0], [-88, 55], [-44, 55], [0, 55]],
  CIRCLE8:  [[0, -52], [55, -37], [78, 0], [55, 37], [0, 52], [-55, 37], [-78, 0], [-55, -37]],
  DIAMOND6: [[0, -72], [-52, -18], [52, -18], [-52, 32], [52, 32], [0, 78]],
  ZIGZAG6:  [[-100, -24], [-60, 24], [-20, -24], [20, 24], [60, -24], [100, 24]],
};
FMTS.BOX9 = FMTS.BOX9.map(([x, y]) => [x + 44, y]);

// 진입 경로 정의: 큐빅 베지어 제어점 [x0,y0, x1,y1, x2,y2, x3,y3]
const ENTRY = {
  TOP:     (tx, ty) => [tx,      -80,     tx,       ty * .3,  tx,        ty * .7,  tx, ty],
  LEFT:    (tx, ty) => [-80,     110,     W * .22,  65,       W * .32,   ty,       tx, ty],
  RIGHT:   (tx, ty) => [W + 80,  110,     W * .78,  65,       W * .68,   ty,       tx, ty],
  DIVEL:   (tx, ty) => [55,      -80,     -30,      H * .3,   tx - 65,   ty + 45,  tx, ty],
  DIVER:   (tx, ty) => [W - 55,  -80,     W + 30,   H * .3,   tx + 65,   ty + 45,  tx, ty],
  SWING:   (tx, ty) => [W * .5,  -80,     W,        H * .35,  0,         H * .35,  tx, ty],
  SNEAK_L: (tx, ty) => [-80,     H * .45, W * .1,   H * .5,   W * .22,   ty,       tx, ty],
  SNEAK_R: (tx, ty) => [W + 80,  H * .45, W * .9,   H * .5,   W * .78,   ty,       tx, ty],
  LOOP:    (tx, ty) => [tx,      -80,     tx - 150, H * .62,  tx + 150,  H * .38,  tx, ty],
};

// ── Squadron State ────────────────────────────────────────────────

let waveSquads = [];

/** 편대 생성. 웨이브마다 기본 HP에 +1 누적 (wave N → hp = def.hp + N-1) */
function makeSquad(type, fmtKey, pivotX, targetY, delay = 0, entryKey = 'TOP') {
  const def      = EDEFS[type] || EDEFS.A;
  const offs     = FMTS[fmtKey] || FMTS.SOLO;
  const bp       = (ENTRY[entryKey] || ENTRY.TOP)(pivotX, targetY);
  const scaledHp = def.hp + ((waveIdx || 1) - 1);

  return {
    type, def, offs, delay,
    delayT:   delay,
    pivot:    { x: bp[0], y: bp[1] },
    bp,
    targetX:  pivotX,
    targetY,
    pathT:    0,
    phase:    delay > 0 ? 'DELAY' : 'ENTER',
    holdT:    3.5 + rnd(0, 2),
    sweepDir: rnd(0, 1) > .5 ? 1 : -1,
    frameN:   0,
    members:  offs.map((off, i) => ({
      x:      bp[0] + off[0],
      y:      bp[1] + off[1],
      w:      def.w, h: def.h,
      hp:     scaledHp, maxHp: scaledHp,
      type,   alive: true, frame: 0,
      shootT: 1 + rnd(0, 2.5),
      spawnT: i * .13,
      ready:  false,
      atk:    false, atkVx: 0, atkVy: 0, atkReT: 0,
    })),
  };
}

// ── Squadron Update ───────────────────────────────────────────────

/**
 * 전원 사망 후 stuck 방지: ENTER → HOLD → ATTACK 순서로 자동 진행.
 * ATTACK에 도달해야 squadDone() 조건이 성립 → wave clear 판정.
 */
function advancePhaseOnWipeout(sq, dt) {
  if (sq.phase === 'ENTER') sq.phase = 'HOLD';
  if (sq.phase === 'HOLD') {
    sq.holdT -= dt;
    if (sq.holdT <= 0) sq.phase = 'ATTACK';
  }
}

/** ENTER 단계: 큐빅 베지어 경로를 따라 피벗 이동 */
function updateSquadEnter(sq, dt) {
  sq.pathT = Math.min(1, sq.pathT + dt * .65);
  const bp = sq.bp;
  sq.pivot.x = cbez(sq.pathT, bp[0], bp[2], bp[4], bp[6]);
  sq.pivot.y = cbez(sq.pathT, bp[1], bp[3], bp[5], bp[7]);
  if (sq.pathT >= 1) {
    sq.pivot.x = sq.targetX;
    sq.pivot.y = sq.targetY;
    sq.phase   = 'HOLD';
  }
}

/** HOLD 단계: 좌우 스윕 이동 → 시간 소진 시 ATTACK 전환 */
function updateSquadHold(sq, dt, alive) {
  const spread = Math.max(0, ...sq.offs.map(o => Math.abs(o[0])));
  const lo = spread + 38, hi = W - spread - 38;

  sq.pivot.x += sq.sweepDir * 36 * dt;
  if (sq.pivot.x < lo) { sq.pivot.x = lo; sq.sweepDir =  1; }
  if (sq.pivot.x > hi) { sq.pivot.x = hi; sq.sweepDir = -1; }

  sq.holdT -= dt;
  if (sq.holdT <= 0) {
    sq.phase = 'ATTACK';
    alive.forEach((m, i) => { m.atkReT = i * .45; });
  }
}

/** 개별 멤버 위치·공격·사격 업데이트 */
function updateMember(m, sq, i, dt) {
  m.frame++;

  // 스폰 딜레이: 순서대로 등장 (i * 0.13초 간격)
  if (!m.ready) {
    m.spawnT -= dt;
    if (m.spawnT <= 0) m.ready = true;
    else return;
  }

  // 위치 추종 (ENTER 중에는 웨이브 흔들림 추가)
  const wobble = sq.phase === 'ENTER' ? Math.sin(m.frame * .15 + i * .9) * 6 : 0;
  if (!m.atk) {
    m.x += (sq.pivot.x + sq.offs[i][0] + wobble - m.x) * Math.min(1, dt * 4.5);
    m.y += (sq.pivot.y + sq.offs[i][1]            - m.y) * Math.min(1, dt * 4.5);
  } else {
    // 돌격 중: 딜레이 후 속도 벡터로 이동 (공기 저항 감속 포함)
    m.atkReT -= dt;
    if (m.atkReT <= 0) {
      m.x += m.atkVx * dt;
      m.y += m.atkVy * dt;
      m.atkVx *= (1 - dt * .7);

      // 화면 아래로 이탈 시 상단에서 재진입
      if (m.y > H + 60) {
        m.x = rnd(60, W - 60);
        m.y = -60;
        if (P) {
          const dx = P.x - m.x, dy = P.y - m.y;
          const l  = Math.hypot(dx, dy) || 1;
          const sp = 175 + rnd(0, 55);
          m.atkVx = dx / l * sp;
          m.atkVy = dy / l * sp;
        }
        m.atkReT = rnd(1.5, 3.5);
      }
    }
  }

  // 사격 (ENTER / DELAY 중에는 발사 안 함)
  if (sq.phase !== 'ENTER' && sq.phase !== 'DELAY') {
    m.shootT -= dt;
    if (m.shootT <= 0) {
      shootEnemy(m);
      m.shootT = sq.def.sRate + rnd(-.3, .8);
    }
  }

  // ATTACK 진입 시 플레이어 방향으로 돌격 벡터 설정
  if (sq.phase === 'ATTACK' && !m.atk && m.atkReT <= 0) {
    m.atk = true;
    if (P) {
      const dx = P.x - m.x, dy = P.y - m.y;
      const l  = Math.hypot(dx, dy) || 1;
      const sp = 180 + rnd(0, 60);
      m.atkVx = dx / l * sp;
      m.atkVy = dy / l * sp;
    }
  }
}

function updateSquad(sq, dt) {
  if (sq.phase === 'DELAY') {
    sq.delayT -= dt;
    if (sq.delayT <= 0) sq.phase = 'ENTER';
    return;
  }

  sq.frameN++;
  const alive = sq.members.filter(m => m.alive);

  // 전원 사망 시 자동 단계 진행 (wave clear 조건은 ATTACK 도달 후)
  if (!alive.length) {
    advancePhaseOnWipeout(sq, dt);
    return;
  }

  if      (sq.phase === 'ENTER') updateSquadEnter(sq, dt);
  else if (sq.phase === 'HOLD')  updateSquadHold(sq, dt, alive);

  sq.members.forEach((m, i) => {
    if (!m.alive) return;
    updateMember(m, sq, i, dt);
  });
}

/** 적 타입별 발사 패턴 */
function shootEnemy(m) {
  const sp = 185;
  const mk = (vx, vy) => ({
    x: m.x, y: m.y + m.h / 2,
    vx, vy, w: 6, h: 12, alive: true, t: m.type,
  });

  if (m.type === 'B') {
    // B형: 3방향 산탄
    [-22, 0, 22].forEach(a => {
      const r = a * Math.PI / 180;
      eBullets.push(mk(Math.sin(r) * sp, Math.cos(r) * sp));
    });
  } else if (m.type === 'C' && P) {
    // C형: 플레이어 유도탄 1발
    const dx = P.x - m.x, dy = P.y - m.y;
    const l  = Math.hypot(dx, dy) || 1;
    eBullets.push(mk(dx / l * sp * 1.25, dy / l * sp * 1.25));
  } else {
    // A형: 직하 발사
    eBullets.push(mk(0, sp));
  }
}

/** 현재 활성화된 모든 적 멤버 반환 */
function getEnemies() {
  return waveSquads.flatMap(sq => sq.members.filter(m => m.alive && m.ready));
}

/**
 * 편대 완료 판정.
 * ATTACK 단계 도달 후 전원 사망인 경우에만 true.
 * ENTER/HOLD 중 전멸만으로는 wave clear를 트리거하지 않음.
 */
function squadDone(sq) {
  return sq.phase === 'ATTACK' && sq.members.every(m => !m.alive);
}
