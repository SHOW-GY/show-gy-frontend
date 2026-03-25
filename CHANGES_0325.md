# 프론트엔드 변경 내역 (2025-03-25)

## 1. 부정문 0개 처리 + 건너뛰기 버튼

### 문제
- LLM이 부정문을 0개 반환하면 빈 체크박스 UI가 뜨고 진행 불가
- 부정문을 전부 체크 해제해도 "편집 진행" 버튼이 비활성화되어 막힘

### 해결
- **`chatbot.parsers.ts`**: `negative_sentence_list`가 빈 리스트면 "수정할 문장이 없습니다" 메시지 표시
- **`ChatNegatives.tsx`**: "편집 진행" 옆에 "건너뛰기" 버튼 추가
- **`Chatbot.tsx`**: `handleNegativeConfirm`에서 0개 선택 시 "수정 없이 건너뛰었습니다" 메시지 표시
