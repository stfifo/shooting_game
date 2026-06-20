// ── Bullets ──────────────────────────────────────────────────────
let pBullets=[], eBullets=[];
function updateBullets(dt){
  pBullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;});
  pBullets=pBullets.filter(b=>b.alive&&b.y>-30&&b.x>-30&&b.x<W+30);
  eBullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;});
  eBullets=eBullets.filter(b=>b.alive&&b.y<H+20&&b.x>-20&&b.x<W+20);
}
function drawBullets(){
  // Player bullets – pixel style
  pBullets.forEach(b=>{
    if(b.fireball){
      // Fireball: layered pixel squares
      const sz=rnd(3,5)|0;
      cx.fillStyle='#fff';cx.fillRect(b.x-PX/2,b.y-PX/2,PX,PX);
      cx.fillStyle='#ffdd00';cx.fillRect(b.x-PX,b.y-PX,PX*2,PX*2);
      cx.fillStyle='rgba(255,100,0,.7)';cx.fillRect(b.x-PX*1.5,b.y-PX*1.5,PX*3,PX*3);
      // Trailing pixels
      for(let i=1;i<=3;i++){
        cx.fillStyle=`rgba(255,${120-i*30},0,${.5-i*.12})`;
        cx.fillRect(b.x-PX/2,b.y+i*PX*1.5,PX,PX);
      }
    } else {
      // Normal bullet – 2×4 bright pixel
      cx.fillStyle='#ccffff';cx.fillRect(Math.round(b.x-1),Math.round(b.y-6),2,6);
      cx.fillStyle='#ffffff';cx.fillRect(Math.round(b.x-1),Math.round(b.y-6),2,2);
    }
  });
  // Enemy bullets – pixel diamond
  const ecols={A:'#ff6666',B:'#ffaa44',C:'#dd88ff'};
  eBullets.forEach(b=>{
    const c=ecols[b.t]||'#ff6666';
    cx.fillStyle=c;
    const bx=Math.round(b.x), by=Math.round(b.y), S=2;
    cx.fillRect(bx-S,by,S,S*2);cx.fillRect(bx+S,by,S,S*2);
    cx.fillRect(bx-S*2,by+S,S,S*2);cx.fillRect(bx+S*2,by+S,S,S*2);
    cx.fillStyle='#fff';cx.fillRect(bx,by+S,S,S*2);
  });
}
