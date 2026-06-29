// ── State ────────────────────────────────────────────────────────

// 게임 진행 상태 머신
let STATE = 'IDLE';

// 점수
let score   = 0;
let hiScore = +(localStorage.getItem('LocalMaxScore') || 0);

// 플레이어 자원
let lives = 3;
let bombs = 2;
let wave  = 0;

// 콤보 시스템
let combo  = 0;
let comboT = 0; // 콤보 유지 타이머 (초)

// 스킬 충전 및 특수 능력 타이머
let skillKills = 0;
let fireballT  = 0;
let ghostT     = 0;
let rapidT     = 0;
let pierceT    = 0;
let shieldT    = 0; // 이진 플래그: 1=활성, 0=비활성

// 폭탄 반경 계수 (아이템 E로 증가, 최대 BOMB_DIST+4)
let bombDist = BOMB_DIST;

// 화면 흔들림
let shakeAmt = 0, shakeDur = 0;
let shakeX   = 0, shakeY   = 0;

// 전면 플래시 오버레이
let flashA   = 0;
let flashCol = '#fff';

// 이스터에그: 게임 시작 후 첫 피격까지 이동키 미입력 여부
let hasMoved = false;

// 이스터에그: Shift 5회 연속 → 무적 토글
let godMode     = false;
let cPressCount = 0;
