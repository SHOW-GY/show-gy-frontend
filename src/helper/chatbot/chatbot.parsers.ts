/**
 * Chatbot API Response 파싱 및 분기 판단 로직
 * ⚠️ 기존 로직을 1도 변경하지 않고 그대로 분리
 */

import { ChatMessage, ChatbotApiResponse } from './chatbot.types';

/**
 * API response를 ChatMessage로 변환
 * @param response API 응답 (any 타입 유지)
 * @returns 생성할 ChatMessage 객체
 */
export function parseResponseToMessage(response: ChatbotApiResponse): ChatMessage {
  const responseType = response.response_type || '';
  const data = response.data || {};
  const finalResponse = data.final_response;

  // response_type 기반 분기 (문서 스펙 기준)
  switch (responseType) {
    case 'selection_main_topic':
      // 주제문 배열 → 라디오 버튼 표시
      if (Array.isArray(finalResponse)) {
        return {
          role: 'bot',
          content: '다음 중에서 선택해주세요:',
          selections: finalResponse,
          responseType,
        };
      }
      break;

    case 'negative_selection':
      // 부정문 목록 → 체크박스 표시 (data 직접 접근)
      const nsl = data.negative_sentence_list || (finalResponse as any)?.negative_sentence_list;
      if (nsl && Array.isArray(nsl)) {
        const nsr = data.negative_sentence_reason || (finalResponse as any)?.negative_sentence_reason || [];
        const nid = data.negative_id_list || (finalResponse as any)?.negative_id_list || [];
        const negatives = nsl.map((sentence: string, idx: number) => ({
          sentence,
          reason: nsr[idx] || '삭제 제안',
          negativeId: nid[idx] ?? idx,
        }));
        return {
          role: 'bot',
          content: '다음 문장들을 삭제하시겠습니까?',
          negatives,
          responseType,
        };
      }
      break;

    case 'final_edit': {
      // 팀장 스타일 적용 케이스 — format_hints / pdf_style_hint가 있으면 변경 내역 상세 표시
      const formatHints = (data as any).format_hints;
      const pdfStyleHint = (data as any).pdf_style_hint;
      const editedList = (data as any).edited_sentences || [];
      const isLeaderStyleApplied = !!(formatHints || pdfStyleHint);

      if (isLeaderStyleApplied) {
        const lines: string[] = [];
        lines.push('✅ 팀장님 스타일 적용 완료');
        lines.push('');

        if (Array.isArray(editedList) && editedList.length > 0) {
          lines.push(`📝 변경된 문장: ${editedList.length}개`);
          // 처음 3개만 미리보기
          const preview = editedList.slice(0, 3);
          for (let i = 0; i < preview.length; i++) {
            const e = preview[i];
            const orig = (e.original || '').slice(0, 60);
            const edited = (e.edited_sentence || '').slice(0, 60);
            lines.push(`  ${i + 1}. "${orig}${e.original?.length > 60 ? '…' : ''}"`);
            lines.push(`     → "${edited}${e.edited_sentence?.length > 60 ? '…' : ''}"`);
          }
          if (editedList.length > 3) {
            lines.push(`  … 외 ${editedList.length - 3}건`);
          }
          lines.push('');
        }

        // 에디터에 즉시 적용된 것
        const immediateApplied: string[] = [];
        if (formatHints?.font) {
          immediateApplied.push(`폰트: ${formatHints.font}`);
        }
        if (immediateApplied.length > 0) {
          lines.push('🎨 에디터에 즉시 적용됨');
          immediateApplied.forEach((s) => lines.push(`  • ${s}`));
          lines.push('');
        }

        // PDF 내보내기 시 적용 예정
        const pdfApplied: string[] = [];
        if (pdfStyleHint?.margins) {
          const m = pdfStyleHint.margins;
          pdfApplied.push(`여백: 위 ${m.top} / 아래 ${m.bottom} / 좌 ${m.left} / 우 ${m.right}`);
        }
        if (pdfStyleHint?.pageSize) {
          const ps = pdfStyleHint.pageSize;
          pdfApplied.push(`페이지 크기: ${ps.width} × ${ps.height}`);
        }
        if (pdfApplied.length > 0) {
          lines.push('📄 PDF 내보내기 시 적용 예정');
          pdfApplied.forEach((s) => lines.push(`  • ${s}`));
        }

        return {
          role: 'bot',
          content: lines.join('\n'),
          responseType,
        };
      }

      // 일반 편집 (부정문 제거 등)
      if (Array.isArray(editedList) && editedList.length > 0) {
        return {
          role: 'bot',
          content: `문서 편집이 완료되었습니다. (${editedList.length}개 문장 수정)`,
          responseType,
        };
      }
      return {
        role: 'bot',
        content: '문서 편집이 완료되었습니다.',
        responseType,
      };
    }

    case 'exception':
      const errMsg = (typeof finalResponse === 'string' ? finalResponse : null)
        || data.exception_final_response
        || response.message
        || '오류가 발생했습니다.';
      return { role: 'bot', content: errMsg, responseType };
  }

  // 폴백
  const fallbackMsg = (typeof finalResponse === 'string' ? finalResponse : null)
    || response.message
    || '응답을 받았습니다.';
  return { role: 'bot', content: fallbackMsg, responseType };
}
