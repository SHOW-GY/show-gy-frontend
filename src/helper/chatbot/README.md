# Chatbot 모듈 리팩토링 완료

## 📁 새로운 파일 구조

```
src/helper/chatbot/
├── Chatbot.tsx                    # 메인 컨테이너 (상태 관리 + 핸들러 연결)
├── chatbot.types.ts               # 타입 정의 (ChatbotProps, ChatMessage)
├── chatbot.constants.ts           # 상수 (초기 메시지, 기본 thread ID)
├── chatbot.parsers.ts             # API 응답 파싱 로직
├── hooks/
│   └── useAutoScroll.ts          # 자동 스크롤 커스텀 훅
└── parts/
    ├── ChatMessages.tsx          # 전체 메시지 목록 컴포넌트
    ├── ChatMessageRow.tsx        # 개별 메시지 행 컴포넌트
    ├── ChatSelections.tsx        # 선택지 UI 컴포넌트
    ├── ChatNegatives.tsx         # 삭제 제안 UI 컴포넌트
    └── ChatInputBar.tsx          # 입력창 UI 컴포넌트

src/styles/
└── chatbot.css                    # 챗봇 전용 스타일시트 (summary.css에서 완전 분리)
```

## ✅ 주요 변경사항

### 1. **기능별 파일 분리**
   - 타입, 상수, 파서, 훅을 각각 별도 파일로 분리
   - UI 컴포넌트를 `parts/` 디렉토리로 모듈화

### 2. **CSS 완전 분리**
   - `summary.css`에서 모든 챗봇 관련 스타일 제거
   - 새로운 `chatbot.css` 파일로 이동
   - 인라인 스타일을 CSS 클래스로 변환

### 3. **기존 동작 유지**
   - 상태 업데이트 순서 동일
   - API 호출 파라미터/순서 동일
   - 메시지 구조(role, content, selections, negatives, responseType) 유지
   - threadId 업데이트 로직 유지
   - UI 렌더링 결과 동일

## 🔍 Import 경로 변경

### 이전:
```typescript
import Chatbot from '../helper/Chatbot';
```

### 변경 후:
```typescript
import Chatbot from '../helper/chatbot/Chatbot';
```

## 📝 TODO 주석

타입이 불명확한 부분은 TODO 주석으로 표시:

**chatbot.types.ts**:
```typescript
// TODO: API response 타입 명확화 필요 (현재 any로 처리)
export type ChatbotApiResponse = any;
```

**chatbot.parsers.ts**:
```typescript
// TODO: finalResponse 타입 후보
// - Array<{ key_id: string; main_topic_sentence: string }> (선택지)
// - { negative_sentence_list?: string[]; ... } (삭제 제안)
// - string (일반 텍스트 응답)
```

## 🎨 CSS 클래스 목록

### 기존 클래스 (유지):
- `.panel-chat-container`
- `.panel-chat-row`, `.row-bot`, `.row-user`
- `.panel-chat-avatar`
- `.panel-chat-message`, `.bot-message`, `.user-message`
- `.panel-input-bar`
- `.panel-input-field`
- `.panel-input-rect`, `.panel-input-square`, `.panel-input-plus`

### 새로 추가된 클래스:
- `.chat-message-text` (메시지 텍스트)
- `.chat-selections-container` (선택지 컨테이너)
- `.chat-selection-button` (선택지 버튼)
- `.chat-negatives-container` (삭제 제안 컨테이너)
- `.chat-negative-item` (개별 삭제 제안 항목)
- `.chat-negative-sentence` (삭제 제안 문장)
- `.chat-negative-reason` (삭제 이유)
- `.chat-negative-buttons` (삭제/보관 버튼 컨테이너)
- `.chat-negative-button.delete` (삭제 버튼)
- `.chat-negative-button.keep` (보관 버튼)

## ⚠️ 주의사항

1. **기존 로직 유지**: 모든 상태 업데이트, API 호출 순서가 기존과 동일합니다.
2. **타입 안정성**: 불명확한 타입은 `any`로 유지하고 TODO로 표시했습니다.
3. **스타일 동일성**: CSS 분리 후에도 화면 렌더링이 기존과 동일합니다.
4. **빌드 안정성**: 모든 import 경로가 정확하게 업데이트되었습니다.
