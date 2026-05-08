/**
 * Chatbot API Response 파싱 및 분기 판단 로직
 */

import { ChatMessage, ChatbotApiResponse } from './chatbot.types';
import { INITIAL_MESSAGE } from './chatbot.constants';


// ─── 유틸리티 ───────────────────────────────────────────

/** session_id 형태 "user_id:doc_id:uuid" → uuid 부분 추출 */
export function extractShortSessionId(fullId: string): string {
  const parts = fullId.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : fullId;
}

/** 문자열 끝부분만 미리보기 (변경점이 종결어미에 있을 때 유용) */
export function getTailPreview(text: string, maxLen = 40): string {
  const t = text.trim();
  return t.length > maxLen ? '…' + t.slice(-maxLen) : t;
}

/** edited_sentences 변경 유형 분류 */
export function classifyEditChanges(editedList: Array<{ original: string; edited_sentence: string }>) {
  let toneCount = 0;
  let formatCount = 0;
  let otherCount = 0;
  for (const e of editedList) {
    const o = e.original || '';
    const n = e.edited_sentence || '';
    if (/(?:합니다|했습니다|됩니다)/.test(o) !== /(?:합니다|했습니다|됩니다)/.test(n) ||
        o.endsWith('다.') !== n.endsWith('다.') ||
        o.endsWith('함.') !== n.endsWith('함.') ||
        o.endsWith('임.') !== n.endsWith('임.')) {
      toneCount++;
    } else if (/\d{4}년/.test(o) !== /\d{4}\./.test(n) || /\(\d\)/.test(o) !== /\d\./.test(n)) {
      formatCount++;
    } else {
      otherCount++;
    }
  }
  return { toneCount, formatCount, otherCount };
}

/** Redis 대화 내역 → ChatMessage[] 변환 */
export function convertHistoryToMessages(
  history: Array<{ role: string; content: any; response_type?: string; action?: string }>,
): ChatMessage[] {
  const restored: ChatMessage[] = [INITIAL_MESSAGE];
  for (const item of history) {
    if (item.role === 'user') {
      const content = typeof item.content === 'string'
        ? item.content
        : (item.action || '메시지');
      restored.push({ role: 'user', content });
    } else if (item.role === 'assistant') {
      const data = typeof item.content === 'string'
        ? (() => { try { return JSON.parse(item.content); } catch { return {}; } })()
        : (item.content || {});
      const rt = item.response_type || '';
      const fr = data.final_response;

      let text = '';
      if (rt === 'summary' || rt === 'qa' || rt === 'general_chat' || rt === 'exception') {
        text = typeof fr === 'string' ? fr : (data.exception_final_response || '응답');
      } else if (rt === 'selection_main_topic') {
        text = '주제문이 생성되었습니다.';
      } else if (rt === 'negative_selection') {
        text = '부정문 분석이 완료되었습니다.';
      } else if (rt === 'final_edit') {
        text = '문서 편집이 적용되었습니다.';
      } else {
        text = typeof fr === 'string' ? fr : '응답을 받았습니다.';
      }
      restored.push({ role: 'bot', content: text, responseType: rt });
    }
  }
  return restored;
}

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
          const { toneCount, formatCount, otherCount } = classifyEditChanges(editedList);

          lines.push(`📝 총 ${editedList.length}개 문장 변경:`);
          if (toneCount > 0) lines.push(`  • 어조/종결어미 변경: ${toneCount}건`);
          if (formatCount > 0) lines.push(`  • 서식 변경 (날짜/리스트): ${formatCount}건`);
          if (otherCount > 0) lines.push(`  • 어휘/연결어 변경: ${otherCount}건`);
          lines.push('');

          const preview = editedList.slice(0, 5);
          lines.push('주요 변경 예시:');
          for (let i = 0; i < preview.length; i++) {
            const e = preview[i];
            const oTail = getTailPreview(e.original || '');
            const nTail = getTailPreview(e.edited_sentence || '');
            if (oTail !== nTail) {
              lines.push(`  ${i + 1}. "${oTail}"`);
              lines.push(`     → "${nTail}"`);
            }
          }
          if (editedList.length > 5) {
            lines.push(`  … 외 ${editedList.length - 5}건`);
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
