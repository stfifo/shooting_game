// ── Space Background ─────────────────────────────────────────────
// Phase: 0=Earth, 1=Atmosphere, 2=Mars, 3=Uranus/Neptune,
//        4=Pluto/KuiperBelt, 5=Galaxy, 6=AlienWorld
let bgPhase=0, bgBlend=0;
const STARS=[], BG_OBJS=[];
let bgScrollY=0;

function initBackground(){
  STARS.length=0;BG_OBJS.length=0;bgPhase=0;bgBlend=0;bgScrollY=0;
  for(let i=0;i<180;i++)STARS.push({x:rnd(0,W),y:rnd(0,H),r:rnd(.5,2),spd:rnd(5,20),br:rnd(.3,1)});
  for(let i=0;i<14;i++)BG_OBJS.push({type:'cloud',x:rnd(0,W),y:rnd(-H,H),w:rnd(50,140),h:rnd(18,45),spd:rnd(30,80)});
  for(let i=0;i<18;i++)BG_OBJS.push({type:'rock',x:rnd(0,W),y:rnd(-H,H),r:rnd(4,18),spd:rnd(25,65),rot:rnd(0,Math.PI*2),rs:rnd(-.8,.8)});
  for(let i=0;i<6;i++)BG_OBJS.push({type:'nebula',x:rnd(0,W),y:rnd(-H,H),r:rnd(55,110),spd:rnd(12,28),col:pick(['rgba(80,20,160,','rgba(180,20,60,','rgba(20,80,160,'])});
  for(let i=0;i<16;i++)BG_OBJS.push({type:'ice',x:rnd(0,W),y:rnd(-H,H),r:rnd(5,16),spd:rnd(18,50),rot:rnd(0,Math.PI*2),rs:rnd(-.5,.5)});
  for(let i=0;i<5;i++)BG_OBJS.push({type:'galaxy',x:rnd(40,W-40),y:rnd(-H,H),r:rnd(40,80),spd:rnd(8,20),col:pick(['rgba(180,100,255,','rgba(100,150,255,','rgba(255,150,100,'])});
  for(let i=0;i<10;i++)BG_OBJS.push({type:'alien',x:rnd(0,W),y:rnd(-H,H),r:rnd(8,24),spd:rnd(20,55)});
}

function targetBgPhase(){
  if(wave<=4)return 0;if(wave<=9)return 1;if(wave<=14)return 2;
  if(wave<=19)return 3;if(wave<=24)return 4;if(wave<=29)return 5;return 6;
}

function bgScrollSpeed(){
  if(wave<=4)return 20;if(wave<=9)return 42;if(wave<=14)return 68;
  if(wave<=19)return 100;if(wave<=24)return 130;if(wave<=29)return 165;return 200;
}

function updateBG(dt){
  const spd=bgScrollSpeed();
  bgScrollY=(bgScrollY+spd*dt)%H;
  const target=targetBgPhase();
  if(bgPhase!==target&&bgBlend>=1){bgPhase=target;bgBlend=0;}
  if(bgPhase!==target)bgBlend=Math.min(1,bgBlend+dt*.35);
  const spdMul=spd/30;
  STARS.forEach(s=>{s.y+=s.spd*spdMul*dt;if(s.y>H){s.y=-4;s.x=rnd(0,W);}});
  BG_OBJS.forEach(o=>{
    o.y+=o.spd*spdMul*dt;
    if(o.type==='rock'||o.type==='ice')o.rot+=o.rs*dt;
    if(o.y>H+120){o.y=-120;o.x=rnd(0,W);}
  });
}

function drawBG(){
  const GRADS=[
    ['#1a6fc8','#4a9fd8','#90c0e0'], // 0 Earth
    ['#0a1a3a','#101828','#161e2c'], // 1 Atmosphere
    ['#06040e','#100814','#180c0c'], // 2 Mars
    ['#041820','#062838','#083040'], // 3 Uranus/Neptune
    ['#050410','#07081a','#060810'], // 4 Pluto/Kuiper
    ['#020008','#030010','#040018'], // 5 Galaxy
    ['#010a02','#020d04','#030a03'], // 6 Alien
  ];
  const ph=bgPhase,t=bgBlend;
  const blend=(a,b)=>{
    const ca=parseInt(a.slice(1),16),cb=parseInt(b.slice(1),16);
    const r=Math.round(((ca>>16)*(1-t)+(cb>>16)*t));
    const g=Math.round((((ca>>8)&0xff)*(1-t)+((cb>>8)&0xff)*t));
    const bl=Math.round(((ca&0xff)*(1-t)+(cb&0xff)*t));
    return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
  };
  const G0=GRADS[ph]||GRADS[6],G1=GRADS[Math.min(6,ph+1)];
  const gg=cx.createLinearGradient(0,0,0,H);
  gg.addColorStop(0,blend(G0[0],G1[0]));gg.addColorStop(.5,blend(G0[1],G1[1]));gg.addColorStop(1,blend(G0[2],G1[2]));
  cx.fillStyle=gg;cx.fillRect(0,0,W,H);

  // Stars
  const starAlpha=clamp(ph+bgBlend-.5,0,1)*(.5+.5*(ph>=2?1:0));
  if(starAlpha>0.01){
    STARS.forEach(s=>{
      const tw=.45+.55*Math.abs(Math.sin(performance.now()*.0006*s.br+s.x));
      cx.globalAlpha=starAlpha*s.br*tw;cx.fillStyle='#fff';
      cx.fillRect(Math.round(s.x),Math.round(s.y),s.r>=1.5?2:1,s.r>=1.5?2:1);
    });
    cx.globalAlpha=1;
  }

  // Earth clouds
  const cloudA=Math.max(0,1-(ph+bgBlend));
  if(cloudA>0.02){
    BG_OBJS.filter(o=>o.type==='cloud').forEach(c=>{cx.globalAlpha=cloudA*.35;cx.fillStyle='#fff';drawPixelCloud(c.x,c.y,c.w,c.h);});
    cx.globalAlpha=1;if(ph===0)drawPixelTerrain();
  }

  // Asteroids (phases 2-3)
  const rockA=clamp(ph+bgBlend-1.2,0,.7)*clamp(4-ph-bgBlend,0,1);
  if(rockA>0.01){
    BG_OBJS.filter(o=>o.type==='rock').forEach(r=>{cx.globalAlpha=rockA;cx.save();cx.translate(r.x,r.y);cx.rotate(r.rot);drawPixelRock(r.r);cx.restore();});
    cx.globalAlpha=1;
  }

  // Nebula patches (phases 2-4)
  const nebA=clamp(ph+bgBlend-1.8,0,.55)*clamp(5-ph-bgBlend,0,1);
  if(nebA>0.01){
    BG_OBJS.filter(o=>o.type==='nebula').forEach(n=>{
      const gg2=cx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
      gg2.addColorStop(0,n.col+`${nebA*.5})`);gg2.addColorStop(1,n.col+'0)');
      cx.fillStyle=gg2;cx.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2);
    });
  }

  // Mars (phase 2)
  const marsA=clamp(ph+bgBlend-1.5,0,1)*clamp(3.2-ph-bgBlend,0,1)*.6;
  if(marsA>0.01){cx.globalAlpha=marsA;drawPixelMars(W-70,160,36);cx.globalAlpha=1;}

  // Jupiter (phase 2-3 transition)
  const ja=clamp(ph+bgBlend-2.5,0,1)*clamp(4.2-ph-bgBlend,0,1)*.7;
  if(ja>0.01){cx.globalAlpha=ja;drawPixelJupiter(W-80,120,46);cx.globalAlpha=1;}

  // Uranus + Neptune (phase 3)
  const uranA=clamp(ph+bgBlend-2.8,0,1)*clamp(4.5-ph-bgBlend,0,1)*.8;
  if(uranA>0.01){cx.globalAlpha=uranA;drawPixelUranus(W-72,100,42);drawPixelNeptune(58,175,34);cx.globalAlpha=1;}

  // Pluto + Kuiper Belt ice rocks (phase 4)
  const plutoA=clamp(ph+bgBlend-3.8,0,1)*clamp(5.5-ph-bgBlend,0,1)*.85;
  if(plutoA>0.01){
    cx.globalAlpha=plutoA;drawPixelPluto(W-58,148,30);cx.globalAlpha=1;
    BG_OBJS.filter(o=>o.type==='ice').forEach(r=>{cx.globalAlpha=plutoA*.9;cx.save();cx.translate(r.x,r.y);cx.rotate(r.rot);drawPixelIceRock(r.r);cx.restore();});
    cx.globalAlpha=1;
  }

  // Galaxy spirals (phase 5)
  const galA=clamp(ph+bgBlend-4.8,0,1)*clamp(6.5-ph-bgBlend,0,1)*.75;
  if(galA>0.01){
    cx.globalAlpha=galA;
    BG_OBJS.filter(o=>o.type==='galaxy').forEach(g=>drawGalaxy(g.x,g.y,g.r,g.col));
    cx.globalAlpha=1;
  }

  // Alien world (phase 6) — eerie green atmosphere + alien pods
  const alienA=clamp(ph+bgBlend-5.8,0,1)*.85;
  if(alienA>0.01){
    const glow=cx.createLinearGradient(0,H*.5,0,H);
    glow.addColorStop(0,'rgba(0,100,0,0)');glow.addColorStop(1,`rgba(0,140,30,${alienA*.5})`);
    cx.fillStyle=glow;cx.fillRect(0,0,W,H);
    BG_OBJS.filter(o=>o.type==='alien').forEach(a=>{cx.globalAlpha=alienA*.9;drawAlienPod(a.x,a.y,a.r);});
    cx.globalAlpha=1;
  }
}

// ── Pixel art draw helpers ────────────────────────────────────────
function drawPixelCloud(x,y,w,h){
  const S=4,cw=Math.ceil(w/S),ch=Math.ceil(h/S);
  const cx2=Math.round(cw/2),cy2=Math.round(ch/2);
  for(let r=0;r<ch;r++)for(let c=0;c<cw;c++){
    const dx=(c-cx2)/cx2,dy=(r-cy2)/cy2;
    if(dx*dx*.7+dy*dy<1)cx.fillRect(x+c*S,y+r*S,S,S);
  }
}
function drawPixelTerrain(){
  const S=4,strips=[{y:H-28,col:'#2a5518',h:8},{y:H-20,col:'#3a6a28',h:6},{y:H-14,col:'#4a7a38',h:5},{y:H-9,col:'#5a8a48',h:5},{y:H-4,col:'#6a9a58',h:4}];
  strips.forEach(s=>{cx.fillStyle=s.col;for(let x=0;x<W;x+=S)if(Math.random()>.08)cx.fillRect(x,s.y,S,s.h);});
}
function drawPixelRock(r){
  const S=2,ir=Math.ceil(r/S);
  cx.fillStyle='#6a5a48';
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++)if(x*x*.9+y*y<ir*ir*.85)cx.fillRect(x*S,y*S,S,S);
  cx.fillStyle='#4a3a30';cx.fillRect(-S,0,S,S);cx.fillRect(S,-S,S,S);
}
function drawPixelMars(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y<ir*ir){const n=(x+y+ir*.5)/(ir*2);cx.fillStyle=n>.55?'#c04820':n>.3?'#a03818':'#802810';cx.fillRect(px+x*S,py+y*S,S,S);}
  }
  cx.fillStyle='#f0e8d8';for(let x=-2;x<=2;x++)cx.fillRect(px+x*S,py-ir*S+S,S,S);
}
function drawPixelJupiter(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  const bands=['#c87840','#e8a860','#d89050','#f0c080','#c06830','#e09050'];
  for(let y=-ir;y<=ir;y++){
    const bIdx=Math.floor(((y+ir)/(ir*2))*bands.length);
    for(let x=-ir;x<=ir;x++)if(x*x+y*y<ir*ir){cx.fillStyle=bands[bIdx%bands.length];cx.fillRect(px+x*S,py+y*S,S,S);}
  }
  cx.fillStyle='#c83010';
  for(let y=-1;y<=1;y++)for(let x=-2;x<=2;x++)if(x*x*.7+y*y<3)cx.fillRect(px+x*S+S*2,py+y*S+S,S,S);
}
function drawPixelUranus(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y<ir*ir){const n=(x+ir)/(ir*2);cx.fillStyle=n>.6?'#88ddcc':n>.3?'#55bbaa':'#33998a';cx.fillRect(px+x*S,py+y*S,S,S);}
  }
  // 고리
  cx.globalAlpha=.3;cx.fillStyle='#aaeedd';
  for(let rx=-(ir+5);rx<=(ir+5);rx++)if(Math.abs(rx)>ir*.9)cx.fillRect(px+rx*S-1,py-2,2,4);
  cx.globalAlpha=1;
}
function drawPixelNeptune(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y<ir*ir){const n=(y+ir)/(ir*2);cx.fillStyle=n>.65?'#1a4888':n>.35?'#1a3870':'#0e2858';cx.fillRect(px+x*S,py+y*S,S,S);}
  }
  cx.fillStyle='#2a58a8';for(let x=-1;x<=1;x++)cx.fillRect(px+x*S-S,py+S,S,S);
}
function drawPixelPluto(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  const hs=ir*0.45, hcy=ir*0.08; // Tombaugh Regio 하트 크기·중심 오프셋
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y>=ir*ir)continue;
    const nhx=x/hs, nhy=(y-hcy)/hs;
    // 캔버스 좌표계(y↓)에서 위쪽 두 봉우리, 아래 꼭짓점을 갖는 하트: (r²-1)³+x²y³≤0
    const hv=Math.pow(nhx*nhx+nhy*nhy-1,3)+nhx*nhx*Math.pow(nhy,3);
    if(hv<=0){
      // Tombaugh Regio — 밝은 크림색 질소 얼음 평원
      const d=Math.sqrt(nhx*nhx+nhy*nhy);
      cx.fillStyle=d<0.45?'#f8ecd8':'#eedfc0';
    } else {
      // 표면 — 적갈색 계열 (목성과 달리 줄무늬 없이 얼룩덜룩)
      const t=((x*x+y*y)/(ir*ir)*0.4+(x*0.3+y*0.2+ir)/(ir*2)*0.6);
      cx.fillStyle=t>.65?'#88706a':t>.42?'#6a5248':'#50403a';
    }
    cx.fillRect(px+x*S,py+y*S,S,S);
  }
  // 질소 극관
  cx.fillStyle='#eddfc8';for(let x=-2;x<=2;x++)cx.fillRect(px+x*S,py-ir*S+S,S,S);
}
function drawPixelIceRock(r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x*.9+y*y<ir*ir*.85){const n=(x+y+ir*2)/(ir*4);cx.fillStyle=n>.65?'#cce8f0':n>.4?'#99bbcc':'#6688aa';cx.fillRect(x*S,y*S,S,S);}
  }
  cx.fillStyle='#eef8ff';cx.fillRect(-S,-S,S,S);
}
function drawGalaxy(gx,gy,gr,col){
  for(let i=0;i<80;i++){
    const a=i*.42,r=gr*i/80;
    cx.globalAlpha=0.15+i/200;cx.fillStyle=col+'0.7)';
    cx.fillRect(Math.round(gx+Math.cos(a)*r),Math.round(gy+Math.sin(a)*r*.4),2,2);
    cx.fillRect(Math.round(gx+Math.cos(a+Math.PI)*r),Math.round(gy+Math.sin(a+Math.PI)*r*.4),2,2);
  }
  cx.globalAlpha=1;cx.fillStyle='#ffffff';cx.fillRect(gx-1,gy-1,3,3);
}
function drawAlienPod(px,py,r){
  const S=2,ir=Math.ceil(r/S);
  for(let y=-ir;y<=ir;y++)for(let x=-ir;x<=ir;x++){
    if(x*x+y*y<ir*ir){const n=(x+y+ir*2)/(ir*4);cx.fillStyle=n>.65?'#44cc44':n>.4?'#228822':'#116611';cx.fillRect(px+x*S,py+y*S,S,S);}
  }
  // 눈 (일정 주기로 깜빡)
  if(Math.floor(performance.now()/900)%7!==0){
    cx.fillStyle='#aaffaa';cx.fillRect(px-S*2,py-S,S,S);cx.fillRect(px+S,py-S,S,S);
  }
  // 녹색 발광 후광
  const gg=cx.createRadialGradient(px,py,0,px,py,r*2.5);
  gg.addColorStop(0,'rgba(0,200,50,.12)');gg.addColorStop(1,'rgba(0,0,0,0)');
  cx.fillStyle=gg;cx.fillRect(px-r*3,py-r*3,r*6,r*6);
}
