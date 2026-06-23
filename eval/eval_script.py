#!/usr/bin/env python3
"""
LLM-as-Judge 자동 평가 스크립트
각 백업 폴더의 게임 코드를 Claude API(claude-sonnet-4-6)로 평가하여
eval/llm_scores.json 에 저장한다.

사용법:
  python eval/eval_script.py            # LLM 자동 평가 실행
  python eval/eval_script.py --kappa    # 사람 점수 로드 후 Kappa 계산 + 보고서 작성

환경변수:
  ANTHROPIC_API_KEY   Anthropic API 키 (필수, --kappa 불필요)
"""
import anthropic
import os
import sys
import json
import re
from pathlib import Path

BASE_DIR   = Path(__file__).parent.parent        # assign3/
BACKUPS    = BASE_DIR / "backups"
EVAL_DIR   = Path(__file__).parent               # eval/
SCORES_PATH = EVAL_DIR / "llm_scores.json"
REPORT_PATH = EVAL_DIR / "eval_report.md"
RUBRIC_PATH = EVAL_DIR / "rubric.md"
PERSON_PATH = EVAL_DIR / "person_eval.md"

# ── 평가 대상 케이스 ──────────────────────────────────────────────
TEST_CASES = [
    {
        "id": "TC-01", "folder": "001_20260620_170745",
        "desc": "최초 구현 — game.html에 CSS 인라인, JS는 js/ 파일로 분리",
        "change": "초기 게임 구현. CSS가 game.html <style> 태그에 인라인 포함",
        "focus": "game.html 실행 시 게임 정상 시작 / 플레이어·적·웨이브 기본 루프 / 보스 등장·게임오버 / 전역 변수 충돌 없음",
        "files": ["game.html", "js/formations.js", "js/boss.js", "js/hud.js"],
    },
    {
        "id": "TC-02", "folder": "002_20260620_172127",
        "desc": "JS 17개 파일 분리 + style.css 추출 완료",
        "change": "game.html이 56줄 HTML 셸로 축소, CSS 분리됨 (style.css 생성)",
        "focus": "분리 후 TC-01과 동일 기능 유지 (회귀 없음) / game.html에 <style> 인라인 없음 / style.css + js/*.js 정상 로드",
        "files": ["game.html", "style.css", "js/game.js", "js/constants.js"],
    },
    {
        "id": "TC-03", "folder": "003_20260620_173130",
        "desc": "style.css 세부 수정 (2287→2278 bytes)",
        "change": "style.css 미세 정제, 게임 로직 변경 없음",
        "focus": "HUD·키 피드백 UI 레이아웃 정상 표시 / CSS 변경이 게임 동작에 영향 없음 / .key.active 스타일 적용",
        "files": ["style.css", "game.html"],
    },
    {
        "id": "TC-04", "folder": "004_20260620_173609",
        "desc": "formations.js 수정, 조작법 UI 색상 변경",
        "change": "편대 코드 소폭 수정 + 조작법 키 색상 시각 개선",
        "focus": "조작법 색상 구분 확인 / 편대 DELAY→ENTER→HOLD→ATTACK 단계 정상 진행 / makeSquad·updateSquad 동작",
        "files": ["js/formations.js", "js/hud.js"],
    },
    {
        "id": "TC-05", "folder": "005_20260620_174938",
        "desc": "squadDone() ATTACK 단계 한정 + ENTER 전원 사망 시 HOLD 전이 버그 수정",
        "change": "formations.js: ENTER 중 전원 사망 시 HOLD 강제 전환 / squadDone()이 phase==='ATTACK'일 때만 true",
        "focus": "ENTER 전원 사망 → holdT 소진 후 ATTACK / ATTACK 전 wave-clear 미트리거 / 웨이브 freeze 현상 없음",
        "files": ["js/formations.js"],
    },
    {
        "id": "TC-06", "folder": "006_20260622_094525",
        "desc": "보스 티어별 HP·이동속도·발사간격 스케일링 추가",
        "change": "boss.js: tier 1~4별 HP(170→440), speedMul(0.7→1.0), shootMul(1.6→1.0) 정의",
        "focus": "tier1 HP 170·속도×0.7·사격×1.6느림 / tier4 HP 440·원본 / speedMul·shootMul이 이동·사격 로직에 실제 곱해지는가 / 호위 편대(tier2+)",
        "files": ["js/boss.js"],
    },
    {
        "id": "TC-07", "folder": "007_20260622_095416",
        "desc": "보스 특수 공격 3종(CROSS/BURST/VOLLEY) + 페이즈별 이동 패턴 강화",
        "change": "boss.js: bossSpecial(type) 함수 추가, phase 1→CROSS(7s) / phase 2→BURST(5.5s) / phase 3→VOLLEY(4s)",
        "focus": "CROSS(대각선 4방향탄) / BURST(유도탄 3발 부채꼴) / VOLLEY(집중탄 5발) / FX 텍스트 표시 / 페이즈 전환 시 즉시 발동",
        "files": ["js/boss.js"],
    },
    {
        "id": "TC-08", "folder": "008_20260622_100337",
        "desc": "파워업 3종(R 속사·N 관통탄·S 쉴드) + 일시정지 화면 개선 + HUD 타이머",
        "change": "hud.js·player.js·items.js 확장: rapidT/pierceT/shieldT 상태, 일시정지 조작법 카드, HUD 좌측 타이머 스택",
        "focus": "R(FIRE_RATE×0.45·8초·⚡HUD) / N(pierce:true·보라색·10초·▶HUD) / S(녹색 링·피격1회흡수·12초·◈HUD) / 일시정지 화면 / 타이머 표시",
        "files": ["js/hud.js", "js/player.js", "js/items.js", "js/collisions.js"],
    },
    {
        "id": "TC-09", "folder": "009_20260622_100841",
        "desc": "편대 대형 3종(CIRCLE8·DIAMOND6·ZIGZAG6) + 진입 경로 3종(SNEAK_L·SNEAK_R·LOOP) 추가",
        "change": "formations.js 확장: FMTS에 CIRCLE8/DIAMOND6/ZIGZAG6, ENTRY에 SNEAK_L/SNEAK_R/LOOP 추가",
        "focus": "새 대형 좌표 배열 / 새 ENTRY 함수 반환값 / randWave에서 새 패턴 활용 / 화면 밖 배치 방지(maxSp 범위)",
        "files": ["js/formations.js", "js/waves.js"],
    },
    {
        "id": "TC-10", "folder": "010_20260622_101532",
        "desc": "최종 완성 상태 (전체 기능 통합, 009와 JS 동일)",
        "change": "009와 JS 동일. 모든 기능(파워업·편대·보스·티어·특수공격) 통합 완성",
        "focus": "20웨이브 전체 클리어 가능 / 보스 4회 등장·티어별 난이도 / 파워업·편대·특수공격 통합 / localStorage 최고점수 / 게임오버·클리어 전환",
        "files": ["js/game.js", "js/waves.js", "js/boss.js", "js/formations.js"],
    },
]

# ── Rubric 텍스트 (API 프롬프트용) ───────────────────────────────
RUBRIC_M1 = """\
Correctness (1-5):
  5: 버그 없음. 엣지 케이스까지 모두 올바르게 처리
  4: 핵심 동작 정확, 사소한 엣지 케이스 1개 누락
  3: 핵심 동작은 하나, 일부 시나리오에서 오동작
  2: 중요 조건에서 버그 발생, 실사용 어려움
  1: 구현 오류로 게임 크래시 또는 아예 동작 안 함

Completeness (1-5):
  5: 요청 기능 전체 구현, 관련 파일 모두 일관 갱신
  4: 90% 이상 구현, 부가 사항 1~2개 미반영
  3: 핵심 기능 구현, 연관 컴포넌트(HUD·상태·초기화) 일부 누락
  2: 50% 이하 구현, 핵심 동작 자체가 빠져 있음
  1: 요청 오이해 또는 무관한 코드 변경

Visual Design (1-5):
  5: 시각 효과가 픽셀아트 스타일과 완벽 일치, 명확한 플레이어 피드백, HUD 가독성 높음
  4: 핵심 시각 요소 구현, 색상·크기·위치 사소한 불일치 1~2건
  3: 기능 동작하나 시각 피드백 불명확, HUD 부자연스러움
  2: 시각 요소 누락 또는 스타일 크게 불일치
  1: 시각 구현 없음 또는 렌더링 코드와 충돌"""

RUBRIC_M2 = """\
종합 Rubric M2 (1-5):
  5: 완벽 구현. 엣지케이스·컴포넌트 갱신·코드 일관성 모두 충족. 즉시 통합 가능. 게임 정상 클리어
  4: 핵심 기능 올바르게 동작. 경미한 결함 1~2건 (시각 미비, 엣지케이스 1개 누락 등)
  3: 핵심 기능 구현, 일부 요구사항 누락. 동작하나 완전치 않음. UI 명확하지 않음
  2: 구현 버그 또는 요구사항 50% 이하 충족. 정상 동작 불확실
  1: 요청 오이해 또는 구현 완전 실패. 게임 정상 작동 불가"""


# ── 유틸리티 ─────────────────────────────────────────────────────
def read_file(path: Path, max_lines: int = 300) -> str:
    if not path.exists():
        return f"[파일 없음: {path.name}]"
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        if len(lines) > max_lines:
            return "\n".join(lines[:max_lines]) + f"\n... (총 {len(lines)}줄, 앞 {max_lines}줄만 표시)"
        return text
    except Exception as e:
        return f"[읽기 오류: {e}]"


def build_prompt(tc: dict) -> str:
    folder_path = BACKUPS / tc["folder"]
    sections = []
    for fname in tc["files"]:
        content = read_file(folder_path / fname)
        sections.append(f"=== {fname} ===\n{content}")
    code_block = "\n\n".join(sections)

    return f"""\
당신은 Strikers 1945+ 스타일 수직 스크롤 슈팅 게임(Vanilla JS + Canvas API)의 전문 코드 평가자입니다.
게임을 직접 실행할 수 없으므로 코드 정적 분석(로직·구조·패턴 구현 여부)으로 판단합니다.

## 평가 대상
- 케이스: {tc['id']} — {tc['desc']}
- 변경 요약: {tc['change']}
- 핵심 확인 사항: {tc['focus']}

## 평가 기준
{RUBRIC_M1}

{RUBRIC_M2}

## 코드
{code_block}

## 요청
위 코드를 분석하여 아래 JSON만 반환하라 (다른 텍스트 없이):
{{
  "correctness": <1-5 정수>,
  "completeness": <1-5 정수>,
  "visual_design": <1-5 정수>,
  "m2": <1-5 정수>,
  "reasoning": "<100자 이내 한국어 핵심 근거>"
}}"""


def call_llm(client: anthropic.Anthropic, tc: dict) -> dict:
    prompt = build_prompt(tc)
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text.strip()
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        raise ValueError(f"JSON 없음: {raw[:300]}")
    data = json.loads(m.group())
    c  = int(data["correctness"])
    co = int(data["completeness"])
    v  = int(data["visual_design"])
    m2 = int(data["m2"])
    return {
        "id": tc["id"],
        "folder": tc["folder"],
        "correctness":   c,
        "completeness":  co,
        "visual_design": v,
        "m1_avg":        round((c + co + v) / 3, 2),
        "m2":            m2,
        "reasoning":     data.get("reasoning", ""),
    }


# ── LLM 평가 실행 ────────────────────────────────────────────────
def run_llm_eval():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("  PowerShell: $env:ANTHROPIC_API_KEY = 'sk-ant-...'")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    results: list[dict] = []
    done_ids: set[str] = set()
    if SCORES_PATH.exists():
        with open(SCORES_PATH, encoding="utf-8") as f:
            results = json.load(f)
        done_ids = {r["id"] for r in results}
        print(f"기존 결과 {len(results)}건 로드 (이어서 진행)\n")

    for tc in TEST_CASES:
        if tc["id"] in done_ids:
            print(f"  {tc['id']} — 완료, 건너뜀")
            continue
        print(f"  {tc['id']} ({tc['folder']}) 평가 중 ...", end=" ", flush=True)
        try:
            r = call_llm(client, tc)
            results.append(r)
            with open(SCORES_PATH, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"C={r['correctness']} Co={r['completeness']} V={r['visual_design']} M1={r['m1_avg']:.2f} M2={r['m2']}")
        except Exception as e:
            print(f"ERROR — {e}")

    print_table(results)
    print(f"\nLLM 점수 저장: {SCORES_PATH}")


def print_table(results: list[dict]):
    print("\n" + "=" * 76)
    print(f"{'TC':<7} {'폴더':<26} {'Corr':>4} {'Comp':>4} {'Vis':>4} {'M1':>5} {'M2':>4}")
    print("-" * 76)
    for r in sorted(results, key=lambda x: x["id"]):
        print(f"{r['id']:<7} {r['folder']:<26} {r['correctness']:>4} "
              f"{r['completeness']:>4} {r['visual_design']:>4} "
              f"{r['m1_avg']:>5.2f} {r['m2']:>4}")
    print("=" * 76)


# ── 사람 점수 파싱 ────────────────────────────────────────────────
def parse_human_scores() -> list[dict]:
    """person_eval.md 에서 [ ] 채워진 점수를 파싱한다."""
    text = PERSON_PATH.read_text(encoding="utf-8")
    blocks = re.split(r"^## TC-(\d+)", text, flags=re.MULTILINE)
    # blocks: ['header', '01', 'content for TC-01', '02', ...]

    scores = []
    i = 1
    while i + 1 < len(blocks):
        tc_num = blocks[i].strip().zfill(2)
        content = blocks[i + 1]
        i += 2

        def get_score(label: str) -> int | None:
            pattern = rf"\|\s*{re.escape(label)}\s*\|\s*(\d)\s*\|"
            m = re.search(pattern, content)
            return int(m.group(1)) if m else None

        c  = get_score("Correctness")
        co = get_score("Completeness")
        v  = get_score("Visual Design")
        m2 = get_score("**M2 종합**")

        if None in (c, co, v, m2):
            print(f"  TC-{tc_num}: 점수 미입력 — 건너뜀 (c={c} co={co} v={v} m2={m2})")
            continue

        scores.append({
            "id": f"TC-{tc_num}",
            "correctness": c,
            "completeness": co,
            "visual_design": v,
            "m1_avg": round((c + co + v) / 3, 2),
            "m2": m2,
        })
    return scores


# ── Kappa 계산 + 보고서 작성 ─────────────────────────────────────
def run_kappa_and_report():
    from sklearn.metrics import cohen_kappa_score

    if not SCORES_PATH.exists():
        print("ERROR: LLM 점수 없음. 먼저 python eval/eval_script.py 를 실행하세요.")
        sys.exit(1)

    with open(SCORES_PATH, encoding="utf-8") as f:
        llm_list = json.load(f)
    llm_map = {r["id"]: r for r in llm_list}

    print("사람 점수 파싱 중 ...")
    human_list = parse_human_scores()
    if not human_list:
        print("ERROR: person_eval.md 에 입력된 점수가 없습니다.")
        sys.exit(1)
    human_map = {r["id"]: r for r in human_list}

    common_ids = sorted(set(llm_map) & set(human_map))
    if len(common_ids) < 2:
        print(f"ERROR: 공통 케이스 {len(common_ids)}개 — Kappa 계산 불가 (최소 2개)")
        sys.exit(1)

    # M2 기준 Kappa
    h_m2  = [human_map[i]["m2"] for i in common_ids]
    l_m2  = [llm_map[i]["m2"]   for i in common_ids]

    kappa_unweighted = cohen_kappa_score(h_m2, l_m2, weights=None)
    kappa_quadratic  = cohen_kappa_score(h_m2, l_m2, weights="quadratic")

    # M1(Correctness) 기준 Kappa
    h_c = [human_map[i]["correctness"] for i in common_ids]
    l_c = [llm_map[i]["correctness"]   for i in common_ids]
    kappa_c_unw = cohen_kappa_score(h_c, l_c, weights=None)
    kappa_c_qua = cohen_kappa_score(h_c, l_c, weights="quadratic")

    # ── 보고서 작성 ──────────────────────────────────────────────
    lines = build_report(common_ids, human_map, llm_map,
                         kappa_unweighted, kappa_quadratic,
                         kappa_c_unw, kappa_c_qua)
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n보고서 작성 완료: {REPORT_PATH}")

    # 터미널 요약
    print(f"\nKappa (M2, unweighted): {kappa_unweighted:.4f}")
    print(f"Kappa (M2, quadratic):  {kappa_quadratic:.4f}")
    print(f"Kappa (Correctness, unweighted): {kappa_c_unw:.4f}")
    print(f"Kappa (Correctness, quadratic):  {kappa_c_qua:.4f}")


def build_report(ids, human_map, llm_map, k_unw, k_qua, kc_unw, kc_qua) -> list[str]:
    lines = []
    a = lines.append

    a("# Claude Code 출력 평가 보고서")
    a("")
    a("## 1. 평가 목적")
    a("")
    a("본 보고서는 Strikers 1945+ 스타일 종스크롤 슈팅 게임 개발 과정에서 Claude Code가 생성한 코드의 품질을 두 가지 방법으로 평가하고, 사람-기계 평가 일치도를 측정한 결과를 담는다.")
    a("")
    a("- **평가 방법 1 (M1)**: 3차원 다차원 Rubric — Correctness · Completeness · Visual Design 각 1~5점, 평균 산출")
    a("- **평가 방법 2 (M2)**: 종합 Holistic Rubric — 케이스 전체를 1~5점으로 단일 평가")
    a("- **일치도 지표**: Cohen's Kappa (`sklearn.metrics.cohen_kappa_score`), `weights=None` · `weights='quadratic'` 두 가지")
    a("")
    a("---")
    a("")
    a("## 2. 평가 방식 및 선택 이유")
    a("")
    a("### 방식 1 — 다차원 Rubric (M1)")
    a("")
    a("| 차원 | 의미 |")
    a("|---|---|")
    a("| Correctness | 구현이 버그 없이 의도대로 동작하는가 |")
    a("| Completeness | 요구사항 전체를 빠짐없이 구현했는가 |")
    a("| Visual Design | 시각 효과·HUD·애니메이션이 게임 스타일에 맞게 구현되었는가 |")
    a("")
    a("**선택 이유**: 코드 변경이 '동작 정확도', '기능 완성도', '시각 표현'이라는 독립된 측면에 영향을 준다. 차원별 분리 평가로 부분적 성공·실패를 세밀하게 포착할 수 있다.")
    a("")
    a("### 방식 2 — 종합 Rubric (M2)")
    a("")
    a("게임 전체를 하나의 점수로 평가. 1~5점 각각에 명확한 기준을 명시(엣지케이스·UI 가독성·클리어 가능 여부 등)하여 평가자 간 기준 편차를 줄였다.")
    a("")
    a("**선택 이유**: 다차원 평가는 차원 간 가중치 결정이 필요하지만, Holistic Rubric은 전체적 완성도를 직관적으로 표현한다. 두 방식을 함께 사용함으로써 세부 진단과 전체 품질 평가를 모두 수행한다.")
    a("")
    a("---")
    a("")
    a("## 3. 사용 라이브러리")
    a("")
    a("### Anthropic Python SDK (`anthropic`)")
    a("")
    a("```python")
    a("import anthropic")
    a("client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])")
    a("response = client.messages.create(")
    a("    model='claude-sonnet-4-6',")
    a("    max_tokens=512,")
    a("    messages=[{'role': 'user', 'content': prompt}]")
    a(")")
    a("```")
    a("")
    a("각 테스트케이스별 백업 폴더의 핵심 JS 파일을 읽어 rubric과 함께 프롬프트에 포함하고, LLM에 JSON 형식으로 4개 점수(correctness, completeness, visual_design, m2)를 반환하도록 요청했다.")
    a("")
    a("### scikit-learn (`sklearn`)")
    a("")
    a("```python")
    a("from sklearn.metrics import cohen_kappa_score")
    a("kappa_unweighted = cohen_kappa_score(human_scores, llm_scores, weights=None)")
    a("kappa_quadratic  = cohen_kappa_score(human_scores, llm_scores, weights='quadratic')")
    a("```")
    a("")
    a("사람 점수(person_eval.md)와 LLM 점수(llm_scores.json)를 리스트로 변환하여 `cohen_kappa_score`에 전달했다.")
    a("")
    a("---")
    a("")
    a("## 4. 점수 비교표")
    a("")
    a("### 4-1. M1 — Correctness")
    a("")
    a("| TC | 폴더 | 사람 | LLM | 차이 |")
    a("|---|---|---|---|---|")
    for i in ids:
        h = human_map[i]["correctness"]
        l = llm_map[i]["correctness"]
        a(f"| {i} | {llm_map[i]['folder']} | {h} | {l} | {h-l:+d} |")
    a("")
    a("### 4-2. M1 — Completeness")
    a("")
    a("| TC | 폴더 | 사람 | LLM | 차이 |")
    a("|---|---|---|---|---|")
    for i in ids:
        h = human_map[i]["completeness"]
        l = llm_map[i]["completeness"]
        a(f"| {i} | {llm_map[i]['folder']} | {h} | {l} | {h-l:+d} |")
    a("")
    a("### 4-3. M1 — Visual Design")
    a("")
    a("| TC | 폴더 | 사람 | LLM | 차이 |")
    a("|---|---|---|---|---|")
    for i in ids:
        h = human_map[i]["visual_design"]
        l = llm_map[i]["visual_design"]
        a(f"| {i} | {llm_map[i]['folder']} | {h} | {l} | {h-l:+d} |")
    a("")
    a("### 4-4. M1 평균 및 M2 종합 비교")
    a("")
    a("| TC | 폴더 | M1 사람 | M1 LLM | M2 사람 | M2 LLM |")
    a("|---|---|---|---|---|---|")
    for i in ids:
        hm1 = human_map[i]["m1_avg"]
        lm1 = llm_map[i]["m1_avg"]
        hm2 = human_map[i]["m2"]
        lm2 = llm_map[i]["m2"]
        a(f"| {i} | {llm_map[i]['folder']} | {hm1:.2f} | {lm1:.2f} | {hm2} | {lm2} |")
    a("")
    a("---")
    a("")
    a("## 5. Cohen's Kappa 결과")
    a("")
    a("| 기준 | weights | Kappa | 해석 |")
    a("|---|---|---|---|")

    def kappa_label(k):
        if k < 0:       return "우연보다 낮은 일치"
        elif k < 0.20:  return "미미한 일치"
        elif k < 0.40:  return "보통 일치"
        elif k < 0.60:  return "적정 일치"
        elif k < 0.80:  return "상당한 일치"
        else:           return "거의 완전한 일치"

    a(f"| M2 종합 | None (unweighted) | {k_unw:.4f} | {kappa_label(k_unw)} |")
    a(f"| M2 종합 | quadratic | {k_qua:.4f} | {kappa_label(k_qua)} |")
    a(f"| Correctness | None (unweighted) | {kc_unw:.4f} | {kappa_label(kc_unw)} |")
    a(f"| Correctness | quadratic | {kc_qua:.4f} | {kappa_label(kc_qua)} |")
    a("")
    a("---")
    a("")
    a("## 6. weights 유무에 따른 차이 설명")
    a("")
    a("`weights=None` (unweighted Kappa)는 점수 차이의 **크기를 무시**한다. 1점 차이든 4점 차이든 동등하게 '불일치'로 처리한다.")
    a("")
    a("`weights='quadratic'` (가중 Kappa)는 불일치 정도에 **이차 가중치**를 적용한다. 1점 차이는 가볍게, 4점 차이는 16배 무겁게 패널티를 준다. 5점 척도처럼 순서가 있는 데이터에서 '큰 불일치가 드물다'면 unweighted보다 높은 값이 나오는 경향이 있다.")
    a("")
    a(f"본 평가에서는 M2 기준 unweighted={k_unw:.4f}, quadratic={k_qua:.4f}로, "
      + ("quadratic이 더 높게 나왔다. 이는 사람과 LLM의 큰 의견 불일치(3점 이상 차이)가 적다는 의미다."
         if k_qua >= k_unw
         else "quadratic이 더 낮게 나왔다. 이는 일부 케이스에서 사람과 LLM 간에 큰 점수 차이가 존재함을 의미한다."))
    a("")
    a("---")
    a("")
    a("## 7. 사람-기계 일치도 분석")
    a("")
    a(f"전체 {len(ids)}개 케이스에 대해 M2 종합 점수 기준 Cohen's Kappa는 unweighted={k_unw:.4f}, quadratic={k_qua:.4f}이다.")
    a("")
    a("### LLM 평가의 특성")
    a("- LLM(claude-sonnet-4-6)은 코드 **정적 분석** 기반으로 평가했다. 실제 브라우저 실행을 통한 동적 테스트 없이, 코드 로직·함수 구조·패턴 구현 여부만으로 점수를 산출했다.")
    a("- 이로 인해 **Visual Design** 차원에서 LLM은 Canvas 렌더링 코드의 존재 여부만 판단하며, 실제 화면에서의 자연스러움·가독성은 반영되지 않는다.")
    a("- **Correctness** 차원에서 LLM은 명백한 버그(변수 미초기화, 조건 오류 등)는 잘 잡아내지만, 미묘한 타이밍 이슈나 브라우저 특정 버그는 놓칠 수 있다.")
    a("")
    a("### 일치도 해석")
    if k_qua >= 0.6:
        a("Kappa가 0.6 이상으로 **상당한 일치**를 보인다. LLM이 사람과 유사한 기준으로 코드 품질을 평가하고 있음을 시사한다.")
    elif k_qua >= 0.4:
        a("Kappa가 0.4~0.6 범위로 **적정 일치**를 보인다. 전반적인 방향은 일치하나 세부 점수에서 편차가 있다.")
    else:
        a("Kappa가 0.4 미만으로 **일치도가 낮다**. LLM 정적 분석과 사람의 실행 기반 평가 간에 체계적 차이가 존재할 가능성이 높다.")
    a("")
    a("LLM은 코드가 **존재하느냐**에 집중하는 반면, 사람은 **동작의 자연스러움**과 **게임 플레이 경험**까지 반영한다. 특히 시각 디자인과 난이도 체감처럼 주관적 요소가 강한 항목일수록 두 평가자 간 괴리가 커질 것으로 예상된다.")
    a("")
    a("---")
    a("")
    a("## 8. LLM 평가 근거 (reasoning)")
    a("")
    a("| TC | LLM 평가 근거 |")
    a("|---|---|")
    for i in ids:
        reason = llm_map[i].get("reasoning", "—").replace("|", "·")
        a(f"| {i} | {reason} |")
    a("")

    return lines


# ── 진입점 ───────────────────────────────────────────────────────
if __name__ == "__main__":
    if "--kappa" in sys.argv:
        run_kappa_and_report()
    else:
        run_llm_eval()
