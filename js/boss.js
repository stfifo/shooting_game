// ── Boss ──────────────────────────────────────────────────────────

// ── Boss PNG sprites (tier 1-6) ───────────────────────────────────
const BOSS_IMGS=Array.from({length:6},(_,i)=>{
  const img=new Image();img.src=`asset/boss_${i+1}.png`;return img;
});
function drawBossSprite(b){
  if(!b||!b.alive)return;
  const ph=b.phase;
  const img=BOSS_IMGS[(b.tier||1)-1];
  if(img&&img.complete&&img.naturalWidth>0){
    const maxW=140,maxH=130;
    const scale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
    const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
    const dx=b.x-dw/2,dy=b.y-dh/2;
    cx.save();
    if(ph===3){cx.shadowBlur=24;cx.shadowColor='#ff2200';}
    else if(ph===2){cx.shadowBlur=16;cx.shadowColor='#ff7700';}
    else{cx.shadowBlur=8;cx.shadowColor='#8844ff';}
    cx.drawImage(img,dx,dy,dw,dh);cx.restore();
    if(ph===2){cx.globalAlpha=.18;cx.fillStyle='#ff8800';cx.fillRect(dx,dy,dw,dh);cx.globalAlpha=1;}
    if(ph===3){
      cx.globalAlpha=.28;cx.fillStyle='#ff2200';cx.fillRect(dx,dy,dw,dh);cx.globalAlpha=1;
      [[6,12],[-8,16],[3,6],[-5,20],[10,8]].forEach(([fx,fy])=>{
        cx.fillStyle=`rgba(255,${rnd(40,160)|0},0,${rnd(.5,.95)})`;
        cx.fillRect(Math.round(b.x+fx),Math.round(b.y+fy),6,6);
      });
    }
  }else{
    cx.fillStyle=ph===3?'#aa0808':ph===2?'#8a4400':'#5522aa';
    cx.fillRect(b.x-45,b.y-30,90,60);
  }
  const bx=8,by=8,bw=W-16,bh=10;
  cx.fillStyle='#111';cx.fillRect(bx,by,bw,bh);
  const pct=b.hp/b.maxHp,bars=Math.floor(bw/4);
  for(let i=0;i<bars;i++){
    if(i/bars>pct)break;
    cx.fillStyle=i/bars>.66?'#4f4':i/bars>.33?'#ff4':'#f44';
    cx.fillRect(bx+i*4,by,3,bh);
  }
  cx.strokeStyle='#444';cx.lineWidth=1;cx.strokeRect(bx,by,bw,bh);
  [1/3,2/3].forEach(m=>{cx.strokeStyle='#666';cx.beginPath();cx.moveTo(bx+bw*m,by);cx.lineTo(bx+bw*m,by+bh);cx.stroke();});
  cx.fillStyle='#fff6';cx.font='8px Courier New';cx.fillText('BOSS  HP',bx+4,by+bh-1);
  if(ph>1){cx.fillStyle='#ff4';cx.fillText(`PHASE ${ph}`,bx+bw-52,by+bh-1);}
}

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
  const shootMul=2.5-tier*0.2;            // tier1→2.3배 느림, tier6→1.3배 (모든 tier에서 기본보다 느림)
  boss={x:W/2,y:-100,w:90,h:60,hp,maxHp:hp,phase:1,moveDir:1,sineT:0,
        shootT:1.5,summonT:9,specialT:rnd(4,6),dodgeT:rnd(1,2),
        alive:true,frame:0,entering:true,pathT:0,tier,speedMul,shootMul,
        chaosAction:'sweep',chaosT:rnd(2,4),chaosDt:0};
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
  if(boss.tier>=5){
    updateBossChaos(dt,spd);
  }else{
    if(boss.phase===2){boss.dodgeT-=dt;if(boss.dodgeT<=0){boss.moveDir*=-1;boss.dodgeT=rnd(.8,1.8);}}
    boss.x+=boss.moveDir*spd*dt;
    if(boss.phase===3)boss.y=105+Math.sin(boss.sineT*1.6)*52;
    else if(boss.phase===2)boss.y=105+Math.sin(boss.sineT*.75)*26;
    if(boss.x<52||boss.x>W-52)boss.moveDir*=-1;boss.x=clamp(boss.x,52,W-52);
  }
  boss.shootT-=dt;if(boss.shootT<=0){bossShoot();boss.shootT=[0,1.35,.95,.65][boss.phase]*boss.shootMul;}
  boss.specialT-=dt;if(boss.specialT<=0){bossSpecial();boss.specialT=[0,7,5.5,4][boss.phase]*boss.shootMul*.65;}
  if(boss.phase>=2){boss.summonT-=dt;if(boss.summonT<=0){boss.summonT=boss.phase===3?5:8;bossSpawnMinions();}}
}
// tier 5/6 혼돈 이동: 매 1.5~3.2초마다 행동 패턴을 랜덤 전환
function updateBossChaos(dt,spd){
  boss.chaosT-=dt;boss.chaosDt+=dt;
  if(boss.chaosT<=0){
    boss.chaosAction=pick(['track','vdrop','rush','teleport','circle','sweep']);
    boss.chaosT=rnd(1.5,3.2);boss.chaosDt=0;
    if(boss.chaosAction==='teleport'){
      boss.x=rnd(80,W-80);boss.y=rnd(70,H*.38);
      flashIt('rgba(160,0,255,.42)');doShake(5,.3);
      addFx('!!',boss.x,boss.y-28,'#f0f',16);
    }
  }
  const cspd=spd*1.65;
  switch(boss.chaosAction){
    case 'track': // 플레이어 추격
      if(P){const dx=P.x-boss.x,dy=P.y-boss.y,l=Math.hypot(dx,dy)||1;
        boss.x+=dx/l*cspd*dt;boss.y+=dy/l*cspd*.6*dt;}break;
    case 'vdrop': // 수직 낙하 후 복귀
      if(boss.chaosDt<0.35)boss.y+=540*dt;
      else if(boss.chaosDt<0.72)boss.y-=540*dt;
      else boss.y+=(105-boss.y)*dt*5;break;
    case 'rush': // 플레이어 방향 돌진
      if(boss.chaosDt<0.45&&P){const dx=P.x-boss.x,dy=P.y-boss.y,l=Math.hypot(dx,dy)||1;
        boss.x+=dx/l*460*dt;boss.y+=dy/l*390*dt;}
      else boss.y+=(105-boss.y)*dt*4;break;
    case 'circle': // 원 궤도
      boss.x=W/2+Math.cos(boss.sineT*1.5)*(W*.34);
      boss.y=H*.2+Math.sin(boss.sineT*1.5)*58;break;
    case 'teleport': break; // 순간이동은 전환 시점에 이미 처리
    default: // sweep — 빠른 수평 이동
      boss.x+=boss.moveDir*cspd*dt;
      if(boss.x<52||boss.x>W-52)boss.moveDir*=-1;break;
  }
  boss.x=clamp(boss.x,52,W-52);boss.y=clamp(boss.y,60,H*.58);
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

