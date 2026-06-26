// ── Special Abilities ────────────────────────────────────────────
function useBomb(){
  if(bombs<=0)return;bombs--;
  const r=bombDist*30;
  getEnemies().forEach(m=>{
    const dx=m.x-P.x,dy=m.y-P.y;
    if(dx*dx+dy*dy<=r*r)killEnemy(m,true);
  });
  if(boss&&boss.alive){
    const dmg=(boss.tier||1)<=3?0.10:0.20;
    boss.hp=Math.max(1,boss.hp-Math.floor(boss.maxHp*dmg));
    addHitSpark(boss.x,boss.y);
  }
  addBombBlast(P.x,P.y,bombDist*30);
  addFx('BOMB!',W/2,H/2,'#f80',28);flashIt('rgba(255,170,40,.6)');doShake(10,.45);updateHUD();
}
function useSkill(){
  if(skillKills<SKILL_GOAL)return;
  skillKills=0;fireballT=FIREBALL_DUR;P.weapon=5;P.wpTimer=FIREBALL_DUR;
  addFx('FIREBALL!',W/2,H/2-18,'#f60',24);flashIt('rgba(255,80,0,.35)');doShake(5,.2);updateHUD();
}
