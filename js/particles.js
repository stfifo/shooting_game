// ── Pixel Particles ───────────────────────────────────────────────
let parts=[], fxts=[];

function explode(x,y,type='A'){
  const cols={A:['#ff8800','#ff4400','#ffdd00','#ffaa00'],B:['#ff4400','#ff0000','#ff8800','#ffff00'],C:['#cc00ff','#8800ff','#ff0088','#ff44ff']};
  const cs=cols[type]||cols.A;
  const n=type==='B'?22:13;
  // Pixel sparks
  for(let i=0;i<n;i++){
    const a=rnd(0,Math.PI*2),sp=rnd(50,160);
    parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:rnd(.4,.9),max:.9,col:pick(cs),sz:rnd(1,3.5)|0,kind:'spark',grav:1});
  }
  // Debris chunks (larger pixels)
  for(let i=0;i<6;i++){
    const a=rnd(0,Math.PI*2),sp=rnd(30,90);
    parts.push({x:x+rnd(-8,8),y:y+rnd(-8,8),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-20,
      life:rnd(.5,1.1),max:1.1,col:pick(cs),sz:rnd(2,5)|0,kind:'debris',grav:.5});
  }
  // Smoke blocks
  for(let i=0;i<4;i++){
    const a=rnd(-Math.PI*.7,-Math.PI*.3);
    parts.push({x:x+rnd(-6,6),y:y+rnd(-6,6),vx:Math.cos(a)*rnd(10,35),vy:Math.sin(a)*rnd(20,50),
      life:rnd(.6,1.2),max:1.2,col:'#555',sz:rnd(4,10)|0,kind:'smoke',grav:0});
  }
  // Ring flash pixels
  for(let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2;
    parts.push({x,y,vx:Math.cos(a)*80,vy:Math.sin(a)*80,
      life:.25,max:.25,col:'#fff',sz:2,kind:'ring',grav:0});
  }
  doShake(3,.12);
}
function addHitSpark(x,y){
  for(let i=0;i<5;i++){
    const a=rnd(0,Math.PI*2);
    parts.push({x,y,vx:Math.cos(a)*rnd(20,60),vy:Math.sin(a)*rnd(20,60)-30,life:.2,max:.2,col:'#fff',sz:2,kind:'spark',grav:0});
  }
}
function addFx(text,x,y,col,sz=14){fxts.push({text,x,y,col,sz,life:1.6,max:1.6,vy:-36});}
function flashIt(col){flashA=.6;flashCol=col;}
function doShake(a,d){shakeAmt=a;shakeDur=Math.max(shakeDur,d);}

function updateParts(dt){
  parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.grav)p.vy+=120*p.grav*dt;p.vx*=(1-dt*1.5);p.life-=dt;});
  parts=parts.filter(p=>p.life>0);
  fxts.forEach(t=>{t.y+=t.vy*dt;t.life-=dt;});
  fxts=fxts.filter(t=>t.life>0);
}
function drawParts(){
  parts.forEach(p=>{
    const a=p.life/p.max;
    if(p.kind==='smoke'){
      cx.globalAlpha=a*.5;cx.fillStyle=p.col;
      const sz=Math.round(p.sz*(1.3-a*.4));
      cx.fillRect(Math.round(p.x-sz/2),Math.round(p.y-sz/2),sz,sz);
    }else{
      cx.globalAlpha=a;cx.fillStyle=p.col;
      const sz=p.kind==='ring'?Math.round(p.sz*(1-a)*2+1):Math.round(p.sz*a+.5);
      if(sz>0)cx.fillRect(Math.round(p.x-sz/2),Math.round(p.y-sz/2),sz,sz);
    }
  });
  cx.globalAlpha=1;
  fxts.forEach(t=>{
    cx.globalAlpha=Math.min(1,t.life/t.max);cx.fillStyle=t.col;
    cx.font=`bold ${t.sz}px Courier New`;cx.textAlign='center';cx.fillText(t.text,t.x,t.y);
  });
  cx.globalAlpha=1;cx.textAlign='left';
}
