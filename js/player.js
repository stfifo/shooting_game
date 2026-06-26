// ── Player ───────────────────────────────────────────────────────
let P=null;
function makePlayer(){return{x:W/2,y:H-90,w:P_W,h:P_H,fireT:0,invT:0,propA:0,weapon:1,wpTimer:0,alive:true};}

function drawShipAt(sx,sy,pal,propA,glowCol,sc=1){
  cx.save();
  cx.translate(sx,sy);cx.scale(sc,sc);cx.translate(-sx,-sy);
  cx.fillStyle=`rgba(${glowCol||'80,160,255'},${rnd(.15,.45)})`;
  const ex=Math.round(sx-PX*.5), ey=Math.round(sy+7*PX);
  cx.fillRect(ex,ey,PX,rnd(3,6)*PX|0);
  cx.fillRect(ex+PX*2,ey,PX,rnd(2,5)*PX|0);
  pxDraw(SPR_P,pal,sx,sy);
  cx.save();cx.translate(Math.round(sx),Math.round(sy-7*PX));cx.rotate(propA);
  cx.fillStyle=pal[5];
  cx.fillRect(-5*PX/2,0,PX,PX*3);cx.fillRect(5*PX/2-PX,0,PX,PX*3);
  cx.fillRect(0,-5*PX/2,PX*3,PX);cx.fillRect(0,5*PX/2-PX,PX*3,PX);
  cx.fillStyle=pal[6];cx.fillRect(-PX/2,-PX/2,PX,PX);
  cx.restore();
  cx.restore();
}

function drawPlayer(){
  if(!P||!P.alive)return;
  if(P.invT>0&&Math.floor(P.invT*10)%2===0)return;
  if(ghostT>0){
    const ga=Math.min(1,ghostT)*(.55+.2*Math.sin(performance.now()*.005));
    cx.globalAlpha=ga;
    drawShipAt(P.x-65,P.y+10,PAL_G,P.propA*.75,'100,140,255',0.7);
    drawShipAt(P.x+65,P.y+10,PAL_G,P.propA*.75,'100,140,255',0.7);
    cx.globalAlpha=1;
  }
  if(fireballT>0){
    cx.globalAlpha=.3+.15*Math.sin(performance.now()*.009);
    cx.fillStyle='#ff6600';
    for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)if(r*r+c*c<6)cx.fillRect(Math.round(P.x+c*PX*2),Math.round(P.y+r*PX*2),PX*2,PX*2);
    cx.globalAlpha=1;
  }
  // 방어막 링 (쉴드 활성 시)
  if(shieldT>0){
    const pulse=.5+.4*Math.sin(performance.now()*.009);
    cx.globalAlpha=pulse;cx.strokeStyle='#00ff88';cx.lineWidth=2.5;
    cx.beginPath();cx.arc(Math.round(P.x),Math.round(P.y),24,0,Math.PI*2);cx.stroke();
    cx.globalAlpha=1;cx.lineWidth=1;
  }
  drawShipAt(P.x,P.y,PAL_P,P.propA,'80,160,255',0.7);
}

function updatePlayer(dt){
  if(!P||!P.alive)return;
  let dx=0,dy=0;
  if(keys.has('ArrowLeft')||keys.has('KeyA'))dx=-1;if(keys.has('ArrowRight')||keys.has('KeyD'))dx=1;
  if(keys.has('ArrowUp')||keys.has('KeyW'))dy=-1;if(keys.has('ArrowDown')||keys.has('KeyS'))dy=1;
  if(dx&&dy){dx*=.707;dy*=.707;}
  P.x=clamp(P.x+dx*P_SPD*dt,P_W/2,W-P_W/2);
  P.y=clamp(P.y+dy*P_SPD*dt,P_H/2,H-P_H/2);
  P.propA+=14*dt;P.fireT-=dt;
  if(P.fireT<=0){
    shootFrom(P.x,P.y-P.h/2+4,P.weapon);
    if(ghostT>0){shootFrom(P.x-65,P.y+8,P.weapon);shootFrom(P.x+65,P.y+8,P.weapon);}
    P.fireT=P.weapon===5?(rapidT>0?.12:.22):(rapidT>0?FIRE_RATE*.45:FIRE_RATE);
  }
  if(P.invT>0)P.invT-=dt;
  if(P.wpTimer>0){P.wpTimer-=dt;if(P.wpTimer<=0&&!fireballT)P.weapon=1;}
  if(fireballT>0){fireballT-=dt;if(fireballT<=0){fireballT=0;P.weapon=1;P.wpTimer=0;}}
  if(ghostT>0){ghostT-=dt;if(ghostT<0)ghostT=0;}
  if(rapidT>0){rapidT-=dt;if(rapidT<0)rapidT=0;}
  if(pierceT>0){pierceT-=dt;if(pierceT<0)pierceT=0;}
}

function shootFrom(x,y,wpn){
  const sp=480,fb=wpn===5,doPierce=fb||pierceT>0;
  const mk=(ox,oy,vx,vy)=>({x:x+ox,y:y+oy,vx,vy,w:fb?14:4,h:fb?14:12,dmg:fb?2:1,
    pierce:doPierce,hset:doPierce?new Set():null,alive:true,fireball:fb,pcol:!fb&&pierceT>0});
  switch(wpn){
    case 1:pBullets.push(mk(0,0,0,-sp));break;
    case 2:pBullets.push(mk(-7,0,0,-sp));pBullets.push(mk(7,0,0,-sp));break;
    case 3:pBullets.push(mk(0,0,0,-sp));pBullets.push(mk(-9,4,-sp*.22,-sp*.975));pBullets.push(mk(9,4,sp*.22,-sp*.975));break;
    case 4:[-2,-1,0,1,2].forEach(i=>{const a=i*16*Math.PI/180;pBullets.push(mk(0,0,Math.sin(a)*sp,-Math.cos(a)*sp));});break;
    case 5:[-10,0,10].forEach(ox=>pBullets.push({x:x+ox,y:y-8,vx:0,vy:-340,w:14,h:14,dmg:2,pierce:true,hset:new Set(),alive:true,fireball:true}));break;
  }
}
