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
