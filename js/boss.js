// ── Boss ──────────────────────────────────────────────────────────
let boss=null, bossWave=false;
let bossWarnT=0, bossWarnActive=false; // warning cutscene
function isBossWave(n){return n%5===0;}

function startBossWarning(n){
  bossWarnActive=true;bossWarnT=3.5;
  doShake(7,3.5); // 경고 내내 화면 흔들림
}
function spawnBossNow(n){
  bossWarnActive=false;bossWarnT=0;
  const tier=Math.ceil(n/5);
  const hp=Math.floor(80+tier*90);        // tier1→170, tier2→260, tier3→350, tier4→440
  const speedMul=0.6+tier*0.1;            // tier1→0.7, tier2→0.8, tier3→0.9, tier4→1.0
  const shootMul=1.8-tier*0.2;            // tier1→1.6배 느림, tier4→원본
  boss={x:W/2,y:-100,w:90,h:60,hp,maxHp:hp,phase:1,moveDir:1,sineT:0,
        shootT:1.5,summonT:9,specialT:rnd(4,6),dodgeT:rnd(1,2),
        alive:true,frame:0,entering:true,pathT:0,tier,speedMul,shootMul};
  bossWave=true;
}
function updateBossWarn(dt){
  if(!bossWarnActive)return;
  bossWarnT-=dt;if(bossWarnT<=0)spawnBossNow(waveIdx);
}
function updateBoss(dt){
  if(!boss||!boss.alive)return;
  boss.frame++;
  if(boss.entering){
    boss.pathT=Math.min(1,boss.pathT+dt*.4);
    boss.y=cbez(boss.pathT,-120,-70,70,105);
    if(boss.pathT>=1)boss.entering=false;return;
  }
  const pct=boss.hp/boss.maxHp;
  const newPh=pct>.66?1:pct>.33?2:3;
  if(newPh>boss.phase){boss.phase=newPh;flashIt(newPh===3?'rgba(255,0,0,.3)':'rgba(255,120,0,.25)');doShake(6,.3);addFx(`PHASE ${boss.phase}!`,W/2,H*.35,'#f80',18);bossSpecial();boss.specialT=rnd(3,5);}
  boss.sineT+=dt;const spd=[0,72,115,162][boss.phase]*boss.speedMul;
  if(boss.phase===2){boss.dodgeT-=dt;if(boss.dodgeT<=0){boss.moveDir*=-1;boss.dodgeT=rnd(.8,1.8);}}
  boss.x+=boss.moveDir*spd*dt;
  if(boss.phase===3)boss.y=105+Math.sin(boss.sineT*1.6)*52;
  else if(boss.phase===2)boss.y=105+Math.sin(boss.sineT*.75)*26;
  if(boss.x<52||boss.x>W-52)boss.moveDir*=-1;boss.x=clamp(boss.x,52,W-52);
  boss.shootT-=dt;if(boss.shootT<=0){bossShoot();boss.shootT=[0,1.35,.95,.65][boss.phase]*boss.shootMul;}
  boss.specialT-=dt;if(boss.specialT<=0){bossSpecial();boss.specialT=[0,7,5.5,4][boss.phase]*boss.shootMul*.65;}
  if(boss.phase>=2){boss.summonT-=dt;if(boss.summonT<=0){boss.summonT=boss.phase===3?5:8;bossSpawnMinions();}}
}
function bossShoot(){
  const sp=188;const mk=(vx,vy)=>({x:boss.x,y:boss.y+30,vx,vy,w:7,h:14,alive:true,t:'B'});
  if(boss.phase===1){[-20,0,20].forEach(a=>{const r=a*Math.PI/180;eBullets.push(mk(Math.sin(r)*sp,Math.cos(r)*sp));});}
  else if(boss.phase===2){[-40,-20,0,20,40].forEach(a=>{const r=a*Math.PI/180;eBullets.push(mk(Math.sin(r)*sp,Math.cos(r)*sp));});
    if(P&&Math.random()<.5){const dx=P.x-boss.x,dy=P.y-boss.y,l=Math.hypot(dx,dy)||1;eBullets.push({x:boss.x,y:boss.y+30,vx:dx/l*sp*1.2,vy:dy/l*sp*1.2,w:6,h:12,alive:true,t:'C'});}}
  else{[-60,-40,-20,0,20,40,60].forEach(a=>{const r=a*Math.PI/180;eBullets.push(mk(Math.sin(r)*sp,Math.cos(r)*sp));});
    if(P){const dx=P.x-boss.x,dy=P.y-boss.y,l=Math.hypot(dx,dy)||1;
      [-20,20].forEach(ox=>eBullets.push({x:boss.x+ox,y:boss.y+30,vx:dx/l*sp*1.35,vy:dy/l*sp*1.35,w:6,h:12,alive:true,t:'C'}));}}
}
function bossSpawnMinions(){
  // phase 3는 3기, tier3+ phase3는 C형(유도탄) 사용
  const count=boss.phase===3?3:2;
  const type=boss.tier>=3&&boss.phase===3?'C':'A';
  const offs=count===3?[-72,0,72]:[-55,55];
  offs.forEach(ox=>{
    const sq=makeSquad(type,'SOLO',boss.x+ox,boss.y+70,0,'TOP');sq.phase='ATTACK';
    const m=sq.members[0];m.ready=true;m.atk=true;
    if(P){const dx=P.x-m.x,dy=P.y-m.y,l=Math.hypot(dx,dy)||1,sp=170+rnd(0,50);m.atkVx=dx/l*sp;m.atkVy=dy/l*sp;}
    waveSquads.push(sq);
  });
}
function bossSpecial(){
  if(!boss||!boss.alive)return;
  const sp=200,mk=(vx,vy,tp)=>({x:boss.x,y:boss.y+30,vx,vy,w:7,h:14,alive:true,t:tp||'B'});
  if(boss.phase===1){
    // 크로스: 4방향 대각선탄
    [45,135,225,315].forEach(a=>{const r=a*Math.PI/180;eBullets.push(mk(Math.sin(r)*sp,Math.cos(r)*sp));});
    addFx('CROSS!',boss.x,boss.y-24,'#fc0',13);
  }else if(boss.phase===2){
    // 에임드 버스트: 플레이어 방향 3발 부채꼴 유도탄
    if(!P)return;
    const dx=P.x-boss.x,dy=P.y-boss.y,a=Math.atan2(dx,dy);
    [-0.14,0,0.14].forEach(off=>{eBullets.push(mk(Math.sin(a+off)*sp*1.15,Math.cos(a+off)*sp*1.15,'C'));});
    addFx('BURST!',boss.x,boss.y-24,'#f44',13);
  }else{
    // 볼리: 플레이어 방향 5발 집중탄
    if(!P)return;
    const dx=P.x-boss.x,dy=P.y-boss.y,a=Math.atan2(dx,dy);
    for(let i=-2;i<=2;i++)eBullets.push(mk(Math.sin(a+i*.18)*sp*1.1,Math.cos(a+i*.18)*sp*1.1));
    addFx('VOLLEY!',boss.x,boss.y-24,'#f00',15);
  }
}
function killBoss(){
  if(!boss)return;boss.alive=false;
  const pts=1200+boss.tier*600;score+=pts;
  explode(boss.x,boss.y,'B');explode(boss.x-28,boss.y-18,'B');explode(boss.x+28,boss.y-18,'B');
  addFx(`BOSS DOWN! +${pts}`,W/2,H*.4,'#ff0',22);doShake(14,.9);flashIt('rgba(255,200,0,.65)');
  [{x:-22,t:'P'},{x:22,t:'B'},{x:0,t:'F'}].forEach(d=>pups.push({x:boss.x+d.x,y:boss.y,vy:72,w:18,h:18,t:d.t,alive:true,bob:rnd(0,Math.PI*2)}));
  if(Math.random()<.3)pups.push({x:boss.x,y:boss.y+30,vy:72,w:18,h:18,t:'L',alive:true,bob:0});
  score+=500*waveIdx;updateHUD();
  if(waveIdx>=TOTAL_WAVES){
    setTimeout(()=>{STATE='CLEAR';if(score>hiScore){hiScore=score;localStorage.setItem('LocalMaxScore',hiScore);}},1800);
  }else{betweenWave=true;betweenT=1.5;}
}

// ── Boss Warning Cutscene ─────────────────────────────────────────
function drawBossWarning(){
  if(!bossWarnActive)return;
  const now=performance.now();
  // 초당 4회 교번 플래시 (빠를수록 긴장감 상승)
  const flash=Math.floor(bossWarnT*4)%2===0;

  // ① 전체 화면 빨간 오버레이 — 플래시/비플래시 교번
  cx.fillStyle=`rgba(160,0,0,${flash?.58:.10})`;
  cx.fillRect(0,0,W,H);

  // ② CRT 스캔라인 — 레트로 느낌
  cx.fillStyle='rgba(0,0,0,.20)';
  for(let y=0;y<H;y+=3)cx.fillRect(0,y,W,1);

  // ③ 픽셀 아트 코너 브래킷 (4개 모서리, 각 6칸×4px)
  const S=4, M=14, L=6;
  cx.fillStyle=flash?'#ff2222':'#880000';
  [[M,M,1,1],[W-M,M,-1,1],[M,H-M,1,-1],[W-M,H-M,-1,-1]].forEach(([ox,oy,sx,sy])=>{
    for(let i=0;i<L;i++)cx.fillRect(ox+sx*i*S,oy,S,S);         // 수평
    for(let i=1;i<L;i++)cx.fillRect(ox,oy+sy*i*S,S,S);         // 수직
  });

  // ④ 중앙 구분선 (점선 픽셀)
  cx.fillStyle=flash?'#cc0000':'#440000';
  for(let x=0;x<W;x+=8){cx.fillRect(x,H/2-34,5,2);cx.fillRect(x,H/2+20,5,2);}

  cx.textAlign='center';
  const pulse=.88+.12*Math.sin(now*.014);
  cx.globalAlpha=pulse;

  // ⑤ WARNING 텍스트 — 외곽 글로우 2겹 후 본체
  cx.shadowColor='#ff0000';
  cx.shadowBlur=48;
  cx.fillStyle='rgba(255,0,0,.4)';
  cx.font='bold 50px Courier New';
  cx.fillText('⚠  WARNING  ⚠',W/2,H/2-48); // 글로우 레이어
  cx.shadowBlur=22;
  cx.fillStyle=flash?'#ffffff':'#ff3333';
  cx.fillText('⚠  WARNING  ⚠',W/2,H/2-48); // 본체

  // ⑥ 서브타이틀
  cx.shadowBlur=10;cx.shadowColor='#ff0000';
  cx.fillStyle=flash?'#ffcccc':'#aa4444';
  cx.font='bold 15px Courier New';
  cx.fillText('BOSS  IS  APPROACHING',W/2,H/2+4);

  // ⑦ 카운트다운 — 박동(scale) 애니메이션
  const cnt=Math.ceil(bossWarnT);
  const beat=1+.12*Math.max(0,Math.sin(now*.018)); // 심장박동
  cx.save();
  cx.translate(W/2,H/2+64);cx.scale(beat,beat);
  cx.shadowBlur=44;cx.shadowColor='#ff0000';
  cx.fillStyle=flash?'#ffffff':'#ff5555';
  cx.font='bold 62px Courier New';
  cx.fillText(cnt,0,0);
  cx.restore();

  cx.shadowBlur=0;cx.globalAlpha=1;cx.textAlign='left';
}
