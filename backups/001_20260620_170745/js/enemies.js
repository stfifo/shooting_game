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

// ── Boss Sprite ──────────────────────────────────────────────────
function drawBossSprite(b){
  if(!b||!b.alive)return;
  const ph=b.phase;
  // Phase-color palettes
  const bpal=[
    ['','#5522aa','#3a1880','#6633bb','#ff88ff','#9955ff','#441166','#222','#cc44ff','#ff3300'],
    ['','#8a4400','#5a2800','#aa5500','#ffcc88','#ff8800','#441100','#222','#ffaa00','#ff5500'],
    ['','#aa0808','#6a0404','#cc1010','#ff9999','#ff4444','#550000','#222','#ff2200','#ff0000'],
  ][ph-1]||[];

  const S=PX+1; // boss uses slightly larger pixel

  // Boss body – pixel grid 20×16
  const BOSS_BODY=[
    [0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,4,4,1,1,4,4,1,4,0,0,0,0,0,0,0],
    [0,0,0,0,4,4,1,1,1,1,1,1,4,4,0,0,0,0,0,0],
    [0,0,0,6,6,1,1,2,2,2,1,1,6,6,0,0,0,0,0,0],
    [0,0,6,6,6,1,2,2,3,2,2,1,6,6,6,0,0,0,0,0],
    [0,6,6,6,6,1,2,3,3,3,2,1,6,6,6,6,0,0,0,0],
    [6,6,7,6,6,1,1,2,2,2,1,1,6,6,7,6,6,0,0,0],
    [6,6,7,6,6,1,1,1,1,1,1,1,6,6,7,6,6,0,0,0],
    [0,6,6,6,6,1,1,1,1,1,1,1,6,6,6,6,0,0,0,0],
    [0,0,6,6,6,1,1,1,1,1,1,1,6,6,6,0,0,0,0,0],
    [0,0,0,6,6,1,1,1,1,1,1,1,6,6,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,8,0,0,0,8,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0],
  ];
  pxDraw(BOSS_BODY,bpal,b.x,b.y);

  // Phase 2+: gun turrets
  if(ph>=2){
    cx.fillStyle=bpal[7];
    [[-30,6],[30,6]].forEach(([tx,ty])=>cx.fillRect(Math.round(b.x+tx*S/S),Math.round(b.y+ty*S/S),S*3,S));
  }

  // Phase 3: fire damage pixels
  if(ph===3){
    const fp=[[6,12],[-8,16],[3,6],[-5,20],[10,8]];
    fp.forEach(([fx,fy])=>{
      cx.fillStyle=`rgba(255,${rnd(40,160)|0},0,${rnd(.5,.95)})`;
      cx.fillRect(Math.round(b.x+fx),Math.round(b.y+fy),S*2,S*2);
    });
  }

  // Boss HP bar
  const bx=8,by=8,bw=W-16,bh=10;
  cx.fillStyle='#111';cx.fillRect(bx,by,bw,bh);
  const pct=b.hp/b.maxHp;
  const bars=Math.floor(bw/4);
  for(let i=0;i<bars;i++){
    if(i/bars>pct)break;
    const hue=i/bars>.66?'#4f4':i/bars>.33?'#ff4':'#f44';
    cx.fillStyle=hue;cx.fillRect(bx+i*4,by,3,bh);
  }
  cx.strokeStyle='#444';cx.lineWidth=1;cx.strokeRect(bx,by,bw,bh);
  [1/3,2/3].forEach(m=>{cx.strokeStyle='#666';cx.beginPath();cx.moveTo(bx+bw*m,by);cx.lineTo(bx+bw*m,by+bh);cx.stroke();});
  cx.fillStyle='#fff6';cx.font='8px Courier New';cx.fillText(`BOSS  HP`,bx+4,by+bh-1);
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
    if(m.type==='B'&&m.hp<m.maxHp){
      cx.fillStyle='#222';cx.fillRect(m.x-22,m.y-m.h/2-9,44,4);
      const pw=44*m.hp/m.maxHp;
      for(let i=0;i<Math.floor(pw/3);i++){cx.fillStyle=m.hp/m.maxHp>.5?'#4f4':'#f84';cx.fillRect(m.x-22+i*3,m.y-m.h/2-9,2,4);}
    }
  });
  if(boss&&boss.alive)drawBossSprite(boss);
}
