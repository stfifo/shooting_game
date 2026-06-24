// ── HUD ──────────────────────────────────────────────────────────
function updateHUD(){
  document.getElementById('scoreEl').textContent=String(score).padStart(8,'0');
  document.getElementById('hiEl').textContent=String(hiScore).padStart(8,'0');
  document.getElementById('waveEl').textContent=wave||'-';
  document.getElementById('livesEl').textContent=Array.from({length:Math.max(0,lives)},()=>'✈').join(' ')||'---';
  document.getElementById('bombsEl').textContent=Array.from({length:Math.max(0,bombs)},()=>'◉').join(' ')||'-';
  document.getElementById('skillFill').style.width=`${Math.min(100,skillKills/SKILL_GOAL*100)}%`;
  const wn=document.getElementById('wpName');wn.textContent=WPN_NAMES[P?.weapon||1];wn.style.color=WPN_COLS[P?.weapon||1]||'#ff8';
  document.getElementById('ghostEl').textContent=ghostT>0?`${Math.ceil(ghostT)}s`:'-';
}
function drawHUDCanvas(){
  if(skillKills>=SKILL_GOAL&&P?.weapon!==5){
    const a=.5+.4*Math.sin(performance.now()*.006);cx.globalAlpha=a;cx.fillStyle='#ff0';
    cx.font='bold 11px Courier New';cx.textAlign='right';cx.fillText('SKILL READY [X]',W-14,H-28);cx.globalAlpha=1;cx.textAlign='left';
  }
  if(ghostT>0&&ghostT<4){cx.globalAlpha=Math.min(1,ghostT);cx.fillStyle='#8df';cx.font='bold 13px Courier New';cx.textAlign='right';cx.fillText(`WING ${Math.ceil(ghostT)}s`,W-14,H-46);cx.globalAlpha=1;cx.textAlign='left';}
  if(fireballT>0){cx.globalAlpha=.8+.18*Math.sin(performance.now()*.01);cx.fillStyle='#f60';cx.font='bold 13px Courier New';cx.textAlign='right';cx.fillText(`FIREBALL ${Math.ceil(fireballT)}s`,W-14,H-64);cx.globalAlpha=1;cx.textAlign='left';}
  if(combo>2&&comboT>0){cx.globalAlpha=Math.min(1,comboT);cx.fillStyle='#f80';cx.font='bold 13px Courier New';cx.textAlign='right';cx.fillText(`${combo}x COMBO`,W-14,H-10);cx.globalAlpha=1;cx.textAlign='left';}
  // 좌측 파워업 타이머 (쉴드/속사/관통탄)
  let lhud=H-10;
  if(shieldT>0){const a=shieldT<3?(Math.floor(performance.now()/220)%2?.9:.3):.85;cx.globalAlpha=a;cx.fillStyle='#00ff88';cx.font='bold 12px Courier New';cx.textAlign='left';cx.fillText(`◈ SHIELD ${Math.ceil(shieldT)}s`,14,lhud);cx.globalAlpha=1;lhud-=17;}
  if(rapidT>0){cx.globalAlpha=.8+.18*Math.sin(performance.now()*.013);cx.fillStyle='#0ff';cx.font='bold 12px Courier New';cx.textAlign='left';cx.fillText(`⚡ RAPID ${Math.ceil(rapidT)}s`,14,lhud);cx.globalAlpha=1;lhud-=17;}
  if(pierceT>0){cx.globalAlpha=.8+.18*Math.sin(performance.now()*.013);cx.fillStyle='#c0f';cx.font='bold 12px Courier New';cx.textAlign='left';cx.fillText(`▶ PIERCE ${Math.ceil(pierceT)}s`,14,lhud);cx.globalAlpha=1;}
  cx.textAlign='left';
  if(betweenWave){
    const prog=Math.max(0,1-betweenT/1.5);
    cx.fillStyle='rgba(0,0,0,.72)';cx.fillRect(0,H*.35,W-12,112);
    cx.textAlign='center';
    cx.shadowBlur=18;cx.shadowColor='#ff0';cx.fillStyle='#ffee00';cx.font='bold 30px Courier New';
    cx.fillText(`WAVE  ${waveIdx}  CLEAR!`,W/2,H*.35+46);
    cx.shadowBlur=0;
    // Loading bar
    const bx=W/2-90,by=H*.35+60,bw=180,bh=6;
    cx.fillStyle='#1a1a1a';cx.fillRect(bx,by,bw,bh);
    cx.fillStyle='#ffcc00';cx.fillRect(bx,by,Math.round(bw*prog),bh);
    cx.strokeStyle='#333';cx.lineWidth=1;cx.strokeRect(bx,by,bw,bh);
    cx.fillStyle='#555';cx.font='10px Courier New';
    cx.fillText('NEXT WAVE',W/2,H*.35+88);
    cx.textAlign='left';
  }
}

// ── 우측 수직 진행 바 ──────────────────────────────────────────────
// 현재 웨이브를 TOTAL_WAVES 기준으로 아래→위 방향으로 표시
// 보스 웨이브(5,10,15,20)마다 빨간 마커, 완주 시 노랗게 점멸
function drawProgressBar(){
  if(STATE==='IDLE')return;
  const BX=W-6, BW=4;
  const BY=26, BH=H-34; // 상단 보스 HP바 아래부터 하단까지

  // 진행률 계산 (0~1)
  const progress=STATE==='PLAYING'||STATE==='PAUSED'
    ?Math.min(1,Math.max(0,(waveIdx-1)/(TOTAL_WAVES-1)))
    :waveIdx>=TOTAL_WAVES?1:0;

  // 트랙 배경
  cx.fillStyle='rgba(0,0,0,.55)';
  cx.fillRect(BX,BY,BW,BH);

  // 채워진 부분 — 아래서 위로, 배경 페이즈와 같은 색 계열
  const fillH=Math.round(BH*progress);
  if(fillH>0){
    const gr=cx.createLinearGradient(0,BY+BH,0,BY);
    gr.addColorStop(0,'#1a6fc8');   // 지구 파랑
    gr.addColorStop(.28,'#0a1a3a'); // 대기권 남색
    gr.addColorStop(.55,'#300c0c'); // 화성 적갈
    gr.addColorStop(1,'#1a0030');   // 심우주 보라
    cx.fillStyle=gr;
    cx.fillRect(BX,BY+BH-fillH,BW,fillH);
  }

  // 보스 웨이브 구분 마커 (5,10,15,20)
  [5,10,15,20].forEach(bw=>{
    const ratio=(bw-1)/(TOTAL_WAVES-1);
    const my=BY+BH-Math.round(BH*ratio);
    const reached=waveIdx>=bw;
    cx.fillStyle=reached?'#ff3333':'#2a0000';
    cx.fillRect(BX-2,my-1,BW+4,2);
    // 보스 마커 옆에 작은 삼각형 (위협 표시)
    if(reached){cx.fillStyle='#ff3333';}else{cx.fillStyle='#1a0000';}
    cx.fillRect(BX-4,my-2,2,4);
  });

  // 현재 위치 인디케이터 (노란 가로선)
  if((STATE==='PLAYING'||STATE==='PAUSED')&&wave>0){
    const iy=BY+BH-Math.round(BH*progress);
    const pulse=.7+.3*Math.sin(performance.now()*.007);
    cx.globalAlpha=pulse;
    cx.fillStyle='#ffee00';
    cx.fillRect(BX-3,iy-1,BW+6,3);
    cx.globalAlpha=1;
    // 비행기 아이콘 (▲ 모양 2px 픽셀)
    cx.fillStyle='#ffee00';
    cx.fillRect(BX-2,iy-4,2,2);
    cx.fillRect(BX-3,iy-2,4,2);
  }

  // 완주(TOTAL_WAVES) 도달 시 점멸 강조
  if(progress>=1){
    const gl=.4+.4*Math.sin(performance.now()*.01);
    cx.globalAlpha=gl;
    cx.fillStyle='#ffee00';
    cx.fillRect(BX,BY,BW,BH);
    cx.globalAlpha=1;
  }

  // 테두리
  cx.strokeStyle='#181818';cx.lineWidth=1;cx.strokeRect(BX,BY,BW,BH);

  // 상단 목적지 라벨
  cx.fillStyle=progress>=1?'#ffee00':'#252525';
  cx.font='6px Courier New';cx.textAlign='center';
  cx.fillText('★',BX+BW/2,BY-2);
  cx.textAlign='left';
}

// ── Overlays ──────────────────────────────────────────────────────
function drawIdle(){
  cx.fillStyle='rgba(0,0,0,.88)';cx.fillRect(0,0,W,H);cx.textAlign='center';
  // Title
  cx.shadowBlur=32;cx.shadowColor='#f80';cx.fillStyle='#f80';
  cx.font='bold 56px Courier New';cx.fillText('STRIKERS',W/2,H/2-86);
  cx.shadowBlur=16;cx.shadowColor='#ff0';cx.fillStyle='#ffcc00';
  cx.font='bold 34px Courier New';cx.fillText('1945+',W/2,H/2-44);
  cx.shadowBlur=0;
  // Controls box
  const bx=W/2-132,by=H/2-26,bw=264,bh=116;
  cx.fillStyle='rgba(255,255,255,.035)';cx.fillRect(bx,by,bw,bh);
  cx.strokeStyle='#2a2a2a';cx.lineWidth=1;cx.strokeRect(bx,by,bw,bh);
  cx.fillStyle='#3a3a3a';cx.font='9px Courier New';cx.fillText('— CONTROLS —',W/2,by+14);
  const ctrl=[['MOVE','← → ↑ ↓  /  W A S D'],['FIRE','AUTO'],['BOMB','Z'],['SKILL','X  (20 kills → charged)'],['PAUSE','SPACE']];
  ctrl.forEach(([k,v],i)=>{
    const y=by+28+i*17;
    cx.fillStyle='#444';cx.textAlign='right';cx.font='9px Courier New';cx.fillText(k,W/2-8,y);
    cx.fillStyle='#aaa';cx.textAlign='left';cx.font='bold 9px Courier New';cx.fillText(v,W/2+8,y);
  });
  // Start prompt (blink)
  const blink=Math.floor(performance.now()/550)%2===0;
  cx.shadowBlur=blink?12:0;cx.shadowColor='#ff0';
  cx.fillStyle=blink?'#ffee00':'#665500';
  cx.font='bold 16px Courier New';cx.textAlign='center';
  cx.fillText('PRESS  ENTER  TO  START',W/2,H/2+106);
  cx.shadowBlur=0;
  // Hi-score
  cx.fillStyle='#3a3a3a';cx.font='11px Courier New';
  cx.fillText(`HI-SCORE  ${String(hiScore).padStart(8,'0')}`,W/2,H/2+130);
  cx.textAlign='left';
}
function drawPaused(){
  cx.fillStyle='rgba(0,0,0,.75)';cx.fillRect(0,0,W,H);
  cx.textAlign='center';

  // ── PAUSED 타이틀 ──
  cx.shadowBlur=18;cx.shadowColor='#4af';cx.fillStyle='#88ddff';
  cx.font='bold 38px Courier New';cx.fillText('PAUSED',W/2,H/2-148);
  cx.shadowBlur=0;

  // ── 스테이터스 카드 (웨이브 + 점수) ──
  const sx=W/2-116,sy=H/2-130,sw=232,sh=50;
  cx.fillStyle='rgba(255,255,255,.04)';cx.fillRect(sx,sy,sw,sh);
  cx.strokeStyle='#2a3a4a';cx.lineWidth=1;cx.strokeRect(sx,sy,sw,sh);
  // 웨이브
  cx.fillStyle='#445566';cx.font='9px Courier New';cx.textAlign='left';
  cx.fillText('WAVE',sx+14,sy+16);
  cx.fillStyle='#aaddff';cx.font='bold 20px Courier New';
  cx.fillText(String(wave||'-').padStart(2,' '),sx+14,sy+40);
  // 구분선
  cx.strokeStyle='#1e2e3e';cx.lineWidth=1;
  cx.beginPath();cx.moveTo(W/2,sy+8);cx.lineTo(W/2,sy+sh-8);cx.stroke();
  // 점수
  cx.fillStyle='#445566';cx.font='9px Courier New';cx.textAlign='right';
  cx.fillText('SCORE',sx+sw-14,sy+16);
  cx.fillStyle='#ffee88';cx.font='bold 20px Courier New';
  cx.fillText(String(score).padStart(8,'0'),sx+sw-14,sy+40);

  // ── 조작법 박스 ──
  const cx2=W/2,cy=H/2-58;
  const bx=W/2-116,bh=120;
  cx.fillStyle='rgba(255,255,255,.03)';cx.fillRect(bx,cy,232,bh);
  cx.strokeStyle='#222';cx.lineWidth=1;cx.strokeRect(bx,cy,232,bh);
  cx.fillStyle='#334';cx.font='9px Courier New';cx.textAlign='center';
  cx.fillText('— CONTROLS —',W/2,cy+14);
  const ctrl=[['MOVE','← → ↑ ↓  /  W A S D'],['BOMB','Z'],['SKILL','X  (20킬 충전 후)'],['PAUSE','SPACE']];
  ctrl.forEach(([k,v],i)=>{
    const y=cy+30+i*20;
    cx.fillStyle='#3a4a5a';cx.textAlign='right';cx.font='9px Courier New';cx.fillText(k,W/2-10,y);
    cx.fillStyle='#99bbcc';cx.textAlign='left';cx.font='bold 9px Courier New';cx.fillText(v,W/2+10,y);
  });

  // ── 재개 프롬프트 ──
  const blink=Math.floor(performance.now()/600)%2===0;
  cx.shadowBlur=blink?8:0;cx.shadowColor='#4af';
  cx.fillStyle=blink?'#88ddff':'#223344';
  cx.font='bold 13px Courier New';cx.textAlign='center';
  cx.fillText('[ P ]  RESUME',W/2,H/2+76);
  cx.shadowBlur=0;cx.textAlign='left';
}
function drawGameOver(){
  cx.fillStyle='rgba(0,0,0,.82)';cx.fillRect(0,0,W,H);cx.textAlign='center';
  // Title
  cx.shadowBlur=18;cx.shadowColor='#cc0000';cx.fillStyle='#ff4444';
  cx.font='bold 44px Courier New';cx.fillText('GAME  OVER',W/2,H/2-68);
  cx.shadowBlur=0;
  // Score card
  cx.fillStyle='rgba(255,255,255,.04)';cx.fillRect(W/2-110,H/2-50,220,88);
  cx.strokeStyle='#2a2a2a';cx.lineWidth=1;cx.strokeRect(W/2-110,H/2-50,220,88);
  cx.fillStyle='#444';cx.font='10px Courier New';cx.fillText('SCORE',W/2,H/2-30);
  cx.fillStyle='#ffffff';cx.font='bold 26px Courier New';
  cx.fillText(String(score).padStart(8,'0'),W/2,H/2-6);
  cx.fillStyle='#333';cx.font='9px Courier New';cx.fillText('HI-SCORE',W/2,H/2+16);
  cx.fillStyle='#aa9900';cx.font='bold 15px Courier New';
  cx.fillText(String(hiScore).padStart(8,'0'),W/2,H/2+34);
  // New hi-score flash
  if(score>0&&score>=hiScore){
    const nb=Math.floor(performance.now()/450)%2===0;
    if(nb){cx.shadowBlur=8;cx.shadowColor='#f80';cx.fillStyle='#ff8800';cx.font='bold 13px Courier New';cx.fillText('✦  NEW HI-SCORE  ✦',W/2,H/2+56);cx.shadowBlur=0;}
  }
  // Restart prompt (blink)
  const blink=Math.floor(performance.now()/620)%2===0;
  cx.fillStyle=blink?'#ffee00':'#554400';
  cx.font='bold 14px Courier New';
  cx.fillText('PRESS  ENTER  TO  RETRY',W/2,H/2+82);
  cx.textAlign='left';
}
