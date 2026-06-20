// ── Special Abilities ────────────────────────────────────────────
function useBomb(){
  if(bombs<=0)return;bombs--;
  getEnemies().forEach(m=>killEnemy(m,true));
  if(boss&&boss.alive){boss.hp=Math.max(1,boss.hp-Math.floor(boss.maxHp*.25));addHitSpark(boss.x,boss.y);}
  addFx('BOMB!',W/2,H/2,'#f80',28);flashIt('rgba(255,170,40,.6)');doShake(10,.45);updateHUD();
}
function useSkill(){
  if(skillKills<SKILL_GOAL)return;
  skillKills=0;fireballT=FIREBALL_DUR;P.weapon=5;P.wpTimer=FIREBALL_DUR;
  addFx('FIREBALL!',W/2,H/2-18,'#f60',24);flashIt('rgba(255,80,0,.35)');doShake(5,.2);updateHUD();
}
