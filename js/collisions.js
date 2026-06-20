// ── Collisions ───────────────────────────────────────────────────
function ovlp(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2;}
function killEnemy(m,bomb=false){
  m.alive=false;
  const mul=bomb?1:Math.max(1,1+Math.floor(combo/5));
  score+=(EDEFS[m.type]?.pts||100)*mul;
  if(!bomb){skillKills=Math.min(SKILL_GOAL,skillKills+1);if(skillKills>=SKILL_GOAL&&P&&P.weapon!==5)addFx('SKILL READY [X]',W/2,80,'#ff0',13);}
  combo++;comboT=3;explode(m.x,m.y,m.type);dropItem(m.x,m.y);
  if(!bomb)addFx(`+${(EDEFS[m.type]?.pts||100)*mul}`,m.x,m.y-10,'#fff',12);
  updateHUD();
}
function checkCollisions(){
  const ens=getEnemies();
  pBullets.forEach(b=>{
    if(!b.alive)return;
    ens.forEach(m=>{if(!m.alive||!ovlp(b,m))return;
      if(b.pierce){if(b.hset.has(m))return;b.hset.add(m);}else b.alive=false;
      m.hp-=b.dmg||1;if(m.hp<=0)killEnemy(m);else addHitSpark(b.x,b.y);});
    if(boss&&boss.alive&&!boss.entering){
      const bh={x:boss.x,y:boss.y,w:boss.w*.85,h:boss.h*.85};
      if(ovlp(b,bh)){
        if(b.pierce){if(!b.bossHit){b.bossHit=true;boss.hp-=b.dmg||1;addHitSpark(boss.x,boss.y);}}
        else{b.alive=false;boss.hp-=b.dmg||1;addHitSpark(boss.x,boss.y);}
        if(boss.hp<=0)killBoss();
      }
    }
  });
  if(!P||!P.alive||P.invT>0)return;
  eBullets.forEach(b=>{if(!b.alive||!ovlp(b,P))return;b.alive=false;hitPlayer();});
  ens.forEach(m=>{if(!m.alive)return;const smol={x:m.x,y:m.y,w:m.w*.65,h:m.h*.65};if(ovlp(smol,P)){killEnemy(m,true);hitPlayer();}});
  if(boss&&boss.alive&&!boss.entering){const bh={x:boss.x,y:boss.y,w:boss.w*.55,h:boss.h*.55};if(ovlp(bh,P))hitPlayer();}
}
function hitPlayer(){
  lives--;P.invT=2.5;P.weapon=1;P.wpTimer=0;P.fireT=.5;
  doShake(8,.38);flashIt('rgba(255,0,0,.4)');explode(P.x,P.y,'A');
  if(lives<=0){P.alive=false;setTimeout(()=>{STATE='GAMEOVER';if(score>hiScore){hiScore=score;localStorage.setItem('LocalMaxScore',hiScore);}},1800);}
  updateHUD();
}
