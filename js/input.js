// ── Input ────────────────────────────────────────────────────────
const keys=new Set();
const KEY_VIS={ArrowUp:'ku',KeyW:'ku',ArrowDown:'kd',KeyS:'kd',ArrowLeft:'kl',KeyA:'kl',ArrowRight:'kr',KeyD:'kr',KeyZ:'k-z',KeyX:'k-x',Space:'k-space',Enter:'k-start'};
function setKeyVis(code,on){const id=KEY_VIS[code];if(id){const el=document.getElementById(id);if(el)el.classList.toggle('active',on);}}
addEventListener('keydown',e=>{
  if(keys.has(e.code))return;
  keys.add(e.code);setKeyVis(e.code,true);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code))e.preventDefault();
  if(e.code==='Space'){if(STATE==='PLAYING')STATE='PAUSED';else if(STATE==='PAUSED')STATE='PLAYING';}
  if((e.code==='Enter'||e.code==='Space')&&(STATE==='IDLE'||STATE==='GAMEOVER'||STATE==='CLEAR'))startGame();
  if(STATE==='PLAYING'){if(e.code==='KeyZ')useBomb();if(e.code==='KeyX')useSkill();}
});
addEventListener('keyup',e=>{keys.delete(e.code);setKeyVis(e.code,false);});
