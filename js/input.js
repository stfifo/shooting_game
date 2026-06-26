// ── Input ────────────────────────────────────────────────────────
const keys=new Set();
const KEY_VIS={ArrowUp:'ku',KeyW:'ku',ArrowDown:'kd',KeyS:'kd',ArrowLeft:'kl',KeyA:'kl',ArrowRight:'kr',KeyD:'kr',KeyZ:'k-z',KeyX:'k-x',Space:'k-space',Enter:'k-start'};
function setKeyVis(code,on){const id=KEY_VIS[code];if(id){const el=document.getElementById(id);if(el)el.classList.toggle('active',on);}}
const MOVE_KEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);
addEventListener('keydown',e=>{
  if(keys.has(e.code))return;
  keys.add(e.code);setKeyVis(e.code,true);
  if(STATE==='PLAYING'&&MOVE_KEYS.has(e.code))hasMoved=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code))e.preventDefault();
  if(e.code==='Space'){if(STATE==='PLAYING')STATE='PAUSED';else if(STATE==='PAUSED')STATE='PLAYING';}
  if((e.code==='Enter'||e.code==='Space')&&(STATE==='IDLE'||STATE==='GAMEOVER'||STATE==='CLEAR'))startGame();
  if(STATE==='PLAYING'){
    if(e.code==='KeyZ')useBomb();
    if(e.code==='KeyX')useSkill();
    if(e.code==='ShiftLeft'||e.code==='ShiftRight'){
      cPressCount++;
      if(cPressCount>=5){cPressCount=0;godMode=!godMode;
        addFx(godMode?'✦ GOD MODE ✦':'✦ MORTAL ✦',W/2,H/2-10,godMode?'#ffd700':'#aaa',20);
        flashIt(godMode?'rgba(255,215,0,.35)':'rgba(180,180,180,.3)');
      }
    }
  }
});
addEventListener('keyup',e=>{keys.delete(e.code);setKeyVis(e.code,false);});
