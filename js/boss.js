// ── Boss ──────────────────────────────────────────────────────────

// 보스 PNG 스프라이트 (tier 1~6)
const BOSS_IMGS = Array.from({ length: 6 }, (_, i) => {
  const img = new Image();
  img.src = `asset/boss_${i + 1}.png`;
  return img;
});

// ── 보스 렌더링 ───────────────────────────────────────────────────

/** 보스 HP 바 렌더링 (상단 고정, 3구간 색상 변화) */
function drawBossHPBar(b) {
  const bx = 8, by = 8, bw = W - 16, bh = 10;

  cx.fillStyle = '#111';
  cx.fillRect(bx, by, bw, bh);

  const pct  = b.hp / b.maxHp;
  const bars = Math.floor(bw / 4);
  for (let i = 0; i < bars; i++) {
    if (i / bars > pct) break;
    cx.fillStyle = i / bars > .66 ? '#4f4' : i / bars > .33 ? '#ff4' : '#f44';
    cx.fillRect(bx + i * 4, by, 3, bh);
  }

  // 테두리 및 페이즈 구분선 (1/3, 2/3 지점)
  cx.strokeStyle = '#444';
  cx.lineWidth   = 1;
  cx.strokeRect(bx, by, bw, bh);
  [1 / 3, 2 / 3].forEach(m => {
    cx.strokeStyle = '#666';
    cx.beginPath();
    cx.moveTo(bx + bw * m, by);
    cx.lineTo(bx + bw * m, by + bh);
    cx.stroke();
  });

  // 라벨
  cx.fillStyle = '#fff6';
  cx.font      = '8px Courier New';
  cx.fillText('BOSS  HP', bx + 4, by + bh - 1);
  if (b.phase > 1) {
    cx.fillStyle = '#ff4';
    cx.fillText(`PHASE ${b.phase}`, bx + bw - 52, by + bh - 1);
  }
}

/** 보스 스프라이트 + 페이즈 오버레이 + HP 바 렌더링 */
function drawBossSprite(b) {
  if (!b || !b.alive) return;
  const ph  = b.phase;
  const img = BOSS_IMGS[(b.tier || 1) - 1];

  if (img && img.complete && img.naturalWidth > 0) {
    const maxW  = 140, maxH = 130;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const dw    = img.naturalWidth * scale;
    const dh    = img.naturalHeight * scale;
    const dx    = b.x - dw / 2, dy = b.y - dh / 2;

    // 페이즈별 글로우 색상
    cx.save();
    if      (ph === 3) { cx.shadowBlur = 24; cx.shadowColor = '#ff2200'; }
    else if (ph === 2) { cx.shadowBlur = 16; cx.shadowColor = '#ff7700'; }
    else               { cx.shadowBlur = 8;  cx.shadowColor = '#8844ff'; }
    cx.drawImage(img, dx, dy, dw, dh);
    cx.restore();

    // 페이즈 색조 오버레이
    if (ph === 2) {
      cx.globalAlpha = .18;
      cx.fillStyle   = '#ff8800';
      cx.fillRect(dx, dy, dw, dh);
      cx.globalAlpha = 1;
    }
    if (ph === 3) {
      cx.globalAlpha = .28;
      cx.fillStyle   = '#ff2200';
      cx.fillRect(dx, dy, dw, dh);
      cx.globalAlpha = 1;
      // 화염 픽셀 파티클
      [[6, 12], [-8, 16], [3, 6], [-5, 20], [10, 8]].forEach(([fx, fy]) => {
        cx.fillStyle = `rgba(255,${rnd(40, 160) | 0},0,${rnd(.5, .95)})`;
        cx.fillRect(Math.round(b.x + fx), Math.round(b.y + fy), 6, 6);
      });
    }
  } else {
    // 이미지 로드 실패 시 폴백 사각형
    cx.fillStyle = ph === 3 ? '#aa0808' : ph === 2 ? '#8a4400' : '#5522aa';
    cx.fillRect(b.x - 45, b.y - 30, 90, 60);
  }

  drawBossHPBar(b);
}

// ── 보스 상태 ─────────────────────────────────────────────────────

let boss = null, bossWave = false;
let bossWarnT = 0, bossWarnActive = false;

function isBossWave(n) { return n % 5 === 0; }

function startBossWarning(n) {
  bossWarnActive = true;
  bossWarnT      = 3.5;
  doShake(7, 3.5); // 경고 내내 화면 흔들림
}

function spawnBossNow(n) {
  bossWarnActive = false;
  bossWarnT      = 0;

  const tier     = Math.ceil(n / 5);
  const hp       = Math.floor(80 + tier * 90);  // tier1→170, tier6→620
  const speedMul = 0.6 + tier * 0.1;            // tier1→0.7, tier6→1.2
  const shootMul = 2.5 - tier * 0.2;            // tier1→2.3배 느림, tier6→1.3배

  boss = {
    x: W / 2, y: -100,
    w: 90, h: 60,
    hp, maxHp: hp,
    phase:    1,
    moveDir:  1,
    sineT:    0,
    shootT:   1.5,
    summonT:  9,
    specialT: rnd(4, 6),
    dodgeT:   rnd(1, 2),
    alive:    true,
    frame:    0,
    entering: true,
    pathT:    0,
    tier, speedMul, shootMul,
    chaosAction: 'sweep',
    chaosT:      rnd(2, 4),
    chaosDt:     0,
  };
  bossWave = true;
}

function updateBossWarn(dt) {
  if (!bossWarnActive) return;
  bossWarnT -= dt;
  if (bossWarnT <= 0) spawnBossNow(waveIdx);
}

// ── 보스 이동 ─────────────────────────────────────────────────────

/** HP % 기준 페이즈 전환 판정 및 연출 */
function checkBossPhaseTransition(pct) {
  const newPh = pct > .66 ? 1 : pct > .33 ? 2 : 3;
  if (newPh <= boss.phase) return;

  boss.phase = newPh;
  flashIt(newPh === 3 ? 'rgba(255,0,0,.3)' : 'rgba(255,120,0,.25)');
  doShake(6, .3);
  addFx(`PHASE ${boss.phase}!`, W / 2, H * .35, '#f80', 18);
  bossSpecial();
  boss.specialT = rnd(3, 5);
}

/** tier 1~4 일반 이동 패턴 */
function updateBossNormalMovement(dt, spd) {
  // phase 2: 불규칙 방향 전환 지그재그
  if (boss.phase === 2) {
    boss.dodgeT -= dt;
    if (boss.dodgeT <= 0) {
      boss.moveDir *= -1;
      boss.dodgeT   = rnd(.8, 1.8);
    }
  }

  boss.x += boss.moveDir * spd * dt;

  // phase 3: 사인파 상하 이동 / phase 2: 완만한 상하 이동
  if      (boss.phase === 3) boss.y = 105 + Math.sin(boss.sineT * 1.6) * 52;
  else if (boss.phase === 2) boss.y = 105 + Math.sin(boss.sineT * .75) * 26;

  if (boss.x < 52 || boss.x > W - 52) boss.moveDir *= -1;
  boss.x = clamp(boss.x, 52, W - 52);
}

/**
 * tier 5/6 혼돈 이동: 1.5~3.2초마다 행동 패턴을 랜덤 전환.
 * track / vdrop / rush / teleport / circle / sweep 중 택 1.
 */
function updateBossChaos(dt, spd) {
  boss.chaosT  -= dt;
  boss.chaosDt += dt;

  if (boss.chaosT <= 0) {
    boss.chaosAction = pick(['track', 'vdrop', 'rush', 'teleport', 'circle', 'sweep']);
    boss.chaosT  = rnd(1.5, 3.2);
    boss.chaosDt = 0;

    // 순간이동: 전환 시점에 즉시 위치 변경 + 연출
    if (boss.chaosAction === 'teleport') {
      boss.x = rnd(80, W - 80);
      boss.y = rnd(70, H * .38);
      flashIt('rgba(160,0,255,.42)');
      doShake(5, .3);
      addFx('!!', boss.x, boss.y - 28, '#f0f', 16);
    }
  }

  const cspd = spd * 1.65;
  switch (boss.chaosAction) {
    case 'track': // 플레이어 추격
      if (P) {
        const dx = P.x - boss.x, dy = P.y - boss.y;
        const l  = Math.hypot(dx, dy) || 1;
        boss.x += dx / l * cspd * dt;
        boss.y += dy / l * cspd * .6 * dt;
      }
      break;

    case 'vdrop': // 수직 낙하 후 복귀
      if      (boss.chaosDt < 0.35) boss.y += 540 * dt;
      else if (boss.chaosDt < 0.72) boss.y -= 540 * dt;
      else                          boss.y += (105 - boss.y) * dt * 5;
      break;

    case 'rush': // 플레이어 방향 돌진
      if (boss.chaosDt < 0.45 && P) {
        const dx = P.x - boss.x, dy = P.y - boss.y;
        const l  = Math.hypot(dx, dy) || 1;
        boss.x += dx / l * 460 * dt;
        boss.y += dy / l * 390 * dt;
      } else {
        boss.y += (105 - boss.y) * dt * 4;
      }
      break;

    case 'circle': // 원 궤도
      boss.x = W / 2 + Math.cos(boss.sineT * 1.5) * (W * .34);
      boss.y = H * .2 + Math.sin(boss.sineT * 1.5) * 58;
      break;

    case 'teleport':
      break; // 전환 시점에 이미 처리

    default: // sweep — 빠른 수평 이동
      boss.x += boss.moveDir * cspd * dt;
      if (boss.x < 52 || boss.x > W - 52) boss.moveDir *= -1;
      break;
  }

  boss.x = clamp(boss.x, 52, W - 52);
  boss.y = clamp(boss.y, 60, H * .58);
}

function updateBoss(dt) {
  if (!boss || !boss.alive) return;
  boss.frame++;

  // 등장 연출: 화면 위에서 베지어 경로로 진입
  if (boss.entering) {
    boss.pathT = Math.min(1, boss.pathT + dt * .4);
    boss.y     = cbez(boss.pathT, -120, -70, 70, 105);
    if (boss.pathT >= 1) boss.entering = false;
    return;
  }

  const pct = boss.hp / boss.maxHp;
  checkBossPhaseTransition(pct);

  boss.sineT += dt;
  const spd = [0, 72, 115, 162][boss.phase] * boss.speedMul;

  if (boss.tier >= 5) updateBossChaos(dt, spd);
  else                updateBossNormalMovement(dt, spd);

  // 기본 발사
  boss.shootT -= dt;
  if (boss.shootT <= 0) {
    bossShoot();
    boss.shootT = [0, 1.35, .95, .65][boss.phase] * boss.shootMul;
  }

  // 특수 공격
  boss.specialT -= dt;
  if (boss.specialT <= 0) {
    bossSpecial();
    boss.specialT = [0, 7, 5.5, 4][boss.phase] * boss.shootMul * .65;
  }

  // 미니언 소환 (phase 2+)
  if (boss.phase >= 2) {
    boss.summonT -= dt;
    if (boss.summonT <= 0) {
      boss.summonT = boss.phase === 3 ? 5 : 8;
      bossSpawnMinions();
    }
  }
}

// ── 보스 기본 발사 ────────────────────────────────────────────────

function makeBossBullet(vx, vy, type = 'B') {
  return { x: boss.x, y: boss.y + 30, vx, vy, w: 7, h: 14, alive: true, t: type };
}

function bossShootPhase1(sp) {
  // phase 1: 3방향 고정
  [-20, 0, 20].forEach(a => {
    const r = a * Math.PI / 180;
    eBullets.push(makeBossBullet(Math.sin(r) * sp, Math.cos(r) * sp));
  });
}

function bossShootPhase2(sp) {
  // phase 2: 5방향 + 50% 확률 유도탄
  [-40, -20, 0, 20, 40].forEach(a => {
    const r = a * Math.PI / 180;
    eBullets.push(makeBossBullet(Math.sin(r) * sp, Math.cos(r) * sp));
  });
  if (P && Math.random() < .5) {
    const dx = P.x - boss.x, dy = P.y - boss.y;
    const l  = Math.hypot(dx, dy) || 1;
    eBullets.push({
      x: boss.x, y: boss.y + 30,
      vx: dx / l * sp * 1.2, vy: dy / l * sp * 1.2,
      w: 6, h: 12, alive: true, t: 'C',
    });
  }
}

function bossShootPhase3(sp) {
  // phase 3: 7방향 + 유도탄 2발
  [-60, -40, -20, 0, 20, 40, 60].forEach(a => {
    const r = a * Math.PI / 180;
    eBullets.push(makeBossBullet(Math.sin(r) * sp, Math.cos(r) * sp));
  });
  if (P) {
    const dx = P.x - boss.x, dy = P.y - boss.y;
    const l  = Math.hypot(dx, dy) || 1;
    [-20, 20].forEach(ox => {
      eBullets.push({
        x: boss.x + ox, y: boss.y + 30,
        vx: dx / l * sp * 1.35, vy: dy / l * sp * 1.35,
        w: 6, h: 12, alive: true, t: 'C',
      });
    });
  }
}

function bossShoot() {
  const sp = 188;
  if      (boss.phase === 1) bossShootPhase1(sp);
  else if (boss.phase === 2) bossShootPhase2(sp);
  else                       bossShootPhase3(sp);
}

// ── 보스 특수 공격 ────────────────────────────────────────────────

function bossSpecialCross(sp) {
  // 크로스: 대각선 4방향탄
  [45, 135, 225, 315].forEach(a => {
    const r = a * Math.PI / 180;
    eBullets.push(makeBossBullet(Math.sin(r) * sp, Math.cos(r) * sp));
  });
  addFx('CROSS!', boss.x, boss.y - 24, '#fc0', 13);
}

function bossSpecialBurst(sp) {
  // 에임드 버스트: 플레이어 방향 3발 부채꼴 유도탄
  if (!P) return;
  const dx = P.x - boss.x, dy = P.y - boss.y;
  const a  = Math.atan2(dx, dy);
  [-0.14, 0, 0.14].forEach(off => {
    eBullets.push(makeBossBullet(
      Math.sin(a + off) * sp * 1.15,
      Math.cos(a + off) * sp * 1.15,
      'C',
    ));
  });
  addFx('BURST!', boss.x, boss.y - 24, '#f44', 13);
}

function bossSpecialVolley(sp) {
  // 볼리: 플레이어 방향 5발 집중탄
  if (!P) return;
  const dx = P.x - boss.x, dy = P.y - boss.y;
  const a  = Math.atan2(dx, dy);
  for (let i = -2; i <= 2; i++) {
    eBullets.push(makeBossBullet(
      Math.sin(a + i * .18) * sp * 1.1,
      Math.cos(a + i * .18) * sp * 1.1,
    ));
  }
  addFx('VOLLEY!', boss.x, boss.y - 24, '#f00', 15);
}

function bossSpecial() {
  if (!boss || !boss.alive) return;
  const sp = 200;
  if      (boss.phase === 1) bossSpecialCross(sp);
  else if (boss.phase === 2) bossSpecialBurst(sp);
  else                       bossSpecialVolley(sp);
}

// ── 보스 미니언 소환 ──────────────────────────────────────────────

/** phase 3는 3기 소환, tier3+ phase3는 C형(유도탄) 사용 */
function bossSpawnMinions() {
  const count = boss.phase === 3 ? 3 : 2;
  const type  = boss.tier >= 3 && boss.phase === 3 ? 'C' : 'A';
  const offs  = count === 3 ? [-72, 0, 72] : [-55, 55];

  offs.forEach(ox => {
    const sq = makeSquad(type, 'SOLO', boss.x + ox, boss.y + 70, 0, 'TOP');
    sq.phase  = 'ATTACK';
    const m   = sq.members[0];
    m.ready   = true;
    m.atk     = true;
    if (P) {
      const dx = P.x - m.x, dy = P.y - m.y;
      const l  = Math.hypot(dx, dy) || 1;
      const sp = 170 + rnd(0, 50);
      m.atkVx  = dx / l * sp;
      m.atkVy  = dy / l * sp;
    }
    waveSquads.push(sq);
  });
}

// ── 보스 처치 ─────────────────────────────────────────────────────

function killBoss() {
  if (!boss) return;
  boss.alive = false;

  const pts = 1200 + boss.tier * 600;
  score += pts;

  // 폭발 이펙트 (3곳)
  explode(boss.x,      boss.y,      'B');
  explode(boss.x - 28, boss.y - 18, 'B');
  explode(boss.x + 28, boss.y - 18, 'B');
  addFx(`BOSS DOWN! +${pts}`, W / 2, H * .4, '#ff0', 22);
  doShake(14, .9);
  flashIt('rgba(255,200,0,.65)');

  // 고정 아이템 드롭 (P, B, F)
  [{x: -22, t: 'P'}, {x: 22, t: 'B'}, {x: 0, t: 'F'}].forEach(d => {
    pups.push({ x: boss.x + d.x, y: boss.y, vy: 72, w: 18, h: 18, t: d.t, alive: true, bob: rnd(0, Math.PI * 2) });
  });
  // 30% 확률로 L (목숨) 추가 드롭
  if (Math.random() < .3) {
    pups.push({ x: boss.x, y: boss.y + 30, vy: 72, w: 18, h: 18, t: 'L', alive: true, bob: 0 });
  }

  score += 500 * waveIdx;
  updateHUD();

  if (waveIdx >= TOTAL_WAVES) {
    setTimeout(() => {
      STATE = 'CLEAR';
      if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('LocalMaxScore', hiScore);
      }
    }, 1800);
  } else {
    betweenWave = true;
    betweenT    = 1.5;
  }
}
