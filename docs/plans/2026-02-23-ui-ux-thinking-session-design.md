# ThinkBin UI/UX 리빌드 + 생각하기 세션 디자인

**날짜**: 2026-02-23
**접근 방식**: B - shadcn/ui 프레임워크 도입 후 UI 리빌드

## 목표

1. shadcn/ui 도입으로 일관된 디자인 시스템 구축
2. UI/UX 전반 개선 (리스트 미리보기, 디테일 가독성, 레이아웃)
3. "생각하기" 세션 기능 추가 (타이머 + 메모 + 상태변경)
4. 확장 가능한 설정 시스템 도입

## 1. 기술 스택

### UI 프레임워크: shadcn/ui

- Radix UI 기반 접근성 우수 컴포넌트
- Tailwind CSS 호환 (기존 스택 유지)
- 커스터마이징 자유로운 복사-붙여넣기 방식
- 필요 컴포넌트: Button, Dialog, Sheet, Tabs, Tooltip, Select, Progress, Badge, ResizablePanel

### 설정 시스템

```typescript
interface Settings {
  thinkingMode: 'fullscreen' | 'overlay' | 'split'
  defaultTimer: number  // 분 단위, 기본 30, 최대 60
  theme: 'dark' | 'light' | 'system'
  listDensity: 'compact' | 'comfortable'
}
```

- localStorage에 영속 저장
- SettingsContext + SettingsProvider로 관리
- 설정 UI: 사이드바 하단 기어 아이콘 → Sheet 패널

## 2. UI/UX 레이아웃 리빌드

### 리스트 카드 개선

기존: 제목 + 우선순위 + 날짜만 표시
개선:
- 본문 첫 줄 미리보기 (1줄 truncate)
- 태그 칩 표시
- "생각 N회" 배지
- compact/comfortable 모드 전환 가능 (설정)

### 디테일 패널 개선

- tailwind typography prose 스타일로 마크다운 가독성 향상
- 상단 메타정보 카드 (우선순위, 태그, 생성일, 상태)
- "생각하기" 버튼 추가
- 하단 액션 바를 shadcn Button으로 교체

### 전체 레이아웃

- 기존 3패널 구조 유지, shadcn ResizablePanel로 리빌드
- 사이드바 드래그 리사이즈 가능
- 모바일: 사이드바 → Sheet, 디테일 → 풀스크린 모달

## 3. 생각하기 세션 기능

### 진입 플로우

1. 아이템 선택 → 디테일 패널에서 "생각하기" 버튼 클릭
2. 타이머 설정 다이얼로그: 프리셋 15/30/45/60분 + 커스텀 입력
3. "시작" 클릭 → 설정된 UI 모드로 세션 진입

### 세션 중 UI 공통 요소

- **타이머 바**: 상단 고정, 프로그레스 바 + 남은 시간, 색상 변화 (녹→노→빨)
- **원본 내용 영역**: 읽기 전용
- **메모 입력 영역**: 마크다운 지원 텍스트에어리어
- **액션 바**: 승격/해결/폐기 + 저장+종료

### 3가지 UI 모드 (설정에서 선택)

- **풀스크린**: 전체 화면 차지, 방해 요소 0
- **오버레이**: 디테일 패널 위치에 오버레이, 사이드바/리스트 유지
- **스플릿**: 좌우 분할, 왼쪽 원본 + 오른쪽 메모

### 타이머 동작

- 1초 단위 카운트다운
- 만료 시: 자동 메모 저장 → 세션 종료 → 토스트 알림
- 수동 종료: "저장+종료" 또는 "종료" 버튼
- 상태변경 시에도 메모 저장 후 세션 종료
- 종료 후 원하면 다시 생각하기 가능

### 메모 저장 방식

아이템 본문 마크다운에 `## 생각 노트` 섹션으로 추가:

```markdown
## 생각 노트
### 2026-02-23 14:30 (32분)
- 메모 내용

### 2026-02-23 10:15 (15분)
- 이전 메모 내용
```

- 타임스탬프 + 소요시간 자동 기록
- 최신 세션이 위에 쌓임 (역순)

## 4. 컴포넌트 아키텍처

```
src/
├── components/
│   ├── ui/                    ← shadcn/ui (순수 UI)
│   ├── layout/                ← 레이아웃 (배치만)
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── list-panel.tsx
│   │   └── detail-panel.tsx
│   ├── thinking/              ← 생각하기 세션
│   │   ├── thinking-session.tsx
│   │   ├── timer-bar.tsx
│   │   ├── timer-dialog.tsx
│   │   ├── thinking-memo.tsx
│   │   ├── mode-fullscreen.tsx
│   │   ├── mode-overlay.tsx
│   │   └── mode-split.tsx
│   ├── settings/
│   │   └── settings-sheet.tsx
│   ├── item-card.tsx
│   ├── quick-capture.tsx
│   ├── kanban-view.tsx
│   └── login-page.tsx
├── contexts/
│   ├── auth-context.tsx       ← 기존 유지
│   ├── bin-context.tsx        ← 기존 유지
│   ├── settings-context.tsx   ← 신규
│   └── thinking-context.tsx   ← 신규
├── hooks/
│   ├── use-bin-items.ts       ← 기존 유지
│   ├── use-timer.ts           ← 신규
│   └── use-thinking-session.ts ← 신규
├── lib/
│   ├── github.ts              ← 기존 유지
│   ├── markdown.ts            ← 확장 (생각노트 파싱)
│   ├── cn.ts                  ← 신규 (shadcn 유틸)
│   └── ...기존 유지
```

### 설계 원칙

1. **UI 컴포넌트는 상태를 모름** - `ui/`는 순수 표현 컴포넌트
2. **레이아웃은 배치만** - `layout/`은 위치 결정만
3. **비즈니스 로직은 hooks/contexts** - 상태/API는 훅에서
4. **모드별 레이아웃 분리** - 생각하기 3가지 모드 별도 컴포넌트
5. **디자인 토큰 중앙 관리** - tailwind 설정에서 색상/간격 관리
