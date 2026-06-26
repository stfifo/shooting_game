// ── State ────────────────────────────────────────────────────────
let STATE='IDLE';
let score=0, hiScore=+(localStorage.getItem('LocalMaxScore')||0);
let lives=3, wave=0, combo=0, comboT=0;
let bombs=2, skillKills=0, fireballT=0, ghostT=0;
let rapidT=0, pierceT=0, shieldT=0;
let bombDist=5; // 폭탄 폭발 반경 계수 (아이템 E로 증가, 실제 반경 = bombDist * 30px)
let shakeAmt=0, shakeDur=0, shakeX=0, shakeY=0;
let flashA=0, flashCol='#fff';
let hasMoved=false; // 이스터에그: 게임 시작 후 첫 피격까지 이동키 미입력 여부
let godMode=false, cPressCount=0; // 이스터에그: C키 5회 → 무적
