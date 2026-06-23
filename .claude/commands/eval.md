---
description: 클로드 코드 결과물을 평가하고 Cohen's Kappa로 사람-기계 일치도를 측정한다
---

현재 프로젝트의 Claude Code 출력 결과물을 평가하고 보고서를 작성해줘.

## 평가 목적
Claude Code로 만든 프로젝트를 대상으로 출력 품질을 1) 기계(LLM-as-Judge) 2) 사람 두 번 평가하고, 둘의 일치도를 Cohen's Kappa로 측정한다.

## 평가 방식 추천 및 선택
평가는 다음의 2가지 방식을 따른다. 자세한 평가 rubric 기준은 "C:\Users\eaee2\dev\assign_genAI\assign3\eval_report.md" 문서 내용을 반영하라.
- **방식 1**: Helpfulness, Correctness, Completeness 등 몇 가지 기준을 만들어 1~5점
- **방식 2**: Rubric을 만들어 1점~5점 각각의 기준을 명시하고 평가

## 평가 진행 순서
1. 평가 방식 2가지를 확정해라 (사용자 확인 후 진행)
2. 평가 대상 케이스 목록을 확인해라. 테스트케이스는 "C:\Users\eaee2\dev\assign_genAI\assign3\backups"의 각 폴더이다. 폴더명 오름차순으로 tc-1, tc-2... 등이 부여된다.
3. 기계평가는 Claude Code로 동일 케이스를 자동 평가해라
   - testcase(backups/) 실행은 각 테스트케이스별 폴더의 game.html로 구현된 게임을 실행하면서 rubric 평가에 따라 점수를 산출해야한다.
4. 사람 점수와 LLM 점수의 inter agreement score 를 kappa로 확인하라.
   - `sklearn`의 `cohen_kappa_score`로 일치도를 측정해라
   - `weights=None`과 `weights='quadratic'` 두 가지 모두 계산해라
   - 두 결과의 차이와 의미를 설명해라
5. 평가 결과를 점수 비교표로 출력해라
6. 아래 보고서 작성 지침에 따라 보고서를 작성해라

## 보고서 작성 지침
- 보고서는 "C:\Users\eaee2\dev\assign_genAI\assign3\eval_report.md" 에 작성하라
- 선택한 평가 방식 2가지와 선택 이유
- 사람 점수 vs 기계 점수 비교표
  - 사람 점수는 "C:\Users\eaee2\dev\assign_genAI\assign3\eval\person_eval.md"를 참고하라
- Cohen's Kappa 값 (`weights=None` / `weights='quadratic'` 각각)
- `weights='quadratic'` 유무에 따른 차이 설명
- 사람-기계 일치도에 대한 본인 생각 및 분석
- 어떤 라이브러리를 어떻게 사용하였는지에 대한 내용이 있어야 한다.

## 주의사항
- 임의로 판단하기 어려운 부분이 있으면 즉시 멈추고 질문해라. 답변 후 다시 진행해라.

## 입력값
$ARGUMENTS