# show-gy-frontend 발표 자료

> 캡스톤 발표용 프론트엔드 개요 — 페이지 구조 · 에디터 · API · 가치 제안

---

## 1. 한눈에 보는 프론트엔드

**show-gy-frontend**는 React 18 + Quill 2.x 기반 **문서 작성/AI 협업 SPA** 입니다.

- **역할**: 사용자 UI · Quill 리치 에디터 · 챗봇 대화 · 팀장 스타일 자동 적용 · PDF 내보내기
- **포지셔닝**: 백엔드(JWT 쿠키 인증)와 통신하는 SPA — `withCredentials=true`로 모든 요청에 쿠키 자동 부착, axios 인터셉터로 401 → refresh → retry 자동화
- **빌드 산출물**: `docs/` 디렉토리 → nginx로 정적 서빙 (Docker 멀티스테이지)

```
[Browser]
  ├── React 18 (Vite HMR) + React Router 7
  ├── Quill 2.x (Delta 포맷, 커스텀 blot)
  ├── KaTeX (수식) + mermaid (다이어그램) + marked (Markdown)
  ├── html2pdf.js (PDF 내보내기)
  └── axios (withCredentials, 401 자동 refresh)
        │
        ▼
[show-gy-backend (FastAPI)] ──사설망──► [show-gy-AI]
```

---

## 2. 기술 스택

| 영역 | 사용 기술 | 선택 이유 |
|---|---|---|
| 빌드 | **Vite 5** + React 18 + TypeScript 5.6 | HMR + ESM, 빠른 dev 서버 |
| 라우팅 | **react-router-dom 7** | ProtectedRoute 패턴 |
| 에디터 | **Quill 2.x** + Delta | 협업 친화 포맷 + Custom Blot (sg-math-block, mention) |
| 수식 | **KaTeX 0.16** | 빠른 렌더링 |
| 다이어그램 | **mermaid 11** | SVG 변환 후 Quill에 삽입 |
| Markdown | **marked 17** + **quilljs-markdown** | / 슬래시 명령 + MD 입력 변환 |
| 표 | **quill-table-better** | Quill 호환 표 모듈 |
| PDF | **html2pdf.js** + **quill-to-pdf** | 한글 폰트 임베드 |
| 이미지 리사이즈 | `@mgreminger/quill-image-resize-module` | 에디터 내 드래그 리사이즈 |
| 멘션 | `quill-mention` | `@@팀장` 트리거 |
| HTTP | **axios 1.13** (withCredentials, 401 refresh queue) | 쿠키 인증 + 동시요청 deadlock 방지 |
| 레이아웃 | `react-resizable-panels` | 에디터/패널 분할 |
| 반응형 | `react-responsive` + `hamburger-react` | 모바일 메뉴 |

---

## 3. 디렉토리 구조

```
show-gy-frontend/
├── index.html  vite.config.ts  package.json
├── src/
│   ├── main.tsx                  # 엔트리 (HashRouter)
│   ├── App.tsx                   # 라우트 정의 + syncAuthFromMe (로그인 상태 동기화)
│   ├── apis/                     # axios 기반 API 모듈
│   │   ├── client.ts             # 인터셉터 (401 refresh, 403 forceLogout)
│   │   ├── authApi.ts            # 로그인/회원가입/이메일 인증
│   │   ├── userApi.ts            # /user/me, 프로필 수정
│   │   ├── documentApi.ts        # 업로드/조회/저장/휴지통/평가/팀장스타일
│   │   ├── chatbotApi.ts         # 챗봇 호출/세션/히스토리/금칙어
│   │   ├── chatbot_types.ts      # 챗봇 DTO 타입
│   │   ├── cooperation.ts        # 팀 협업 API
│   │   ├── profileImageApi.ts    # 프로필 이미지 업로드
│   │   ├── teamRuleApi.ts        # 팀 규칙(금칙어/스타일) API
│   │   └── types.ts              # 공용 응답 타입
│   ├── pages/                    # 라우트 컴포넌트
│   │   ├── Home.tsx              # /
│   │   ├── Login.tsx             # /login
│   │   ├── Summary.tsx           # /summary (업로드/요약 진입)
│   │   ├── Library.tsx           # /library (Alldocument/Recent/Trash)
│   │   ├── Showgy.tsx            # /showgy (브랜드 페이지)
│   │   ├── TeamRulePreview.tsx   # /preview/team-rule
│   │   └── Mypage/               # /mypage (Profile + Team 섹션)
│   ├── login/Signup.tsx          # 회원가입 플로우
│   ├── summary/                  # ★ 에디터 핵심
│   │   ├── Center.tsx            # 1637줄. 에디터 + 3탭 패널 (chat/feedback/reference)
│   │   ├── setupQuill.ts         # Quill 폰트/포맷/blot 등록
│   │   ├── fonts.ts              # 폰트 키 ↔ 한글명 매핑
│   │   ├── mathBlot.ts           # KaTeX 수식 커스텀 blot
│   │   ├── slashItems.ts         # / 슬래시 명령 메뉴
│   │   ├── runSlashCommand.ts    # 슬래시 명령 실행
│   │   ├── hooks/useQuillInit.ts # Quill 초기화 훅
│   │   ├── table/                # 표 삽입/편집 헬퍼
│   │   └── utils/{markdown,pdf}.ts # MD→HTML, exportPdf
│   ├── library/                  # Alldocument/Recent/Trash 탭
│   ├── helper/                   # 에디터 우측 패널
│   │   ├── Feedback.tsx          # 부정문 사유 카드 리스트
│   │   ├── Search.tsx            # 검색 참고자료 URL 카드
│   │   └── chatbot/
│   │       ├── Chatbot.tsx       # 챗봇 대화 UI + 세션 복원
│   │       ├── chatbot.parsers.ts # 응답 파싱 + extractShortSessionId
│   │       ├── chatbot.types.ts
│   │       ├── chatbot.constants.ts
│   │       ├── hooks/useAutoScroll.ts
│   │       └── parts/            # ChatInputBar/ChatMessages/ChatNegatives/ChatSelections
│   ├── components/               # 공용 (Header/Sidebar/Layout/Tail/ProtectedRoute/Team_make/Team_join/TeamRule_modal)
│   ├── styles/  assets/  types/
│   └── declarations.d.ts
└── docs/                         # 빌드 산출물 (nginx 서빙)
```

---

## 4. 페이지 구조 (라우트)

| 경로 | 컴포넌트 | 설명 | 보호 |
|---|---|---|---|
| `/` | Home | 랜딩 페이지 | - |
| `/login` | Login | 로그인 | - |
| `/login/signup` | Signup | 회원가입 (이메일 인증 → 정보 입력) | - |
| `/preview/team-rule` | TeamRulePreview | 팀 규칙 미리보기 | - |
| `/summary` | Summary | 파일 업로드 + 팀 선택 + 요약 진입 | ✅ |
| `/summary/center` | Center | 빈 에디터 진입 | ✅ |
| `/summary/center/:documentId` | **Center** | **메인 워크스페이스 (에디터 + 챗봇 + 패널)** | ✅ |
| `/library` | Library | 문서 라이브러리 (Alldocument/Recent/Trash 탭) | ✅ |
| `/mypage` | Mypage | 프로필 + 팀 관리 | ✅ |
| `/showgy` | Showgy | 브랜드 페이지 | - |

`ProtectedRoute`: `localStorage.user` 없으면 `/login` 리다이렉트. `App.tsx`에서 라우트 변경 시 `syncAuthFromMe` (/user/me) 호출로 서버 측 세션 검증.

---

## 5. 핵심 컴포넌트

### 5-1. `summary/Center.tsx` (1637줄) — 메인 워크스페이스
- **좌측**: Quill 에디터 (toolbar + 한글 17 폰트 + 마진 슬라이더)
- **우측**: 3개 탭 패널 — **항상 mount**, `display:none` 토글 → 탭 전환 시 대화/스크롤 유지
  - **chat** (`Chatbot.tsx`) — 챗봇 대화
  - **feedback** (`Feedback.tsx`) — 부정문 사유 카드
  - **reference** (`Search.tsx`) — 검색 참고자료 카드
- **자동 저장**: 5초 debounce → `saveDocumentContent(delta_document, title)`
- **팀장 스타일 자동 적용**:
  - `getLeaderStyle(documentId)` 응답의 margins/fontFamily/pageSize → Quill `formatText` + 마진 슬라이더 즉시 반영
  - 사용자가 명시적으로 override하면 그 값 유지
- **편집 복사본**: `editDocument` (start-editing) — 같은 원본을 동시 편집 회피
- **PDF 내보내기**: `exportPdf(quill, margins, fontSize, fontFamilyKey)` — html2pdf.js로 한글 폰트 임베드

### 5-2. `helper/chatbot/Chatbot.tsx` — 챗봇 UI
- 세션 목록(`getChatSessions`) + 대화 내역(`getChatHistory`) Redis 복원
- 응답 `response_type`별 분기:
  - `selection_main_topic` → 주제 라디오 선택 카드
  - `negative_selection` → Feedback 패널로 자동 전환
  - `edit_document` → Quill에 surgical edit 적용 (`deleteText` + `insertText`)
  - `apply_leader_style` → 문장 단위 일괄 교체
  - `exception` → 정중한 거절 메시지
- `extractShortSessionId` — thread_id(`u:...|d:...|s:...`)에서 단축 ID 추출

### 5-3. `helper/Feedback.tsx`
부정문 감지 응답의 `negative_sentence_list`를 사유/원문/제안 3단 카드로 표시 → 클릭 시 에디터에서 해당 문장 하이라이트.

### 5-4. `summary/setupQuill.ts` — Quill 초기화
- **폰트 17종 등록**: 한글 12 (여기어때잘난체/온글잎박다현/케리스 등) + 시스템 3 + 영문 2
- **사이즈 화이트리스트**: small/large/huge
- **모듈 등록**: imageResize, mention(`@@팀장` 트리거), SgMathBlockBlot (KaTeX)

### 5-5. `summary/mathBlot.ts`
KaTeX 수식 블록 커스텀 blot — Delta에 `{insert: {'sg-math-block': latex}}`로 저장되고 렌더 시 KaTeX SVG로 변환.

---

## 6. Quill 편집 기능

| 기능 | 구현 |
|---|---|
| **Surgical 편집** | AI가 `removed_sentences[]`+`edited_sentences[]` 반환 → 각각 `quill.deleteText` / `deleteText+insertText`로 정밀 반영 |
| **팀장 스타일 적용** | `format_hints.font` → `quill.formatText` 즉시 적용 (전체 본문) |
| **마진 자동화** | `getLeaderStyle.margins`를 슬라이더 초기값으로, 사용자 변경 시 override |
| **/슬래시 명령** | `slashItems.ts` 정의 + `runSlashCommand.ts` 실행 (제목, 표, 수식, mermaid 등) |
| **표 삽입** | `quill-table-better` + 자체 `tableAttach`/`parseTableSyntax` |
| **수식** | KaTeX (`mathBlot`) + AI `/evaluator/ocr-math` (수식 이미지 → LaTeX) |
| **다이어그램** | mermaid 텍스트 → SVG → 이미지로 Delta에 삽입 |
| **마크다운 입력** | `quilljs-markdown` — 입력 중 자동 변환 |
| **이미지 리사이즈** | 드래그 핸들 |
| **5초 debounce 자동 저장** | Delta+title 동시 저장 |
| **PDF 내보내기** | html2pdf.js로 한글 폰트 임베드 |

---

## 7. API 통신 설계

### 7-1. `apis/client.ts` — axios 인스턴스
- `baseURL`: `VITE_BACKEND_URL` (로컬: `http://localhost:7001` / Docker: `""` nginx 프록시)
- `withCredentials: true` — 모든 요청에 JWT 쿠키 자동 부착
- `timeout: 300000ms` — 챗봇 LLM 다단계 처리 보장
- **401 자동 refresh**:
  - 동시 요청은 `failedQueue`로 큐잉 → refresh 1회만 호출, 성공 시 모든 대기 요청 retry
  - refresh 자체가 401이면 deadlock 방지 차원에서 `isRefreshCall` 스킵 → forceLogout
- **403**: 권한 없음 → forceLogout
- **네트워크 끊김**: 1회만 forceLogout 처리 (`_logoutHandled` 플래그)
- `getErrorMessage(error)` — 백엔드 통합 포맷 `{error_code, message, path}` 우선, `detail` fallback

### 7-2. API 호출 함수 (주요)
| 함수 | 엔드포인트 | 용도 |
|---|---|---|
| `syncAuthFromMe` | `GET /user/me` | 라우트 변경 시 세션 검증 |
| `login` / `logout` | `POST /auth/login` / `/auth/logout` | 인증 |
| `uploadDocument` | `POST /document/upload` | 파일 업로드 |
| `summarizeDocuments` | `POST /document/summarize` | 멀티 파일+질의 요약 (timeout 120s) |
| `getDocuments` / `getRecentDocuments` / `getDeletedDocuments` | `/document/*` | 라이브러리 목록 |
| `getDocumentById` | `GET /document/{id}` | **모듈 캐시 (staleMs)** — 뒤로가기 시 네트워크 0번 |
| `saveDocumentContent` | `PATCH /document/{id}/content` | Delta 저장 + 캐시 무효화 |
| `moveToTrash` / `restoreDocument` / `deleteDocument` | `/document/{id}/trash`, `/restore`, `/trash` | 휴지통 |
| `editDocument` | `PATCH /document/{id}/start-editing` | 편집 복사본 생성 |
| `releaseEditing` | `PATCH /document/{id}/status` | 편집 종료 |
| `getLeaderStyle` | `GET /document/{id}/leader-style` | **팀장 누적 스타일 자동 로드** |
| `getApprovedDocuments` | `GET /document/{id}/approved-list` | 레퍼런스 선택 |
| `evaluateDocument` | `POST /document/{id}/evaluate` | 평가 실행 |
| `postChatbotCall` | `POST /chatbot/call/chatbot/{id}` | 챗봇 메시지 전송 |
| `getChatSessions` / `getChatHistory` | `/chatbot/sessions/{id}`, `/chatbot/history/{id}` | 세션/대화 복원 |
| `createBlockChat` / `patchBlockChat` / `insertBanWord` | `/ban/*` | 금칙어 관리 |

### 7-3. 클라이언트 캐시
- `documentCache: Map<id, {data, ts}>` — 모듈 스코프
- mutation(`saveDocumentContent`, `moveToTrash`, ...) 직후 `invalidateDocumentCache` 호출
- `getDocumentById({staleMs})`로 명시적 신선도 제어

---

## 8. 보안/세션 UX

| 케이스 | 처리 |
|---|---|
| 페이지 진입 | `syncAuthFromMe()` → `/user/me` 200이면 `localStorage.user` 갱신, 401이면 `forceLogout` |
| 401 발생 | 인터셉터가 `/auth/refresh` → 성공 시 원요청 retry, 실패 시 forceLogout |
| 동시 401 | `failedQueue` 큐잉으로 refresh 1회만 호출 |
| 403 발생 | 즉시 forceLogout |
| 로그인 페이지에서 401 | redirect 루프 방지 (`hash.startsWith('#/login')`) |
| Refresh deadlock | refresh 요청 자체가 401이면 인터셉터 스킵 |
| XSS | JWT는 HttpOnly 쿠키 → JS 접근 불가 |

---

## 9. 환경 변수
```ini
VITE_BACKEND_URL    # 로컬: http://localhost:7001 / Docker: "" (nginx 프록시)
```

---

## 10. 빌드 / 배포

### 개발
```bash
npm run dev          # Vite HMR
```

### 프로덕션 빌드
```bash
npm run build        # tsc -noEmit && vite build → docs/
```

### Docker (멀티스테이지)
```dockerfile
FROM node:20-alpine AS builder
RUN npx vite build       # → docs/
FROM nginx:alpine
COPY docs/ → nginx.conf 주입 (백엔드 프록시)
```

---

## 11. UX 설계 디테일

| 디테일 | 구현 |
|---|---|
| **탭 전환 시 대화 유지** | 3개 패널 항상 mount, display 토글 |
| **chat → feedback 복귀 시 스크롤 복구** | `requestAnimationFrame`로 마지막 scrollTop 복원 |
| **응답 끊김 방지** | 백엔드/AI가 실패해도 200 + error 포맷 → 토스트만 띄우고 채팅 유지 |
| **뒤로가기 즉시 표시** | `documentCache` 모듈 캐시로 네트워크 0번 |
| **자동 저장** | 5초 debounce → 사용자가 인지하지 못해도 안전 |
| **팀장 스타일 자동 적용** | 진입 즉시 `getLeaderStyle` → 사용자가 따로 설정할 필요 없음 |
| **편집 복사본 생성** | start-editing이 매번 복사본 생성 — 동시 편집 회피 (캡스톤 트레이드오프, 의도된 설계) |
| **세션 ID 단축 표시** | `extractShortSessionId(u:...|d:...|s:...)` → UI에는 짧게 표기 |

---

## 12. 프론트엔드의 발표 포인트 (가치 제안)

1. **Quill Delta 중심 설계** — AI가 반환한 surgical edit을 `deleteText+insertText`로 정밀 반영, 전체 재렌더 없이 부분 갱신
2. **팀장 스타일 무중단 적용** — `getLeaderStyle` 응답을 Quill/jsPDF에 자동 매핑, 사용자는 폰트/마진을 신경 쓰지 않아도 됨
3. **3패널 항상 mount UX** — 챗봇 ↔ 피드백 ↔ 검색 탭 전환 시 대화/스크롤이 유지 (mount/unmount 안 함)
4. **401 자동 refresh + 큐잉** — 동시 다발 요청 상황에서도 refresh 1회만 호출, deadlock 방지
5. **모듈 캐시로 즉시 복귀** — `documentCache` + `staleMs`로 뒤로가기 시 네트워크 0번
6. **17종 한글 폰트 임베드** — Quill + html2pdf.js로 PDF까지 동일 폰트 유지
7. **수식/다이어그램/표/마크다운 통합** — 한 에디터에서 KaTeX + mermaid + quill-table-better + quilljs-markdown
8. **장애 흡수 UX** — 백엔드/AI가 200 + error 포맷으로 응답하면 토스트만 띄우고 작업 흐름 유지
9. **HashRouter + nginx 정적 서빙** — SPA 라우팅을 별도 서버 설정 없이 배포 가능
10. **TypeScript + axios 인터셉터** — DTO 타입 안전 + 인증 흐름 한 곳에 집약

---

> 📎 **출처 파일**: `src/App.tsx`, `src/apis/client.ts`, `src/apis/documentApi.ts`, `src/apis/chatbotApi.ts`,
> `src/summary/Center.tsx`, `src/summary/setupQuill.ts`, `src/helper/chatbot/Chatbot.tsx`,
> `package.json`, `FRONTEND.md`
