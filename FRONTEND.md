# show-gy-frontend 현황

> 최종 업데이트: 2026-04-15 | 브랜치: `temp/0412`

## 기술 스택
- React 18 + Vite + TypeScript
- Quill 2.x + Delta 포맷 (커스텀 blot: sg-math-block, mention)
- KaTeX (수식 렌더링), mermaid.js (다이어그램 → SVG)
- marked (Markdown → HTML)
- axios (API 클라이언트, withCredentials=true)
- html2pdf.js (PDF 내보내기)

## 주요 페이지/컴포넌트

### 페이지
| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | Summary | 문서 업로드/텍스트 입력 + 팀 선택 |
| `/summary/center/:id` | Center | Quill 에디터 + 챗봇 + 피드백/참고자료 패널 |
| `/library/*` | Alldocument/Recent/Trash | 문서 라이브러리 |

### 핵심 컴포넌트
| 컴포넌트 | 위치 | 설명 |
|---|---|---|
| `Center.tsx` | `summary/` | 에디터 + 3탭 패널 (chat/feedback/reference) |
| `Chatbot.tsx` | `helper/chatbot/` | 챗봇 대화 UI + 대화 내역 복원 |
| `Feedback.tsx` | `helper/` | 부정문 사유 카드 리스트 |
| `Search.tsx` | `helper/` | 검색 참고자료 URL 카드 |
| `chatbot.parsers.ts` | `helper/chatbot/` | 응답 파싱 + 유틸 (extractShortSessionId 등) |

### 에디터 기능
- Quill 폰트 17종 등록 (한글 12 + 시스템 3 + 영문 2)
- Surgical 편집: `removed_sentences` → `deleteText`, `edited_sentences` → `deleteText+insertText`
- 팀장 스타일: `format_hints.font` → `quill.formatText` 즉시 적용
- PDF 내보내기: `exportPdf(quill, margins, fontSize, fontFamilyKey)`
- 마진 슬라이더 (팀장 누적 마진 자동 적용, 사용자 override 가능)
- 5초 debounce 자동 저장

### 탭 시스템
- 3개 패널 항상 mount (`display:none` 토글) — 탭 전환 시 대화 유지
- chat → feedback 전환 후 복귀 시 스크롤 복구 (requestAnimationFrame)

### API 호출
| 함수 | 엔드포인트 | 용도 |
|---|---|---|
| `sendChatbotMessage` | `/chatbot/call/chatbot/{id}` | 챗봇 메시지 전송 |
| `getChatSessions` | `/chatbot/sessions/{id}` | 세션 목록 |
| `getChatHistory` | `/chatbot/history/{id}` | 대화 내역 복원 |
| `getLeaderStyle` | `/document/{id}/leader-style` | 팀장 스타일 자동 로드 |
| `getDocumentById` | `/document/{id}` | 문서 조회 |
| `saveDocumentContent` | `/document/{id}/content` | Delta 저장 |
| `uploadDocument` | `/document/upload` | 파일 업로드 |
| `exportPdf` | (로컬) | html2pdf.js |

## 환경변수
```
VITE_BACKEND_URL — 로컬: http://localhost:7001 / Docker: "" (nginx 프록시)
```

## 빌드
```bash
npm run dev      # 개발 (Vite HMR)
npx vite build   # 프로덕션 빌드 → docs/ (vite.config outDir)
```

## Docker
```dockerfile
FROM node:20-alpine AS builder → npx vite build
FROM nginx:alpine → COPY docs/ → nginx.conf 주입
```
