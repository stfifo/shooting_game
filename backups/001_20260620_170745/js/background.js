// ── Space Background ─────────────────────────────────────────────
// Phase: 0=Earth, 1=Upper Atmosphere, 2=Near Space/Mars, 3=Deep Space
let bgPhase=0, bgBlend=0;
const STARS=[], BG_OBJS=[];
let bgScrollY=0;

function initBackground(){
  STARS.length=0;BG_OBJS.length=0;bgPhase=0;bgBlend=0;bgScrollY=0;
  for(let i=0;i<180;i++)STARS.push({x:rnd(0,W),y:rnd(0,H),r:rnd(.5,2),spd:rnd(5,20),br:rnd(.3,1)});
  // Clouds (Earth)
  for(let i=0;i<14;i++)BG_OBJS.push({type:'cloud',x:rnd(0,W),y:rnd(-H,H),w:rnd(50,140),h:rnd(18,45),spd:rnd(30,80)});
  // Asteroids (Near Space)
  for(let i=0;i<18;i++)BG_OBJS.push({type:'rock',x:rnd(0,W),y:rnd(-H,H),r:rnd(4,18),spd:rnd(25,65),rot:rnd(0,Math.PI*2),rs:rnd(-.8,.8)});
  // Nebula patches (Deep Space)
  for(let i=0;i<6;i++)BG_OBJS.push({type:'nebula',x:rnd(0,W),y:rnd(-H,H),r:rnd(55,110),spd:rnd(12,28),col:pick(['rgba(80,20,160,','rgba(180,20,60,','rgba(20,80,160,'])});
}

function targetBgPhase(){
  if(wave<=4)return 0;if(wave<=9)return 1;if(wave<=14)return 2;return 3;
}

// 웨이브가 높아질수록 배경 스크롤 속도 증가 (지구 → 우주로 가속하는 느낌)
function bgScrollSpeed(){
  if(wave<=4)return 20;
  if(wave<=9)return 42;
  if(wave<=14)return 68;
  return 100;
}

function updateBG(dt){
  const spd=bgScrollSpeed();
  bgScrollY=(bgScrollY+spd*dt)%H;
  const target=targetBgPhase();
  if(bgPhase!==target&&bgBlend>=1){bgPhase=target;bgBlend=0;}
  if(bgPhase!==target)bgBlend=Math.min(1,bgBlend+dt*.35);
  // 별과 배경 오브젝트도 스크롤 속도 배율 적용
  const spdMul=spd/30;
  STARS.forEach(s=>{s.y+=s.spd*spdMul*dt;if(s.y>H){s.y=-4;s.x=rnd(0,W);}});
  BG_OBJS.forEach(o=>{o.y+=o.spd*spdMul*dt;if(o.type==='rock')o.rot+=o.rs*dt;if(o.y>H+120){o.y=-120;o.x=rnd(0,W);}});
}

function drawBG(){
  // ── Sky gradient per phase ──
  const GRADS=[
    ['#1a6fc8','#4a9fd8','#90c0e0'], // Earth blue
    ['#0a1a3a','#101828','#161e2c'], // Atmosphere dark blue
    ['#06040e','#100814','#180c0c'], // Near space dark red hint
    ['#000003','#000008','#050010'], // Deep space black
  ];
  const ph=bgPhase, t=bgBlend;
  const blend=(a,b)=>{
    // rough hex blend
    const ca=parseInt(a.slice(1),16), cb=parseInt(b.slice(1),16);
    const r=Math.round(((ca>>16)*(1-t)+(cb>>16)*t));
    const g=Math.round((((ca>>8)&0xff)*(1-t)+((cb>>8)&0xff)*t));
    const bl=Math.round(((ca&0xff)*(1-t)+(cb&0xff)*t));
    return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
  };
  const G0=GRADS[ph]||GRADS[3], G1=GRADS[Math.min(3,ph+1)];
  const gg=cx.createLinearGradient(0,0,0,H);
  gg.addColorStop(0,blend(G0[0],G1[0]));
  gg.addColorStop(.5,blend(G0[1],G1[1]));
  gg.addColorStop(1,blend(G0[2],G1[2]));
  cx.fillStyle=gg;cx.fillRect(0,0,W,H);

  // ── Stars (fade in from phase 1) ──
  const starAlpha=clamp(ph+bgBlend*(ph<3?1:0)-.5,0,1)*(.5+.5*(ph>=2?1:0));
  if(starAlpha>0.01){
    STARS.forEach(s=>{
      const tw=.45+.55*Math.abs(Math.sin(performance.now()*.0006*s.br+s.x));
      cx.globalAlpha=starAlpha*s.br*tw;
      cx.fillStyle='#fff';
      const px=Math.round(s.x), py=Math.round(s.y), sr=s.r>=1.5?2:1;
      cx.fillRect(px,py,sr,sr);
    });
    cx.globalAlpha=1;
  }

  // ── Earth clouds ──
  const cloudA=Math.max(0,1-(ph+bgBlend));
  if(cloudA>0.02){
    BG_OBJS.filter(o=>o.type==='cloud').forEach(c=>{
      cx.globalAlpha=cloudA*.35;cx.fillStyle='#fff';
      drawPixelCloud(c.x,c.y,c.w,c.h);
    });
    cx.globalAlpha=1;
    // Terrain strip (Earth only)
    if(ph===0){
      drawPixelTerrain();
    }
  }

  // ── Asteroids (phase 2+) ──
  const rockA=clamp(ph+bgBlend-1.2,0,.7);
  if(rockA>0.01){
    BG_OBJS.filter(o=>o.type==='rock').forEach(r=>{
      cx.globalAlpha=rockA;
      cx.save();cx.translate(r.x,r.y);cx.rotate(r.rot);
      drawPixelRock(r.r);cx.restore();
    });
    cx.globalAlpha=1;
  }

  // ── Nebula / planets (phase 3) ──
  const nebA=clamp(ph+bgBlend-2.2,0,.55);
  if(nebA>0.01){
    BG_OBJS.filter(o=>o.type==='nebula').forEach(n=>{
      const gg2=cx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
      gg2.addColorStop(0,n.col+`${nebA*.5})`);
      gg2.addColorStop(1,n.col+'0)');
      cx.fillStyle=gg2;cx.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2);
    });
    // Jupiter (deep space) – pixel art
    if(ph>=3||bgBlend>.5){
      const ja=clamp(ph+bgBlend-2.8,0,1)*.7;
      cx.globalAlpha=ja;
      drawPixelJupiter(W-80,120,46);
      cx.globalAlpha=1;
    }
  }

  // ── Mars / red planet (phase 2) ──
  const marsA=clamp(ph+bgBlend-1.5,0,1)*clamp(3-ph-bgBlend,0,1)*.6;
  if(marsA>0.01){cx.globalAlpha=marsA;drawPixelMars(W-70,160,36);cx.globalAlpha=1;}
}

function drawPixelCloud(x,y,w,h){
  // Pixel art cloud: arrange squares in blob shape
  const S=4,cw=Math.ceil(w/S),ch=Math.ceil(h/S);
  const cx2=Math.round(cw/2), cy2=Math.round(ch/2);
  for(let r=0;r<ch;r++)for(let c=0;c<cw;c++){
    const dx=(c-cx2)/cx2, dy=(r-cy2)/cy2;
    if(dx*dx*.7+dy*dy<1)cx.fillRect(x+c*S,y+r*S,S,S);
  }
}
function drawPixelTerrain(){
  // Simple pixel terrain strip at bottom
  const S=4, strips=[
    {y:H-28,col:'#2a5518',h:8},{y:H-20,col:'#3a6a28',h:6},{y:H-14,col:'#4a7a38',h:5},
    {y:H-9,col:'#5a8a48',h:5},{y:H-4,col:'#6a9a58',h:4}
  ];
  strips.forEach(s=>{cx.fillStyle=s.col;for(let x=0;x<W;x+=S)if(Math.random()>.08)cx.fillRect(x,s.y,S,s.h);});
}
function drawPixelRock(r){
  const S=2,ir=Math.ceil(r/S);
  cx.fillStyle='#6a5a48';
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x*.9+y*y<ir*ir*.85)cx.fillRect(x*S,y*S,S,S);
  }
  cx.fillStyle='#4a3a30';
  cx.fillRect(-S,0,S,S);cx.fillRect(S,-S,S,S);
}
function drawPixelMars(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y<ir*ir){
      const n=(x+y+ir*.5)/(ir*2);
      cx.fillStyle=n>.55?'#c04820':n>.3?'#a03818':'#802810';
      cx.fillRect(px+x*S,py+y*S,S,S);
    }
  }
  // Ice cap
  cx.fillStyle='#f0e8d8';
  for(let x=-2;x<=2;x++)cx.fillRect(px+x*S,py-ir*S+S,S,S);
}
function drawPixelJupiter(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  const bands=['#c87840','#e8a860','#d89050','#f0c080','#c06830','#e09050'];
  for(let y=-ir;y<=ir;y++){
    const bIdx=Math.floor(((y+ir)/(ir*2))*bands.length);
    for(let x=-ir;x<=ir;x++){
      if(x*x+y*y<ir*ir){cx.fillStyle=bands[bIdx%bands.length];cx.fillRect(px+x*S,py+y*S,S,S);}
    }
  }
  // Great Red Spot
  cx.fillStyle='#c83010';
  for(let y=-1;y<=1;y++)for(let x=-2;x<=2;x++)
    if(x*x*.7+y*y<3)cx.fillRect(px+x*S+S*2,py+y*S+S,S,S);
}
