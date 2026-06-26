// ── Canvas Setup ──────────────────────────────────────────────────
const cv=document.getElementById('canvas'), cx=cv.getContext('2d');
cx.imageSmoothingEnabled=false;
const W=480, H=600;

// ── Utilities ────────────────────────────────────────────────────
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
function cbez(t,p0,p1,p2,p3){const m=1-t;return m*m*m*p0+3*m*m*t*p1+3*m*t*t*p2+t*t*t*p3;}

// ── Constants ────────────────────────────────────────────────────
const P_SPD=248, P_W=24, P_H=28, FIRE_RATE=0.13;
const BOMB_MAX=3, SKILL_GOAL=20, FIREBALL_DUR=5, GHOST_DUR=15;
const RAPID_DUR=8, PIERCE_DUR=10, SHIELD_DUR=12, POWER_DUR=14;
const TOTAL_WAVES=30; // 게임 완주 기준 웨이브 수
const WPN_NAMES=['','SINGLE','DOUBLE','TRIPLE','SPREAD','FIREBALL'];
const WPN_COLS=['','#8df','#0ff','#f80','#f0f','#f44'];
