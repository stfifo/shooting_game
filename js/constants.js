// ── Canvas Setup ──────────────────────────────────────────────────
const cv = document.getElementById('canvas');
const cx = cv.getContext('2d');
cx.imageSmoothingEnabled = false;
const W = 480, H = 600;

// ── Utilities ────────────────────────────────────────────────────
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rnd   = (a, b) => a + Math.random() * (b - a);
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

function cbez(t, p0, p1, p2, p3) {
  const m = 1 - t;
  return m*m*m*p0 + 3*m*m*t*p1 + 3*m*t*t*p2 + t*t*t*p3;
}

// ── Player ────────────────────────────────────────────────────────
const P_SPD = 248;       // 이동 속도 (px/s)
const P_W = 24, P_H = 28;
const FIRE_RATE = 0.13;  // 기본 연사 간격 (초)

// ── Ability Durations ─────────────────────────────────────────────
const FIREBALL_DUR = 10; // 파이어볼 지속 시간 (초)
const GHOST_DUR    = 15; // 윙맨 지속 시간 (초)
const RAPID_DUR    = 8;  // 속사 지속 시간 (초)
const PIERCE_DUR   = 10; // 관통탄 지속 시간 (초)
const SHIELD_DUR   = 12; // 쉴드 기준값 (참고용 — 실제 발동은 shieldT=1 이진 플래그)
const POWER_DUR    = 14; // 파워업 무기 타이머 (초)

// ── Capacity Limits ───────────────────────────────────────────────
const BOMB_MAX   = 5;
const LIFE_MAX   = 5;
const SKILL_GOAL = 20; // 스킬 충전에 필요한 킬 수

// ── Bomb Blast ────────────────────────────────────────────────────
const BOMB_DIST      = 5;  // 초기 폭탄 반경 계수
const BOMB_DIST_UNIT = 30; // 계수 1당 픽셀 (실제 반경 = bombDist * BOMB_DIST_UNIT)

// ── Bullet Speeds ─────────────────────────────────────────────────
const BULLET_SPEED   = 480; // 일반 총알 속도 (px/s)
const FIREBALL_SPEED = 340; // 파이어볼 총알 속도 (느리지만 크고 관통)

// ── Wave / Progression ────────────────────────────────────────────
const TOTAL_WAVES = 30;

// ── Weapon Names & Colors (index = weapon level 1~5) ─────────────
const WPN_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'SPREAD', 'FIREBALL'];
const WPN_COLS  = ['', '#8df',   '#0ff',   '#f80',   '#f0f',   '#f44'   ];
