// ── Game loop ─────────────────────────────────────────────────────
function startGame(){
  score=0;lives=3;wave=0;combo=0;comboT=0;bombs=2;skillKills=0;fireballT=0;ghostT=0;
  rapidT=0;pierceT=0;shieldT=0;bombDist=BOMB_DIST;fDropGroup=0;fDropCount=0;hasMoved=false;godMode=false;cPressCount=0;
  pBullets=[];eBullets=[];pups=[];parts=[];fxts=[];blasts=[];waveSquads=[];
  boss=null;bossWave=false;bossWarnActive=false;betweenWave=false;betweenT=0;
  P=makePlayer();initBackground();launchWave(1);STATE='PLAYING';updateHUD();
}
function update(dt){
  if(STATE!=='PLAYING')return;
  updateBG(dt);updatePlayer(dt);updateWaves(dt);updateBullets(dt);updateItems(dt);
  checkCollisions();updateParts(dt);
  if(comboT>0){comboT-=dt;if(comboT<=0)combo=0;}
  if(flashA>0)flashA=Math.max(0,flashA-dt*3.5);
  if(shakeDur>0){shakeDur-=dt;shakeX=(Math.random()-.5)*shakeAmt*2;shakeY=(Math.random()-.5)*shakeAmt*2;}
  else{shakeX=0;shakeY=0;}
}
function draw(){
  cx.save();cx.translate(Math.round(shakeX),Math.round(shakeY));
  drawBG();drawEnemies();drawBullets();drawItems();drawPlayer();drawParts();
  drawBossWarning(); // overlay cutscene on top of gameplay
  if(flashA>0){cx.globalAlpha=flashA;cx.fillStyle=flashCol;cx.fillRect(0,0,W,H);cx.globalAlpha=1;}
  drawProgressBar(); // 우측 수직 진행 바
  drawHUDCanvas();
  if(STATE==='IDLE')drawIdle();
  if(STATE==='PAUSED')drawPaused();
  if(STATE==='GAMEOVER')drawGameOver();
  if(STATE==='CLEAR')drawGameClear();
  cx.restore();
}
let lastT=0;
function loop(ts){const dt=Math.min((ts-lastT)/1000,.05);lastT=ts;update(dt);draw();requestAnimationFrame(loop);}
initBackground();P=makePlayer();updateHUD();
requestAnimationFrame(ts=>{lastT=ts;requestAnimationFrame(loop);});
