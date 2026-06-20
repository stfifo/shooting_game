// ── State ────────────────────────────────────────────────────────
let STATE='IDLE';
let score=0, hiScore=+(localStorage.getItem('LocalMaxScore')||0);
let lives=3, wave=0, combo=0, comboT=0;
let bombs=2, skillKills=0, fireballT=0, ghostT=0;
let shakeAmt=0, shakeDur=0, shakeX=0, shakeY=0;
let flashA=0, flashCol='#fff';
