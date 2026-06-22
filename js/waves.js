// ── Wave definitions ──────────────────────────────────────────────
// 웨이브별 랜덤 편대 생성: 티어(1-4)에 따라 편대 수·적 종류·대형·진입 경로를 무작위 선택
function randWave(n){
  const tier=Math.min(4,Math.ceil(n/5));
  const fmtKeys=Object.keys(FMTS).filter(k=>k!=='SOLO');
  const entryKeys=Object.keys(ENTRY);
  // 티어별 적 종류 풀 (앞쪽일수록 많이 나옴)
  const typePools=[
    ['A','A','A','A','B'],        // tier1: A 위주
    ['A','A','B','B','C'],        // tier2: B/C 등장
    ['A','B','B','C','C'],        // tier3: B/C 비율 증가
    ['B','B','C','C','C'],        // tier4: B/C 위주
  ];
  // 티어별 편대 수 범위 [min, max]
  const countRange=[[1,2],[1,3],[2,3],[2,4]][tier-1];
  const count=countRange[0]+Math.floor(Math.random()*(countRange[1]-countRange[0]+1));
  const squads=[];let delay=0;
  for(let i=0;i<count;i++){
    const type=pick(typePools[tier-1]);
    const fmt=pick(fmtKeys);
    const entry=pick(entryKeys);
    // 대형 너비에 맞춰 피벗 X 범위 제한 (화면 밖 배치 방지)
    const maxSp=Math.max(0,...(FMTS[fmt]||[]).map(o=>Math.abs(o[0])));
    const lo=maxSp+55,hi=W-maxSp-55;
    const pivotX=lo<hi?rnd(lo,hi):W/2;
    squads.push([type,fmt,pivotX,rnd(75,185),delay,entry]);
    delay+=rnd(1.5,3.5);
  }
  return squads;
}
let waveIdx=0, betweenWave=false, betweenT=0;
function launchWave(n){
  wave=n;waveIdx=n;boss=null;bossWave=false;bossWarnActive=false;waveSquads=[];
  if(isBossWave(n)){
    startBossWarning(n); // warning plays, boss spawns after 3.5s
    if(n>=10)waveSquads.push(makeSquad('A','LINE5',W/2,85,.5,'TOP'));
    if(n>=15)waveSquads.push(makeSquad('B','TWIN2',W/2,185,2,'TOP'));
  }else{
    const defs=randWave(n);
    waveSquads=defs.map(d=>makeSquad(d[0],d[1],d[2],d[3],d[4]||0,d[5]||'TOP'));
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
