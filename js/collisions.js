// ── Collisions ───────────────────────────────────────────────────

// 히트박스 축소 계수 (스프라이트보다 좁게 판정)
const ENEMY_BODY_HITBOX  = 0.65; // 적 몸통 → 플레이어 충돌
const BOSS_BULLET_HITBOX = 0.85; // 플레이어 총알 → 보스 충돌
const BOSS_BODY_HITBOX   = 0.55; // 보스 몸통 → 플레이어 충돌

/** AABB 충돌 판정 */
function ovlp(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2
      && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

/** 적 처치: 점수 계산 + 스킬 충전 + 폭발 + 아이템 드롭 */
function killEnemy(m, bomb = false) {
  m.alive = false;

  const mul = bomb ? 1 : Math.max(1, 1 + Math.floor(combo / 5));
  score += (EDEFS[m.type]?.pts || 100) * mul;

  if (!bomb) {
    // wave 16+는 스킬 충전 3배
    const skillGain = wave > 15 ? 3 : 1;
    skillKills = Math.min(SKILL_GOAL, skillKills + skillGain);
    if (skillKills >= SKILL_GOAL && P && P.weapon !== 5)
      addFx('SKILL READY [X]', W / 2, 80, '#ff0', 13);
  }

  combo++;
  comboT = 3;
  explode(m.x, m.y, m.type);
  dropItem(m.x, m.y);
  if (!bomb) addFx(`+${(EDEFS[m.type]?.pts || 100) * mul}`, m.x, m.y - 10, '#fff', 12);
  updateHUD();
}

// ── 충돌 체크 서브루틴 ────────────────────────────────────────────

/** 플레이어 총알 vs 적 멤버 충돌 */
function checkBulletVsEnemies(b, ens) {
  ens.forEach(m => {
    if (!m.alive || !ovlp(b, m)) return;

    if (b.pierce) {
      // 관통탄: 같은 적에게 중복 피해 방지
      if (b.hset.has(m)) return;
      b.hset.add(m);
    } else {
      b.alive = false;
    }

    m.hp -= b.dmg || 1;
    if (m.hp <= 0) killEnemy(m);
    else addHitSpark(b.x, b.y);
  });
}

/** 플레이어 총알 vs 보스 충돌 */
function checkBulletVsBoss(b) {
  if (!boss || !boss.alive || boss.entering) return;

  const bh = { x: boss.x, y: boss.y, w: boss.w * BOSS_BULLET_HITBOX, h: boss.h * BOSS_BULLET_HITBOX };
  if (!ovlp(b, bh)) return;

  if (b.pierce) {
    // 관통탄은 보스에 1회만 피해
    if (!b.bossHit) {
      b.bossHit = true;
      boss.hp  -= b.dmg || 1;
      addHitSpark(boss.x, boss.y);
    }
  } else {
    b.alive   = false;
    boss.hp  -= b.dmg || 1;
    addHitSpark(boss.x, boss.y);
  }

  if (boss.hp <= 0) killBoss();
}

/** 적 총알 vs 플레이어 충돌 */
function checkEnemyBulletsVsPlayer() {
  eBullets.forEach(b => {
    if (!b.alive || !ovlp(b, P)) return;
    b.alive = false;
    hitPlayer();
  });
}

/** 적 몸통 vs 플레이어 충돌 (축소 히트박스 적용) */
function checkEnemyBodyVsPlayer(ens) {
  ens.forEach(m => {
    if (!m.alive) return;
    const smol = { x: m.x, y: m.y, w: m.w * ENEMY_BODY_HITBOX, h: m.h * ENEMY_BODY_HITBOX };
    if (!ovlp(smol, P)) return;
    killEnemy(m, true);
    hitPlayer();
  });
}

/** 보스 몸통 vs 플레이어 충돌 (축소 히트박스 적용) */
function checkBossBodyVsPlayer() {
  if (!boss || !boss.alive || boss.entering) return;
  const bh = { x: boss.x, y: boss.y, w: boss.w * BOSS_BODY_HITBOX, h: boss.h * BOSS_BODY_HITBOX };
  if (ovlp(bh, P)) hitPlayer();
}

function checkCollisions() {
  const ens = getEnemies();

  pBullets.forEach(b => {
    if (!b.alive) return;
    checkBulletVsEnemies(b, ens);
    checkBulletVsBoss(b);
  });

  if (!P || !P.alive || P.invT > 0) return;
  checkEnemyBulletsVsPlayer();
  checkEnemyBodyVsPlayer(ens);
  checkBossBodyVsPlayer();
}

function hitPlayer() {
  // 이스터에그: 첫 피격까지 이동키 미사용 → 웨이브 29 워프 (피격 페널티 없음)
  if (!hasMoved) {
    hasMoved = true; // 재발동 방지
    doShake(12, .8);
    flashIt('rgba(255,220,0,.8)');
    addFx('✦ STILL AS STONE ✦', W / 2, H / 2 - 18, '#ffe000', 22);
    addFx('WARP → WAVE 29',     W / 2, H / 2 + 14, '#fff',    15);
    setTimeout(() => { if (STATE === 'PLAYING') launchWave(29); }, 1200);
    return;
  }

  // 쉴드 활성: 피격 1회 흡수
  if (shieldT > 0) {
    shieldT = 0;
    addFx('SHIELD BREAK!', P.x, P.y - 24, '#0f8', 15);
    doShake(5, .25);
    flashIt('rgba(0,255,136,.25)');
    updateHUD();
    return;
  }

  // 실제 피격: 파워업 초기화 + 목숨 차감
  rapidT  = 0;
  pierceT = 0;
  if (!godMode) lives--;
  P.invT  = 2.5;
  if (!fireballT) { P.weapon = 1; P.wpTimer = 0; }
  P.fireT = .5;
  doShake(8, .38);
  flashIt('rgba(255,0,0,.4)');
  explode(P.x, P.y, 'A');

  if (lives <= 0) {
    P.alive = false;
    setTimeout(() => {
      STATE = 'GAMEOVER';
      if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('LocalMaxScore', hiScore);
      }
    }, 1800);
  }
  updateHUD();
}
