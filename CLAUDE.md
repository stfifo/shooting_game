# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Strikers 1945+ 스타일의 종스크롤 슈팅 게임. 빌드 도구 없이 브라우저에서 직접 열면 바로 실행된다.  
CSS는 `style.css`, JS는 `js/` 하위 17개 파일로 분리되어 있으며, `game.html`은 HTML 셸 역할만 한다.

## 실행 방법

```
# 브라우저에서 직접 열기
start game.html          # Windows
open game.html           # macOS
```

별도 서버, 빌드, 패키지 설치 없음. 수정 후 브라우저 새로고침(F5)으로 확인.  
**주의**: ES 모듈 미사용(`file://` CORS 문제). 일반 `<script src="">` 태그로 로드 — 모든 변수가 전역 스코프 공유.

## 파일 구조

```
assign3/
├── game.html             # HTML 셸만 (CSS·JS 모두 외부 파일)
├── style.css             # 전체 UI 스타일 (HUD, 키 피드백, 레이아웃)
├── js/                   # 게임 JS 컴포넌트 (로드 순서 = 의존 순서)
│   ├── constants.js      # Canvas setup, Utilities, 게임 상수
│   ├── state.js          # 전역 가변 상태 변수
│   ├── input.js          # 키보드 입력 처리
│   ├── sprites.js        # 픽셀 아트 엔진 + 스프라이트 데이터
│   ├── background.js     # 배경 시스템 (지구→심우주 4단계)
│   ├── player.js         # 플레이어 엔티티 + 사격
│   ├── abilities.js      # 특수 능력 (폭탄, 스킬)
│   ├── enemies.js        # 적 정의 + 드로우 함수 + drawEnemies
│   ├── bullets.js        # 총알 시스템
│   ├── formations.js     # 편대 시스템 (FMTS, ENTRY, Squadron FSM)
│   ├── boss.js           # 보스 + 경고 연출
│   ├── waves.js          # 웨이브 정의 + 웨이브 관리
│   ├── items.js          # 아이템 시스템
│   ├── particles.js      # 파티클 + 화면 이펙트
│   ├── collisions.js     # 충돌 감지 + 전투 처리
│   ├── hud.js            # HUD + 오버레이 화면
│   └── game.js           # 게임 루프 (startGame, update, draw, loop)
├── backups/              # 자동 백업 (NNN_YYYYMMDD_HHmmss/ 폴더)
├── report.md             # 과제 보고서
└── .claude/
    ├── settings.json     # 훅 설정 (자동 백업, 알림, 완료 메시지)
    └── commands/         # 커스텀 슬래시 커맨드
        ├── design.md     # /design — 시각 디자인 개선
        ├── logic.md      # /logic  — 게임 로직·밸런스 개선
        ├── uiux.md       # /uiux   — UI/UX 개선
        └── refactor.md   # /refactor — 코드 구조 개선
```

## game.html 아키텍처

`game.html`은 HTML 셸만 담당한다. CSS는 `<link href="style.css">`, JS는 `js/` 디렉토리의 17개 파일로 분리되어 `<script src="">` 순서대로 로드된다. 각 파일은 섹션 주석(`// ── 이름 ──`)으로 시작한다. 위에서 아래로 선언 순서가 의존 순서이기도 하다.

### 게임 상태 머신
`STATE` 변수가 `'IDLE' → 'PLAYING' → 'PAUSED' / 'GAMEOVER'` 로 전환된다.  
`update(dt)` / `draw()` 는 매 프레임 호출되지만 `STATE !== 'PLAYING'` 이면 `update`는 조기 반환한다.

### 배경 시스템
- **페이즈 0~3**: 지구(파랑) → 대기권 → 화성 → 심우주. `wave` 값으로 `targetBgPhase()` 가 결정.
- `bgBlend(0→1)` 로 두 페이즈 사이를 부드럽게 보간. 완전히 전환된 뒤 `bgPhase` 가 갱신된다.
- `bgScrollSpeed()` 가 웨이브별 스크롤 속도를 반환(20→42→68→100 px/s). `STARS`, `BG_OBJS` 모두 동일 배율 적용.

### 픽셀 아트 렌더링
`pxDraw(data, pal, ox, oy)` 함수가 2D 숫자 배열을 `fillRect` 격자로 렌더링한다. `PX=3` 이 픽셀 스케일.  
스프라이트 데이터: `SPR_P`(플레이어), `SPR_A/B/C`(적 A/B/C), `BOSS_BODY`(보스).  
팔레트: `PAL_P`, `PAL_A`, `PAL_B`, `PAL_C`, `PAL_G`(고스트).

### 편대(Squadron) 시스템
`makeSquad(type, fmtKey, pivotX, targetY, delay, entryKey)` 로 생성.  
각 편대는 `DELAY → ENTER → HOLD → ATTACK` 4단계를 거친다.
- **ENTER**: `cbez()` 큐빅 베지어로 진입 경로 보간. `ENTRY` 맵에서 경로 제어점 선택.
- **HOLD**: 피벗이 좌우로 스윕. `holdT`(3.5~5.5초) 소진 후 ATTACK으로 전환.
- **ATTACK**: 멤버가 플레이어를 향해 돌격, 화면 아래로 나가면 재진입.

**전원 사망 시 단계 진행**: 멤버가 ENTER 중 전원 사망하면 HOLD로 전환하고 `holdT`를 정상 소진한 뒤 ATTACK으로 넘어간다. HOLD 중 전원 사망하면 `holdT` 남은 시간을 계속 카운트다운한 뒤 ATTACK으로 전환한다. `squadDone(sq)` 는 `phase==='ATTACK'` 이고 전원 사망한 경우에만 `true`를 반환한다 — ENTER/HOLD 단계에서 일찍 전멸해도 wave clear가 즉시 트리거되지 않는다.

`WAVE_NORMAL` 배열(12패턴)이 순환하며 비보스 웨이브를 정의. `waveIdx % 5 === 0` 이면 보스 웨이브.

### 보스 시스템
- `startBossWarning()` → 3.5초 경고 연출 → `spawnBossNow()` 순서로 진행.
- **중요**: `updateWaves()` 의 wave-clear 조건에 `!bossWarnActive` 가 반드시 포함되어야 한다. 없으면 경고 중 편대가 전멸할 때 보스가 스폰되기 전에 다음 웨이브로 넘어가는 버그 발생.
- 보스 HP %에 따라 `phase 1→2→3` 자동 전환, 이동 속도·발사 패턴 에스컬레이션.

### 총알·충돌
`pBullets`(플레이어), `eBullets`(적) 배열. `ovlp(a,b)` AABB 충돌.  
파이어볼 탄은 `pierce:true`, `hset: Set` 으로 관통 처리(같은 적에게 중복 피해 방지).

### 파티클
`parts[]` 배열. 파티클 종류: `spark / debris / smoke / ring`. `explode()` 가 4종류를 함께 생성.

### HUD
- DOM 업데이트: `updateHUD()` — 점수, 생명, 폭탄, 스킬 게이지.
- Canvas 위 오버레이: `drawHUDCanvas()` — 콤보, 스킬 준비, 웨이브 클리어 배너.
- 우측 수직 진행 바: `drawProgressBar()` — wave 1~`TOTAL_WAVES`(20) 진행률, 보스 마커 포함.

### 주요 상수 (변경 시 밸런스 영향)

| 상수 | 값 | 의미 |
|---|---|---|
| `TOTAL_WAVES` | 20 | 완주 기준 웨이브 수 (진행 바 기준) |
| `SKILL_GOAL` | 20 | 스킬 충전에 필요한 킬 수 |
| `FIREBALL_DUR` | 5 | 파이어볼 지속 시간(초) |
| `GHOST_DUR` | 15 | 윙맨 지속 시간(초) |
| `BOMB_MAX` | 3 | 폭탄 최대 보유 수 |
| `FIRE_RATE` | 0.13 | 기본 연사 간격(초) |

## 자동 백업

`Edit|Write|MultiEdit` 도구 사용 직후 `.claude/settings.json` 의 `PostToolUse` 훅이 **폴더 전체**를 `backups/NNN_YYYYMMDD_HHmmss/` 형태로 자동 저장한다.  
`backups/` 폴더 자신은 `Get-ChildItem -Exclude backups` 로 제외하여 재귀 복사를 방지한다.  
훅 내부에서 경로 문자열을 `$dest = 'backups/' + $num + '_' + $date` 방식으로 조합한다. `-Destination "..."` 식 인라인 이중 따옴표는 PowerShell `-Command` 인자를 조기 종료시키므로 사용하지 않는다.

## 커스텀 슬래시 커맨드

| 커맨드 | 용도 |
|---|---|
| `/design` | 배경·스프라이트·파티클·보스 연출 등 시각 완성도 |
| `/logic` | 적 패턴, 밸런스, 보스 페이즈, 아이템 드롭 |
| `/uiux` | HUD 배치, 화면 전환 흐름, 키 피드백 |
| `/refactor` | 함수 분리, 상수 추출, 한국어 주석 — 동작 변경 없이 구조만 |

## 로컬 영구 저장

최고 점수만 `localStorage.setItem('LocalMaxScore', hiScore)` 로 저장된다.

---

## 구현된 기능 목록

| 카테고리 | 기능 |
|---|---|
| **이동·사격** | 화살표/WASD 이동, 자동 연사(FIRE_RATE=0.13s), 5단계 무기 업그레이드 |
| **특수 능력** | 폭탄(Z, 전체 적 제거·보스 25% 데미지), 스킬(X, 킬 20회 충전 후 파이어볼 전환) |
| **무기 시스템** | SINGLE → DOUBLE → TRIPLE → SPREAD → FIREBALL (5종), 피격 시 SINGLE 복귀 |
| **윙맨** | 아이템 획득 시 15초간 좌우 고스트 전투기 동행 |
| **적 편대** | A/B/C 3종 적, 12가지 WAVE_NORMAL 패턴 순환, 큐빅 베지어 진입 경로 |
| **보스** | 5웨이브마다 등장, HP%에 따른 phase 1→2→3 자동 전환, 미니언 소환(phase 2+) |
| **보스 경고 연출** | 3.5초 전체 화면 빨간 플래시 + WARNING 텍스트 + 카운트다운 |
| **아이템 드롭** | P(파워업), B(폭탄), F(윙맨), L(목숨) 4종 랜덤 드롭 |
| **배경** | 4단계 스크롤 배경 (지구→대기권→화성→심우주), 웨이브별 스크롤 속도 차등 |
| **파티클** | spark/debris/smoke/ring 4종 폭발 이펙트, 피격 스파크, 플로팅 텍스트 |
| **HUD** | 점수/최고점/웨이브(DOM), 콤보/스킬준비/진행바/보스HP(Canvas) |
| **진행 바** | 우측 4px 수직 바, 보스웨이브 빨간 마커, 완주 시 점멸 강조 |
| **화면 전환** | IDLE → PLAYING → PAUSED / GAMEOVER, 각 전용 오버레이 |
| **키 피드백** | 누른 키 실시간 하이라이트 (HTML .key.active CSS) |
| **점수 저장** | localStorage 최고 점수 영속 저장 |

---

## 컴포넌트/모듈 구조

`game.html` 내 `<script>` 가 `// ── 이름 ──` 주석으로 수직 분리된다. 아래서 위로 의존 방향이 결정된다.

```
Utilities          (lerp, clamp, rnd, pick, cbez)
Constants          (P_SPD, FIRE_RATE, BOMB_MAX, SKILL_GOAL ...)
State              (STATE, score, lives, wave, combo ...)
Input              (keys Set, KEY_VIS, keydown/keyup 리스너)
Space Background   (bgPhase, bgBlend, STARS[], BG_OBJS[], drawBG)
Pixel Art Engine   (PX=3, pxDraw, SPR_P/A/B/C, PAL_*)
Player             (P 객체, makePlayer, updatePlayer, drawPlayer)
Special Abilities  (useBomb, useSkill)
Enemy Draw         (drawEA, drawEB, drawEC, drawBossSprite)
Enemy Definitions  (EDEFS: A/B/C — hp, pts, w, h, sRate)
Bullets            (pBullets[], eBullets[], updateBullets, drawBullets)
Formations         (FMTS, ENTRY, makeSquad, updateSquad, getEnemies)
Boss               (startBossWarning, spawnBossNow, updateBoss, bossShoot, killBoss)
Wave Definitions   (WAVE_NORMAL[12], launchWave, updateWaves)
Items              (pups[], dropItem, updateItems, drawItems, ITEM_COLS)
Pixel Particles    (parts[], fxts[], explode, addHitSpark, addFx, flashIt, doShake)
Boss Warning       (drawBossWarning — 전체화면 오버레이 연출)
Collisions         (ovlp, killEnemy, checkCollisions, hitPlayer)
HUD                (updateHUD(DOM), drawHUDCanvas(Canvas), drawProgressBar)
Overlays           (drawIdle, drawPaused, drawGameOver)
Draw Enemies       (drawEnemies — 적 + 보스 일괄 렌더)
Game Loop          (startGame, update, draw, loop)
```

---

## 주요 상태 및 데이터 흐름

### 전역 상태
| 변수 | 타입 | 역할 |
|---|---|---|
| `STATE` | string | `'IDLE'/'PLAYING'/'PAUSED'/'GAMEOVER'` |
| `score`, `hiScore` | number | 점수, 최고점 (localStorage 연동) |
| `lives`, `wave`, `combo` | number | 목숨, 현재 웨이브, 연속 킬 수 |
| `bombs`, `skillKills` | number | 폭탄 잔여, 스킬 충전용 킬 카운터 |
| `fireballT`, `ghostT` | number | 파이어볼/윙맨 남은 시간(초) |
| `shakeAmt/Dur/X/Y` | number | 화면 흔들림 강도·지속·오프셋 |
| `flashA`, `flashCol` | number/string | 전면 플래시 알파·색상 |
| `bgPhase`, `bgBlend` | number | 배경 단계(0~3), 전환 보간값(0~1) |
| `waveIdx`, `betweenWave` | number/bool | 현재 웨이브 인덱스, 웨이브간 대기 상태 |
| `bossWarnActive`, `bossWave` | bool | 경고 연출 진행 중, 보스 웨이브 여부 |

### 데이터 흐름 (프레임당)
```
loop(ts)
  ├─ update(dt)
  │    ├─ updateBG         → bgScrollY, bgBlend, STARS/BG_OBJS 위치
  │    ├─ updatePlayer     → P.x/y, 자동사격 → pBullets 추가
  │    ├─ updateWaves      → updateBossWarn / waveSquads 업데이트
  │    │    └─ updateSquad → members 위치, shootEnemy → eBullets 추가
  │    ├─ updateBullets    → 위치 갱신, 화면 밖 제거
  │    ├─ updateItems      → pups 위치, 플레이어 충돌 → 효과 적용
  │    ├─ checkCollisions  → pBullets↔적/보스, eBullets↔P, 적↔P
  │    │    └─ killEnemy   → score+, skillKills+, explode(), dropItem()
  │    └─ updateParts      → parts/fxts 위치·수명
  └─ draw()
       ├─ drawBG / drawEnemies / drawBullets / drawItems / drawPlayer / drawParts
       ├─ drawBossWarning  (bossWarnActive 시 전체화면 오버레이)
       ├─ flashA 오버레이
       ├─ drawProgressBar  (우측 수직 진행 바)
       ├─ drawHUDCanvas    (콤보, 스킬준비, 웨이브클리어 배너)
       └─ drawIdle / drawPaused / drawGameOver  (STATE별)
```

---

## 아키텍처 핵심

1. **단일 파일 구조** — HTML+CSS+JS 전부 `game.html` 하나. 빌드·번들러·서버 불필요.
2. **requestAnimationFrame 루프** — `loop(ts)→update(dt)→draw()` 고정 패턴. `dt=min((ts-lastT)/1000, 0.05)` 로 프레임 스파이크 보정.
3. **상태 머신 조기 반환** — `update(dt)` 첫 줄에 `if(STATE!=='PLAYING')return`. 오버레이 렌더는 `draw()` 마지막에 STATE별 분기.
4. **픽셀 아트 렌더러** — `pxDraw(data, pal, ox, oy)`: 2D 숫자 배열 → `fillRect` 타일. `PX=3`이 전체 픽셀 스케일 기준. `cx.imageSmoothingEnabled=false`.
5. **AABB 충돌** — `ovlp(a,b)`: 중심거리 vs 반합 비교. 보스/적에게는 `w*0.55~0.85` 축소 히트박스 적용.
6. **편대 FSM** — 각 `squad` 객체가 `DELAY→ENTER→HOLD→ATTACK` 4단계 상태를 독립 진행. `cbez()` 큐빅 베지어로 ENTER 경로 보간. 전원 사망 시 단계가 강제로 진행되며(`ENTER→HOLD→ATTACK`), `squadDone()`은 ATTACK 단계 도달 후 전원 사망일 때만 `true` — 이른 전멸이 wave 즉시 clear로 이어지지 않는다.
7. **보스 스폰 가드** — `updateWaves()` wave-clear 조건에 `!bossWave && !bossWarnActive` 필수. 없으면 경고 중 편대 전멸 시 다음 웨이브로 조기 진행하는 버그 발생.
8. **파이어볼 관통** — `pierce:true, hset:Set` 조합으로 단일 탄이 동일 적에게 중복 히트하지 않도록 방지.
9. **배경 보간** — `bgBlend(0→1)` 전환 완료 후 `bgPhase` 갱신. 스크롤 속도(`bgScrollSpeed()`)를 `spdMul=spd/30`으로 환산해 STARS/BG_OBJS에 동일 배율 적용.

---

## 사용된 API 또는 외부 의존성

| API | 사용 목적 |
|---|---|
| `HTMLCanvasElement` / `CanvasRenderingContext2D` | 게임 전체 렌더링 (`cx.fillRect`, `cx.fillStyle`, `cx.font`, `cx.fillText`, `cx.createLinearGradient`, `cx.createRadialGradient`, `cx.globalAlpha`, `cx.shadowBlur` 등) |
| `requestAnimationFrame` | 60fps 게임 루프 |
| `performance.now()` | 애니메이션 타임스탬프 (WARNING 펄스, 별 반짝임, 콤보 점멸 등) |
| `localStorage` | 최고 점수 영속 저장 (`LocalMaxScore` 키) |
| `KeyboardEvent` (keydown/keyup) | 플레이어 입력 처리 |
| **외부 라이브러리** | **없음** — 순수 Vanilla JS, CDN 의존 없음 |
