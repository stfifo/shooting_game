// ── Wave definitions ──────────────────────────────────────────────
const WAVE_NORMAL=[
  [['A','LINE5',W/2,90,0,'TOP']],
  [['A','V5',W/2,100,0,'LEFT']],
  [['A','LINE7',W/2,85,0,'RIGHT'],['A','V5',160,170,3,'TOP']],
  [['B','TWIN2',W/2,110,0,'TOP']],
  [['A','ARROW7',W/2,92,0,'LEFT'],['B','TWIN2',W/2,185,3.5,'TOP']],
  [['C','V5',W/2,105,0,'DIVEL']],
  [['C','LINE5',W/2,88,0,'DIVER'],['A','LINE7',W/2,185,3,'TOP']],
  [['B','LINE5',W/2,100,0,'SWING'],['C','V5',160,195,4,'LEFT'],['C','V5',320,195,4,'RIGHT']],
  [['A','BOX9',W/2,115,0,'TOP']],
  [['A','V5',140,100,0,'LEFT'],['B','TWIN2',340,100,2,'RIGHT']],
  [['C','ARROW7',W/2,95,0,'SWING']],
  [['A','LINE7',W/2,82,0,'DIVEL'],['C','V5',W/2,185,3,'RIGHT'],['B','TWIN2',W/2,265,6,'TOP']],
];
let waveIdx=0, betweenWave=false, betweenT=0;
function launchWave(n){
  wave=n;waveIdx=n;boss=null;bossWave=false;bossWarnActive=false;waveSquads=[];
  if(isBossWave(n)){
    startBossWarning(n); // warning plays, boss spawns after 3.5s
    if(n>=10)waveSquads.push(makeSquad('A','LINE5',W/2,85,.5,'TOP'));
    if(n>=15)waveSquads.push(makeSquad('B','TWIN2',W/2,185,2,'TOP'));
  }else{
    const def=WAVE_NORMAL[(n-1)%WAVE_NORMAL.length];
    waveSquads=def.map(d=>makeSquad(d[0],d[1],d[2],d[3],d[4]||0,d[5]||'TOP'));
  }
  betweenWave=false;updateHUD();
}
function updateWaves(dt){
  if(betweenWave){betweenT-=dt;if(betweenT<=0){betweenWave=false;launchWave(waveIdx+1);}return;}
  updateBossWarn(dt);
  waveSquads.forEach(sq=>updateSquad(sq,dt));
  if(bossWave)updateBoss(dt);
  // bossWarnActive 중에는 wave clear 판정 금지 — 스킬/폭탄으로 호위 편대를 전멸시켜도
  // 보스 경고 연출이 끝날 때까지 다음 웨이브로 넘어가지 않도록 함
  if(!bossWave&&!bossWarnActive){
    const launched=waveSquads.filter(sq=>sq.phase!=='DELAY');
    if(launched.length>0&&launched.every(sq=>squadDone(sq))){
      score+=500*waveIdx;updateHUD();betweenWave=true;betweenT=1.5;
    }
  }
}
