# ThinkBin Design Document

**Date**: 2026-02-15
**Status**: Approved

## 1. Overview

ThinkBin은 개선 Backlog 시스템이다. 개발/기획 중 떠오른 구조 개선 아이디어를 즉시 실행하는 대신 안전하게 저장하고, 적절한 시점에 실행하도록 관리한다.

### 핵심 문제
- 작업 중 개선 아이디어로 인한 집중력 분산
- "지금 고칠지 vs 나중에 고칠지" 반복 의사결정 비용
- 개선 능력이 일정 리스크로 전환되는 구조적 문제

### 해결
- 개인 쓰레기통에 빠르게 기록 (Quick Capture)
- 검토 후 팀 쓰레기통으로 승격
- 정기 리뷰에서 실행 항목 선별

## 2. Architecture

```
┌──────────────────────────────────────┐
│       ThinkBin Web App (SPA)         │
│       React + Vite + TypeScript      │
│                                      │
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │ My Bin │ │Team Bin│ │ Review   │ │
│  └───┬────┘ └───┬────┘ └────┬─────┘ │
│      └─────┬────┘───────────┘       │
│            │                         │
│    ┌───────▼────────┐                │
│    │ GitHub Service  │               │
│    │ (Octokit.js)   │                │
│    └───────┬────────┘                │
└────────────┼─────────────────────────┘
             │ GitHub REST API
             ▼
┌──────────────────────────────────────┐
│      GitHub Repository (Data)        │
│  bins/personal/{username}/*.md       │
│  bins/team/*.md                      │
│  config/tags.json                    │
└──────────────────────────────────────┘

Hosting: AWS Amplify (SPA static hosting)
Auth: GitHub OAuth (Lambda for token exchange)
```

### 기술 스택
- **Frontend**: React + Vite + TypeScript
- **GitHub API Client**: Octokit.js
- **Markdown Parsing**: gray-matter (frontmatter) + react-markdown
- **Styling**: TBD (Tailwind CSS 권장)
- **Hosting**: AWS Amplify
- **Auth**: GitHub OAuth + Amplify Lambda

## 3. Data Model

각 항목은 하나의 Markdown 파일. YAML frontmatter로 메타데이터 관리.

### 파일 구조

```
bins/
├── personal/
│   ├── {username}/
│   │   ├── 2026-02-15-상태머신-구조개선.md
│   │   └── 2026-02-14-UI-이벤트-정리.md
│   └── {planner}/
│       └── 2026-02-15-밸런스-테이블-분리.md
└── team/
    ├── 2026-02-10-전투시스템-리팩토링.md
    └── 2026-02-08-데이터-검증-강화.md

config/
└── tags.json
```

### Markdown 파일 포맷

```markdown
---
id: "a1b2c3d4"
title: "상태머신 구조 개선"
priority: "A"              # S | A | B
tags: ["전투시스템", "아키텍처"]
author: "dev-name"
created: "2026-02-15T10:30:00+09:00"
status: "open"             # open | promoted | resolved | dropped
promoted_at: null
---

## 문제 상황
(설명)

## 현재 구조
(설명)

## 개선 아이디어
(설명)

## 영향 범위
(설명)
```

### 우선순위 정의 (bg.txt 기반)

| 등급 | 의미 | 조건 |
|------|------|------|
| S | 즉시 수정 필요 | 기능을 깨뜨림, 심각한 버그 유발, 일정 리스크 |
| A | 다음 사이클 개선 | 구조 개선, 확장성 문제, 반복 작업 증가 |
| B | 아이디어/미래 개선 | 더 나은 구조, 성능 개선 여지, 우아한 설계 |

### tags.json

```json
{
  "tags": [
    { "name": "전투시스템", "color": "#e74c3c" },
    { "name": "UI", "color": "#3498db" },
    { "name": "데이터", "color": "#2ecc71" },
    { "name": "아키텍처", "color": "#9b59b6" },
    { "name": "밸런스", "color": "#f39c12" },
    { "name": "성능", "color": "#1abc9c" }
  ]
}
```

## 4. UI Design

### Layout: 3-Panel (Notion/Obsidian 스타일)

```
┌────────┬───────────────────┬───────────────────┐
│ SIDE   │   LIST PANEL      │  DETAIL PANEL     │
│ BAR    │                   │                   │
│        │  검색, 필터       │  Markdown 렌더링  │
│ 내 Bin │  카드 리스트      │  인라인 편집      │
│ 팀 Bin │                   │  액션 버튼        │
│ 태그   │                   │                   │
│ 통계   │                   │                   │
└────────┴───────────────────┴───────────────────┘
```

### 디자인 원칙
- **Notion**: 클린 타이포그래피, 충분한 여백, 인라인 편집
- **Obsidian**: 사이드바 태그 트리, 다크 모드, Markdown 렌더링/편집 토글
- **Evernote**: 카드 프리뷰, 통합 검색

### 뷰 모드
1. **리스트뷰** (기본): 카드 리스트 + 상세 패널
2. **칸반뷰** (선택): S/A/B 열로 구분, 드래그&드롭 우선순위 변경

### Quick Capture
- 하단 [+] 플로팅 버튼 → 슬라이드업 시트
- 최소 입력: 제목 + 우선순위만으로 즉시 저장
- 상세 필드는 선택사항 (나중에 Detail에서 보완)

### 우선순위 시각화
- S = 빨강 (🔴), A = 노랑 (🟡), B = 파랑 (🔵)

### 모바일 반응형
- 3-Panel → 1-Panel 스택 전환
- 사이드바: 햄버거 메뉴로 토글
- 리스트 → 상세: 탭하면 전환, ← 뒤로가기

## 5. Authentication & API Flow

### GitHub OAuth Flow

```
[SPA] → GitHub OAuth 페이지 → 인증 코드 → [Amplify Lambda] → 토큰 교환 → access_token → [SPA sessionStorage]
```

- Lambda는 토큰 교환 전용 (client_secret 보호)
- 토큰은 sessionStorage에 저장 (탭 닫으면 만료)

### GitHub API Operations

| 동작 | API | 설명 |
|------|-----|------|
| 목록 조회 | `GET /repos/:owner/:repo/contents/:path` | Bin 파일 목록 |
| 파일 읽기 | `GET /repos/:owner/:repo/contents/:path` | 항목 상세 |
| 파일 생성 | `PUT /repos/:owner/:repo/contents/:path` | 새 항목 |
| 파일 수정 | `PUT /repos/:owner/:repo/contents/:path` (sha) | 편집 |
| 승격 | DELETE 원본 + PUT 새 위치 | 개인→팀 이동 |
| 태그 관리 | `PUT /repos/:owner/:repo/contents/config/tags.json` | 설정 |

### 캐싱
- 목록 조회 결과를 메모리에 캐싱
- 변경 작업 시 해당 캐시 무효화

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| 네트워크 실패 | 토스트 알림 + 재시도 버튼 |
| 토큰 만료 | 로그인 화면 리다이렉트 |
| 파일 충돌 | 최신 sha로 재시도, 실패 시 알림 |
| 잘못된 Markdown | raw 텍스트로 폴백 표시 |
| Rate Limit | 남은 할당량 표시 + 대기 안내 |

## 7. Testing Strategy

- **단위 테스트**: Markdown 파싱, frontmatter 변환, 필터/검색 (Vitest)
- **컴포넌트 테스트**: 주요 UI 렌더링 (React Testing Library)
- **E2E**: 핵심 흐름 — 로그인→생성→승격 (Playwright, 필요 시)

## 8. Out of Scope (YAGNI)

- 실시간 동시 편집 (2명 팀, 충돌 확률 극히 낮음)
- 알림/푸시 기능 (주 1회 리뷰로 충분)
- 항목 간 연결/링크
- 검색 인덱싱 (파일 수가 적어 전체 스캔으로 충분)
- 코멘트/스레드
- 히스토리 뷰어 (Git log로 대체)
