// ── Enemy Draw Functions ─────────────────────────────────────────
function drawEA(x,y,fr){
  // Exhaust flicker
  cx.fillStyle=`rgba(255,${100+Math.random()*80|0},0,${rnd(.3,.6)})`;
  cx.fillRect(Math.round(x-PX/2),Math.round(y+6*PX),PX,rnd(1,3)*PX|0);
  pxDraw(SPR_A,PAL_A,x,y);
}
function drawEB(x,y,fr){
  // Dual engine exhausts
  cx.fillStyle=`rgba(255,120,0,${rnd(.25,.5)})`;
  cx.fillRect(Math.round(x-9*PX/2),Math.round(y+5*PX),PX,rnd(1,3)*PX|0);
  cx.fillRect(Math.round(x+7*PX/2),Math.round(y+5*PX),PX,rnd(1,3)*PX|0);
  pxDraw(SPR_B,PAL_B,x,y);
}
function drawEC(x,y,fr){
  // Engine glow
  const gl=.4+.3*Math.sin(fr*.12);
  cx.fillStyle=`rgba(170,0,255,${gl})`;
  for(let i=-1;i<=1;i++)cx.fillRect(Math.round(x+i*PX-PX/2),Math.round(y+6*PX),PX,PX*2);
  pxDraw(SPR_C,PAL_C,x,y);
}

// ── Boss PNG sprites (tier 1-6) ───────────────────────────────────
const BOSS_IMGS=Array.from({length:6},(_,i)=>{
  const img=new Image();img.src=`asset/boss_${i+1}.png`;return img;
});

// ── Boss Sprite ──────────────────────────────────────────────────
function drawBossSprite(b){
  if(!b||!b.alive)return;
  const ph=b.phase;
  const img=BOSS_IMGS[(b.tier||1)-1];

  if(img&&img.complete&&img.naturalWidth>0){
    // 140×130 박스 안에 비율 유지하며 렌더
    const maxW=140,maxH=130;
    const scale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
    const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
    const dx=b.x-dw/2,dy=b.y-dh/2;

    cx.save();
    // Phase별 외곽 글로우
    if(ph===3){cx.shadowBlur=24;cx.shadowColor='#ff2200';}
    else if(ph===2){cx.shadowBlur=16;cx.shadowColor='#ff7700';}
    else{cx.shadowBlur=8;cx.shadowColor='#8844ff';}
    cx.drawImage(img,dx,dy,dw,dh);
    cx.restore();

    // Phase 2: 주황 틴트
    if(ph===2){cx.globalAlpha=.18;cx.fillStyle='#ff8800';cx.fillRect(dx,dy,dw,dh);cx.globalAlpha=1;}
    // Phase 3: 붉은 틴트 + 화염 스파크
    if(ph===3){
      cx.globalAlpha=.28;cx.fillStyle='#ff2200';cx.fillRect(dx,dy,dw,dh);cx.globalAlpha=1;
      [[6,12],[-8,16],[3,6],[-5,20],[10,8]].forEach(([fx,fy])=>{
        cx.fillStyle=`rgba(255,${rnd(40,160)|0},0,${rnd(.5,.95)})`;
        cx.fillRect(Math.round(b.x+fx),Math.round(b.y+fy),6,6);
      });
    }
  }else{
    // 로딩 중 폴백
    cx.fillStyle=ph===3?'#aa0808':ph===2?'#8a4400':'#5522aa';
    cx.fillRect(b.x-45,b.y-30,90,60);
  }

  // Boss HP bar
  const bx=8,by=8,bw=W-16,bh=10;
  cx.fillStyle='#111';cx.fillRect(bx,by,bw,bh);
  const pct=b.hp/b.maxHp;
  const bars=Math.floor(bw/4);
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

// ── Enemy definitions ─────────────────────────────────────────────
const EDEFS={
  A:{hp:1,pts:100,w:28,h:30,draw:drawEA,sRate:2.4},
  B:{hp:4,pts:300,w:44,h:38,draw:drawEB,sRate:1.8},
  C:{hp:2,pts:200,w:28,h:32,draw:drawEC,sRate:1.6},
};

// ── Draw enemies ──────────────────────────────────────────────────
function drawEnemies(){
  getEnemies().forEach(m=>{
    EDEFS[m.type]?.draw(m.x,m.y,m.frame);
    if(m.hp<m.maxHp&&m.maxHp>1){
      const bw=Math.min(44,m.w+4);
      cx.fillStyle='#222';cx.fillRect(m.x-bw/2,m.y-m.h/2-9,bw,4);
      const pw=bw*m.hp/m.maxHp;
      for(let i=0;i<Math.floor(pw/3);i++){cx.fillStyle=m.hp/m.maxHp>.5?'#4f4':'#f84';cx.fillRect(m.x-bw/2+i*3,m.y-m.h/2-9,2,4);}
    }
  });
  if(boss&&boss.alive)drawBossSprite(boss);
}
