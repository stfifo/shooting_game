// ── Items ─────────────────────────────────────────────────────────
let pups=[];
const ITEM_COLS={P:'#ff0',B:'#f80',L:'#f88',F:'#8df',R:'#0ff',N:'#c0f',S:'#0f8'};
function dropItem(x,y,forced=null){
  const r=Math.random();let t=forced;
  if(!t){if(r<.12)t='P';else if(r<.20)t='B';else if(r<.25)t='L';else if(r<.31)t='F';
    else if(r<.35)t='R';else if(r<.38)t='N';else if(r<.41)t='S';}
  if(t)pups.push({x,y,vy:75,w:18,h:18,t,alive:true,bob:rnd(0,Math.PI*2)});
}
function updateItems(dt){
  pups.forEach(p=>{p.y+=p.vy*dt;p.bob+=dt*3;
    if(P&&P.alive&&Math.abs(p.x-P.x)<22&&Math.abs(p.y-P.y)<22){p.alive=false;applyItem(p.t);}});
  pups=pups.filter(p=>p.alive&&p.y<H+30);
}
function applyItem(t){
  switch(t){
    case'P':if(P.weapon<4)P.weapon++;P.wpTimer=14;addFx('POWER UP!',P.x,P.y-20,'#ff0',15);break;
    case'B':bombs=Math.min(BOMB_MAX,bombs+1);addFx(`BOMB! (${bombs})`,P.x,P.y-20,'#f80',14);break;
    case'L':lives++;addFx('LIFE UP! ♥',P.x,P.y-20,'#f88',15);break;
    case'F':ghostT=GHOST_DUR;addFx('WING FORMATION!',P.x,P.y-24,'#8df',14);break;
    case'R':rapidT=RAPID_DUR;addFx('RAPID FIRE!',P.x,P.y-20,'#0ff',15);break;
    case'N':pierceT=PIERCE_DUR;addFx('PIERCE SHOT!',P.x,P.y-20,'#c0f',15);break;
    case'S':shieldT=SHIELD_DUR;addFx('SHIELD ON!',P.x,P.y-20,'#0f8',15);break;
  }
  updateHUD();
}
function drawItems(){
  pups.forEach(p=>{
    const bob=Math.sin(p.bob)*4,S=PX;
    cx.save();cx.translate(Math.round(p.x),Math.round(p.y+bob));
    // Pixel art item: 5×5 diamond
    const c=ITEM_COLS[p.t];
    [[0,-2],[0,2],[-2,0],[2,0],[0,0],[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{
      cx.fillStyle=c;cx.fillRect(dx*S-S/2,dy*S-S/2,S,S);
    });
    cx.fillStyle='#000';cx.font='bold 8px Courier New';cx.textAlign='center';cx.textBaseline='middle';
    cx.fillText(p.t==='L'?'♥':p.t,0,0);
    cx.textBaseline='alphabetic';cx.textAlign='left';cx.restore();
  });
}
