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
│   ├── background.js     # 배경 시스템 (지구→외계 7단계)
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
├── backups/              # 수동 백업 (NNN_YYYYMMDD_HHmmss/ 폴더)
├── eval/                 # 평가 시스템
│   ├── eval_script.py    # LLM 자동 평가 + Kappa 계산 + 보고서 작성
│   ├── rubric.md         # 평가 기준 (M1 3차원 + M2 종합 Rubric)
│   ├── person_eval.md    # 사람 평가 점수 입력 양식
│   ├── llm_scores.json   # LLM 자동 평가 결과 (TC-01~10)
│   └── eval_report.md    # 최종 평가 보고서 (--kappa 모드로 생성)
├── report.md             # 과제 보고서
└── .claude/
    ├── settings.json     # 훅 설정 (백업, 알림, 완료 메시지)
    └── commands/         # 커스텀 슬래시 커맨드
        ├── design.md     # /design — 시각 디자인 개선
        ├── logic.md      # /logic  — 게임 로직·밸런스 개선
        ├── uiux.md       # /uiux   — UI/UX 개선
        ├── refactor.md   # /refactor — 코드 구조 개선
        └── eval.md       # /eval   — LLM-as-Judge 평가 + Cohen's Kappa
```

## game.html 아키텍처

`game.html`은 HTML 셸만 담당한다. CSS는 `<link href="style.css">`, JS는 `js/` 디렉토리의 17개 파일로 분리되어 `<script src="">` 순서대로 로드된다. 각 파일은 섹션 주석(`// ── 이름 ──`)으로 시작한다. 위에서 아래로 선언 순서가 의존 순서이기도 하다.

### 게임 상태 머신
`STATE` 변수가 `'IDLE' → 'PLAYING' → 'PAUSED' / 'GAMEOVER'` 로 전환된다.  
`update(dt)` / `draw()` 는 매 프레임 호출되지만 `STATE !== 'PLAYING'` 이면 `update`는 조기 반환한다.

### 배경 시스템
- **페이즈 0~6**: 지구 → 대기권 → 화성 → 천왕성/해왕성 → 명왕성/카이퍼벨트 → 은하 → 외계 행성. `wave` 값으로 `targetBgPhase()` 가 결정.
- `bgBlend(0→1)` 로 두 페이즈 사이를 부드럽게 보간. 완전히 전환된 뒤 `bgPhase` 가 갱신된다.
- `bgScrollSpeed()` 가 웨이브별 스크롤 속도를 반환(20→42→68→100→130→165→200 px/s).
- `STARS`, `BG_OBJS` 모두 동일 배율 적용.
- **BG_OBJS 타입**: `cloud`(지구 구름), `rock`(소행성), `nebula`(성운), `ice`(카이퍼벨트 얼음), `galaxy`(은하 나선), `alien`(외계 생명체 포드).
- 각 페이즈별 고유 행성 그래픽: `drawPixelUranus`, `drawPixelNeptune`, `drawPixelPluto`, `drawPixelIceRock`, `drawGalaxy`, `drawAlienPod`.

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

**대형(FMTS)**: SOLO / TWIN2 / V5 / LINE5 / LINE7 / ARROW7 / BOX9 / **CIRCLE8**(원형) / **DIAMOND6**(다이아몬드) / **ZIGZAG6**(지그재그)

**진입 경로(ENTRY)**: TOP / LEFT / RIGHT / DIVEL / DIVER / SWING / **SNEAK_L**(좌벽 잠입) / **SNEAK_R**(우벽 잠입) / **LOOP**(급강하 후 복귀)

**전원 사망 시 단계 진행**: 멤버가 ENTER 중 전원 사망하면 HOLD로 전환하고 `holdT`를 정상 소진한 뒤 ATTACK으로 넘어간다. HOLD 중 전원 사망하면 `holdT` 남은 시간을 계속 카운트다운한 뒤 ATTACK으로 전환한다. `squadDone(sq)` 는 `phase==='ATTACK'` 이고 전원 사망한 경우에만 `true`를 반환한다 — ENTER/HOLD 단계에서 일찍 전멸해도 wave clear가 즉시 트리거되지 않는다.

비보스 웨이브는 `randWave(n)` 으로 매번 랜덤 생성. 보스 웨이브는 `waveIdx % 5 === 0`.

### 보스 시스템
- `startBossWarning()` → 3.5초 경고 연출 → `spawnBossNow()` 순서로 진행.
- **중요**: `updateWaves()` 의 wave-clear 조건에 `!bossWarnActive` 가 반드시 포함되어야 한다. 없으면 경고 중 편대가 전멸할 때 보스가 스폰되기 전에 다음 웨이브로 넘어가는 버그 발생.
- 보스 HP %에 따라 `phase 1→2→3` 자동 전환, 이동 속도·발사 패턴 에스컬레이션.
- **티어별 스케일링**: HP=`80+tier*90`(tier1→170, tier6→620), 이동속도 배율=`0.6+tier*0.1`, 발사간격 배율=`2.5-tier*0.2`(tier1→2.3배 느림, tier6→1.3배 느림 — 모든 tier에서 기본보다 느린 방향으로 수렴).
- **tier 5/6 혼돈 이동**: `updateBossChaos()` — 1.5~3.2초마다 `track`(플레이어 추격) / `vdrop`(수직 낙하 후 복귀) / `rush`(돌진) / `teleport`(순간이동 + 보라 플래시) / `circle`(원 궤도) / `sweep`(고속 수평) 중 랜덤 전환.

### 총알·충돌
`pBullets`(플레이어), `eBullets`(적) 배열. `ovlp(a,b)` AABB 충돌.  
파이어볼 탄은 `pierce:true`, `hset: Set` 으로 관통 처리(같은 적에게 중복 피해 방지).  
관통탄 아이템(`pierceT>0`) 적용 시에도 동일 관통 플래그(`doPierce=true`)가 설정되며, 보라색(`pcol:true`)으로 표시된다.  
`hitPlayer()` 호출 순서: ① `hasMoved===false`(이스터에그) 시 웨이브 29 워프 후 조기 반환 → ② `shieldT>0` 이면 피격 흡수·`shieldT=0` 초기화 → ③ 실제 피격(`rapidT`/`pierceT` 초기화, 목숨 차감, 무기 SINGLE 복귀).

### 파티클
`parts[]` 배열. 파티클 종류: `spark / debris / smoke / ring`. `explode()` 가 4종류를 함께 생성.

### HUD
- DOM 업데이트: `updateHUD()` — 점수, 생명, 폭탄, 스킬 게이지.
- Canvas 위 오버레이: `drawHUDCanvas()` — 콤보, 스킬 준비, 웨이브 클리어 배너. 화면 좌측 하단에 활성 파워업 타이머(◈ SHIELD / ⚡ RAPID / ▶ PIERCE) 스택 표시.
- 우측 수직 진행 바: `drawProgressBar()` — wave 1~`TOTAL_WAVES`(30) 진행률, 보스 마커(5·10·15·20·25·30) 포함.
- `drawPaused()`: 현재 웨이브·점수 카드 + 전체 조작법(이동/사격/폭탄/스킬/일시정지) + 깜빡이는 재개 안내 표시.

### 주요 상수 (변경 시 밸런스 영향)

| 상수 | 값 | 의미 |
|---|---|---|
| `TOTAL_WAVES` | 30 | 완주 기준 웨이브 수 (진행 바 기준) |
| `SKILL_GOAL` | 20 | 스킬 충전에 필요한 킬 수 |
| `FIREBALL_DUR` | 5 | 파이어볼 지속 시간(초) |
| `GHOST_DUR` | 15 | 윙맨 지속 시간(초) |
| `BOMB_MAX` | 3 | 폭탄 최대 보유 수 |
| `FIRE_RATE` | 0.13 | 기본 연사 간격(초) |
| `RAPID_DUR` | 8 | 속사(R) 아이템 지속 시간(초) — 연사 간격 ×0.45 |
| `PIERCE_DUR` | 10 | 관통탄(N) 아이템 지속 시간(초) |
| `SHIELD_DUR` | 12 | 쉴드(S) 아이템 지속 시간(초) — 피격 1회 흡수 |

## 수동 백업

사용자가 **"백업해"** 라고 요청할 때만 `.claude/backup.ps1` 을 실행한다. 자동 백업(`PostToolUse` 훅)은 비활성화되어 있다.

스크립트는 프로젝트 **폴더 전체**를 `backups/NNN_YYYYMMDD_HHmmss/` 형태로 저장한다.  
`backups/` 폴더 자신은 `Get-ChildItem -Exclude backups` 로 제외하여 재귀 복사를 방지한다.

## 커스텀 슬래시 커맨드

| 커맨드 | 용도 |
|---|---|
| `/design` | 배경·스프라이트·파티클·보스 연출 등 시각 완성도 |
| `/logic` | 적 패턴, 밸런스, 보스 페이즈, 아이템 드롭 |
| `/uiux` | HUD 배치, 화면 전환 흐름, 키 피드백 |
| `/refactor` | 함수 분리, 상수 추출, 한국어 주석 — 동작 변경 없이 구조만 |
| `/eval` | Claude Code 출력 LLM-as-Judge 평가 + 사람 평가 + Cohen's Kappa 측정 |

## 로컬 영구 저장

최고 점수만 `localStorage.setItem('LocalMaxScore', hiScore)` 로 저장된다.

---

## 게임 전체 흐름

총 **30웨이브**, 5웨이브마다 보스 → **보스 6회** 등장. 웨이브 30 보스 처치 시 클리어.

| 웨이브 | 배경 | 스크롤 속도 | 구분 |
|---|---|---|---|
| 1 – 4 | 지구 (Earth) | 20 px/s | 일반 |
| **5** | 대기권 전환 | – | **보스 tier 1** (HP 170) |
| 6 – 9 | 대기권 (Atmosphere) | 42 px/s | 일반 |
| **10** | 화성 전환 | – | **보스 tier 2** (HP 260) |
| 11 – 14 | 화성 (Mars) | 68 px/s | 일반 |
| **15** | 천왕성·해왕성 전환 | – | **보스 tier 3** (HP 350) |
| 16 – 19 | 천왕성·해왕성 | 100 px/s | 일반 |
| **20** | 명왕성·카이퍼벨트 전환 | – | **보스 tier 4** (HP 440) |
| 21 – 24 | 명왕성·카이퍼벨트 | 130 px/s | 일반 |
| **25** | 은하 전환 | – | **보스 tier 5** (HP 530, 혼돈 이동) |
| 26 – 29 | 은하 (Galaxy) | 165 px/s | 일반 |
| **30** | 외계 행성 (Alien) | 200 px/s | **보스 tier 6** (HP 620, 최종·혼돈) |

### 보스 티어별 수치

| tier | 웨이브 | HP | 이동속도 배율 | 발사간격 배율 | 호위 편대 | 처치 점수 | 이동 패턴 |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 170 | ×0.7 | ×2.3 (느림) | 없음 | 1,800 | 일반 |
| 2 | 10 | 260 | ×0.8 | ×2.1 | A-LINE5 (5기) | 2,400 | 일반 |
| 3 | 15 | 350 | ×0.9 | ×1.9 | A-LINE5 + B-TWIN2 | 3,000 | 일반 |
| 4 | 20 | 440 | ×1.0 | ×1.7 | A-LINE5 + B-TWIN2 | 3,600 | 일반 |
| 5 | 25 | 530 | ×1.1 | ×1.5 | A-LINE5 + B-TWIN2 + C-ARROW7 | 4,200 | **혼돈** |
| 6 | 30 | 620 | ×1.2 | ×1.3 | A-LINE5 + B-TWIN2 + C-ARROW7 + C-LINE7 | 4,800 | **혼돈** |

### 보스 내부 페이즈 (HP % 기준, 모든 tier 공통)

| 페이즈 | 조건 | 기본 발사 | 기준 간격 | 이동 | 특수 공격 (`bossSpecial`) |
|---|---|---|---|---|---|
| 1 | HP > 66% | 3방향 고정 | 1.35s × shootMul | 수평 왕복 | **CROSS** — 대각선 4방향탄 (7s 주기) |
| 2 | HP 33–66% | 5방향 + 유도탄 50% | 0.95s × shootMul | 수평 지그재그 (`dodgeT` 0.8–1.8s) | **BURST** — 플레이어 방향 3발 부채꼴 유도탄 (5.5s 주기) |
| 3 | HP < 33% | 7방향 + 유도탄 2발 | 0.65s × shootMul | 수평 + 사인파 상하 | **VOLLEY** — 플레이어 방향 5발 집중탄 (4s 주기) |

**페이즈 전환 시 즉시 `bossSpecial()` 발동** — 체력 임계값 돌파 순간 rage shot.

**미니언 소환**: Phase 2는 A형 2기 / Phase 3는 A형 3기 (tier 3+ Phase 3는 C형 3기).

### 적 종류 (EDEFS)

| 종류 | HP | 점수 | 크기(w×h) | 발사 간격 | 특징 |
|---|---|---|---|---|---|
| **A** | 1 | 100 | 28×30 | 2.4s | 소형 경전투기. 가장 약하고 빠름 |
| **B** | 4 | 300 | 44×38 | 1.8s | 중형 폭격기. 체력이 높아 여러 발 필요 |
| **C** | 2 | 200 | 28×32 | 1.6s | 소형 고급기. A보다 빠른 연사, 보라색 엔진 글로우 |

HP는 편대 생성 시 `def.hp + (waveIdx - 1)` 로 웨이브마다 +1씩 증가(웨이브가 높을수록 더 단단함).

### 일반 웨이브 랜덤 생성 (`randWave(n)`)

비보스 웨이브는 매번 `randWave(n)`이 티어 기반으로 무작위 편대를 생성한다. 플레이마다 다른 패턴이 등장한다.

| 티어 | 웨이브 | 편대 수 | 적 종류 풀 |
|---|---|---|---|
| 1 | 1–4 | 1–2 | A 위주 (A×4, B×1) |
| 2 | 6–9 | 1–3 | A/B 동등 + C |
| 3 | 11–14 | 2–3 | B/C 비율 증가 |
| 4 | 16–19 | 2–4 | B/C 위주 |
| 5 | 21–24 | 3–4 | C 위주 (B×1, C×4) |
| 6 | 26–29 | 3–5 | C 전용 |

각 편대의 대형(FMTS)·진입 경로(ENTRY)·피벗 X·목표 Y는 모두 랜덤. 대형 최대 너비(`maxSp`)를 고려해 피벗 X 범위를 제한하여 화면 밖 배치를 방지한다.

---

## 구현된 기능 목록

| 카테고리 | 기능 |
|---|---|
| **이동·사격** | 화살표/WASD 이동, 자동 연사(FIRE_RATE=0.13s), 5단계 무기 업그레이드 |
| **특수 능력** | 폭탄(Z, 전체 적 제거·보스 25% 데미지), 스킬(X, 킬 20회 충전 후 파이어볼 전환) |
| **무기 시스템** | SINGLE → DOUBLE → TRIPLE → SPREAD → FIREBALL (5종), 피격 시 SINGLE 복귀 |
| **윙맨** | 아이템 획득 시 15초간 좌우 고스트 전투기 동행. F 아이템: 황금 halo 타원링 + 6개 회전 반짝임. HUD 아이콘 `◎`. 드롭 빈도: 5웨이브 그룹(`Math.ceil(wave/5)`)당 최대 1회(그룹 1–3, wave≤15) / 2회(그룹 4–6, wave≥16) |
| **적 편대** | A/B/C 3종 적, `randWave(n)` 랜덤 생성(FMTS 10종·ENTRY 9종 조합), 큐빅 베지어 진입 경로 |
| **보스** | 5웨이브마다 등장(총 6회), HP%에 따른 phase 1→2→3 자동 전환, 미니언 소환(phase 2+), CROSS/BURST/VOLLEY 특수 공격 |
| **보스 혼돈 이동** | tier 5/6: 1.5~3.2초마다 track/vdrop/rush/teleport/circle/sweep 랜덤 전환, 순간이동 시 보라 플래시 |
| **보스 경고 연출** | 3.5초 전체 화면 빨간 플래시 + WARNING 텍스트 + 카운트다운 |
| **아이템 드롭** | P(파워업), B(폭탄), F(윙맨), L(목숨), R(속사), N(관통탄), S(쉴드) 7종 랜덤 드롭. F는 `fDropGroup`/`fDropCount`로 그룹당 드롭 횟수 제한 |
| **파워업 아이템** | R: 8초 연사속도 ×2.2 / N: 10초 관통탄(보라색) / S: 12초 쉴드 1회 피격 흡수 |
| **배경** | 7단계 스크롤 배경 (지구→대기권→화성→천왕성/해왕성→명왕성/카이퍼→은하→외계), 웨이브별 스크롤 속도 차등 |
| **파티클** | spark/debris/smoke/ring 4종 폭발 이펙트, 피격 스파크, 플로팅 텍스트 |
| **HUD** | 점수/최고점/웨이브(DOM), 콤보/스킬준비/진행바/보스HP/파워업타이머(Canvas) |
| **진행 바** | 우측 4px 수직 바, 보스웨이브 빨간 마커, 완주 시 점멸 강조 |
| **화면 전환** | IDLE → PLAYING → PAUSED / GAMEOVER, 각 전용 오버레이 |
| **일시정지 화면** | 현재 웨이브·점수 카드 + 전체 조작법 안내 + 재개 안내 표시 |
| **키 피드백** | 누른 키 실시간 하이라이트 (HTML .key.active CSS) |
| **점수 저장** | localStorage 최고 점수 영속 저장 |
| **이스터에그** | 게임 시작 후 첫 피격까지 이동키(WASD/화살표) 미입력 → 웨이브 29 즉시 워프 (피격 페널티 없음). `hasMoved` 플래그로 감지, `MOVE_KEYS` Set으로 대상 키 정의 |

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
Wave Definitions   (randWave(n), launchWave, updateWaves)
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
| `rapidT`, `pierceT`, `shieldT` | number | 속사/관통탄/쉴드 파워업 남은 시간(초) |
| `hasMoved` | bool | 이스터에그: 게임 시작 후 이동키(WASD/화살표) 입력 여부. `false`인 상태로 첫 피격 시 웨이브 29 워프 |
| `fDropGroup`, `fDropCount` | number | F 아이템 그룹별 드롭 횟수 추적. `Math.ceil(wave/5)` 단위로 그룹 구분, 그룹 변경 시 `fDropCount=0` 리셋 |

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

1. **빌드 없는 구조** — `game.html`(HTML 셸) + `style.css` + `js/` 17개 파일. 서버·번들러·패키지 설치 불필요. `file://`로 직접 열면 즉시 실행.
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
