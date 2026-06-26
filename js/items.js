// ── Items ─────────────────────────────────────────────────────────
let pups=[];
let fDropGroup=0,fDropCount=0; // 윙맨 아이템 그룹별 드롭 횟수 추적
const ITEM_COLS={P:'#ff0',B:'#f80',L:'#f88',F:'#8df',R:'#0ff',N:'#c0f',S:'#0f8'};
function dropItem(x,y,forced=null){
  const r=Math.random();let t=forced;
  if(!t){if(r<.12)t='P';else if(r<.20)t='B';else if(r<.25)t='L';else if(r<.31)t='F';
    else if(r<.35)t='R';else if(r<.38)t='N';else if(r<.41)t='S';}
  // F(윙맨): 5웨이브 그룹당 최대 드롭 횟수 제한 (wave 1-15: 1번, wave 16+: 2번)
  if(t==='F'){
    const grp=Math.ceil(wave/5);
    if(grp!==fDropGroup){fDropGroup=grp;fDropCount=0;}
    const maxF=grp<=3?1:2;
    if(fDropCount>=maxF)t=null;
    else fDropCount++;
  }
  if(t)pups.push({x,y,vy:75,w:18,h:18,t,alive:true,bob:rnd(0,Math.PI*2)});
}
function updateItems(dt){
  pups.forEach(p=>{p.y+=p.vy*dt;p.bob+=dt*3;
    if(P&&P.alive&&Math.abs(p.x-P.x)<22&&Math.abs(p.y-P.y)<22){p.alive=false;applyItem(p.t);}});
  pups=pups.filter(p=>p.alive&&p.y<H+30);
}
function applyItem(t){
  switch(t){
    case'P':if(P.weapon<4)P.weapon++;P.wpTimer=POWER_DUR;addFx('POWER UP!',P.x,P.y-20,'#ff0',15);break;
    case'B':bombs=Math.min(BOMB_MAX,bombs+1);addFx(`BOMB! (${bombs})`,P.x,P.y-20,'#f80',14);break;
    case'L':lives++;addFx('LIFE UP! ♥',P.x,P.y-20,'#f88',15);break;
    case'F':ghostT=GHOST_DUR;addFx('WING FORMATION!',P.x,P.y-24,'#8df',14);break;
    case'R':rapidT=RAPID_DUR;addFx('RAPID FIRE!',P.x,P.y-20,'#0ff',15);break;
    case'N':pierceT=PIERCE_DUR;addFx('PIERCE SHOT!',P.x,P.y-20,'#c0f',15);break;
    case'S':shieldT=1;addFx('SHIELD ON!',P.x,P.y-20,'#0f8',15);break;
  }
  updateHUD();
}
function drawItems(){
  const now=performance.now()/1000;
  pups.forEach(p=>{
    const bob=Math.sin(p.bob)*4,S=PX;
    cx.save();cx.translate(Math.round(p.x),Math.round(p.y+bob));
    if(p.t==='F'){
      // 천사 halo: 황금 타원 링 + 회전 반짝임
      const pulse=0.6+0.4*Math.sin(now*4+p.bob);
      // 외부 황금 halo 타원
      cx.shadowBlur=16*pulse;cx.shadowColor='#ffd700';
      cx.beginPath();cx.ellipse(0,0,13,6,0,0,Math.PI*2);
      cx.strokeStyle=`rgba(255,215,0,${0.8+0.2*pulse})`;cx.lineWidth=4;cx.stroke();
      // 내부 밝은 하이라이트
      cx.shadowBlur=6;
      cx.beginPath();cx.ellipse(0,0,10,4.5,0,0,Math.PI*2);
      cx.strokeStyle=`rgba(255,255,180,${0.5*pulse})`;cx.lineWidth=1.5;cx.stroke();
      // 타원 궤도를 따라 회전하는 반짝임 6개
      cx.shadowBlur=8;cx.shadowColor='#fff';
      for(let i=0;i<6;i++){
        const angle=now*1.5+(Math.PI*2/6)*i;
        const sx=Math.cos(angle)*13,sy=Math.sin(angle)*6;
        const sp=0.5+0.5*Math.abs(Math.sin(now*3+i*1.1));
        cx.beginPath();cx.arc(sx,sy,1.5+sp,0,Math.PI*2);
        cx.fillStyle=`rgba(255,255,200,${sp})`;cx.fill();
      }
      // 중앙 아이콘
      cx.shadowBlur=0;cx.fillStyle='#fff8c0';
      cx.font='bold 7px Courier New';cx.textAlign='center';cx.textBaseline='middle';
      cx.fillText('F',0,0);
    }else{
      // 기존 픽셀 아트 다이아몬드
      const c=ITEM_COLS[p.t];
      [[0,-2],[0,2],[-2,0],[2,0],[0,0],[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{
        cx.fillStyle=c;cx.fillRect(dx*S-S/2,dy*S-S/2,S,S);
      });
      cx.fillStyle='#000';cx.font='bold 8px Courier New';cx.textAlign='center';cx.textBaseline='middle';
      cx.fillText(p.t==='L'?'♥':p.t,0,0);
    }
    cx.textBaseline='alphabetic';cx.textAlign='left';cx.restore();
  });
}
