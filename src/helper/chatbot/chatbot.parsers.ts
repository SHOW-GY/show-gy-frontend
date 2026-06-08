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

// 백엔드 raw action 을 사용자 친화 라벨로 매핑.
// 챗봇 패널 좌측 사용자 메시지에 표시됨 — "first" 같은 내부 키워드 노출 방지.
const ACTION_LABELS: Record<string, string> = {
  first: '📊 문서 분석 요청',
  selection_main_topic: '✅ 주제 선택',
  selection_negative_topic: '✅ 부정문 확인',
  edit_document: '✏️ 편집 요청',
  final_edit: '✏️ 편집 요청',
  summary: '📋 요약 요청',
  qa: '❓ 질문',
  general_chat: '💬 대화',
  apply_leader_style: '🎨 팀장 스타일 적용',
};

function deltaToPlainText(delta: any, maxLen = 300): string {
  // Quill Delta ops에서 텍스트만 추출. attribute의 header/list 등 무시.
  const ops = delta?.ops;
  if (!Array.isArray(ops)) return '';
  let acc = '';
  for (const op of ops) {
    if (typeof op?.insert === 'string') {
      acc += op.insert;
      if (acc.length >= maxLen) break;
    }
  }
  acc = acc.replace(/\n+/g, ' ').trim();
  return acc.length > maxLen ? acc.slice(0, maxLen) + '…' : acc;
}

function labelForUserContent(item: { content: any; action?: string }): string {
  // 1) string content (현재 backend 정책 — 새 메시지부터는 query 또는 "Action: xxx" 둘 중 하나)
  if (typeof item.content === 'string') {
    const raw = item.content;
    const m = raw.match(/^Action:\s*(\S+)/);
    if (m && ACTION_LABELS[m[1]]) return ACTION_LABELS[m[1]];
    return raw;
  }
  // 2) Delta 객체 content (이전 backend 가 본문 JSON 을 통째 저장한 레거시 메시지)
  // → 사용자 메시지 풍선에는 action 라벨만. 본문 preview 노출 X.
  if (item.action && ACTION_LABELS[item.action]) return ACTION_LABELS[item.action];
  return '메시지';
}

/** Redis 대화 내역 → ChatMessage[] 변환 */
export function convertHistoryToMessages(
  history: Array<{ role: string; content: any; response_type?: string; action?: string }>,
): ChatMessage[] {
  const restored: ChatMessage[] = [INITIAL_MESSAGE];
  for (const item of history) {
    if (item.role === 'user') {
      const content = labelForUserContent(item);
      restored.push({ role: 'user', content });
    } else if (item.role === 'assistant') {
      const data = typeof item.content === 'string'
        ? (() => { try { return JSON.parse(item.content); } catch { return {}; } })()
        : (item.content || {});
      const rt = item.response_type || '';
      const fr = data.final_response;

      // selection_main_topic — 주제 후보 리스트 그대로 복원
      if (rt === 'selection_main_topic' && Array.isArray(fr)) {
        restored.push({
          role: 'bot',
          content: '다음 중에서 선택해주세요:',
          selections: fr,
          responseType: rt,
        });
        continue;
      }

      // negative_selection — 부정문/사유 리스트 복원
      if (rt === 'negative_selection') {
        const nsl = data.negative_sentence_list || (fr as any)?.negative_sentence_list;
        if (Array.isArray(nsl) && nsl.length > 0) {
          const nsr = data.negative_sentence_reason || (fr as any)?.negative_sentence_reason || [];
          const nid = data.negative_id_list || (fr as any)?.negative_id_list || [];
          const negatives = nsl.map((sentence: string, idx: number) => ({
            sentence,
            reason: nsr[idx] || '삭제 제안',
            negativeId: nid[idx] ?? idx,
          }));
          restored.push({
            role: 'bot',
            content: '다음 문장들을 삭제하시겠습니까?',
            negatives,
            responseType: rt,
          });
          continue;
        }
      }

      // final_edit — 변경 통계로 풀어서 표시
      if (rt === 'final_edit' || rt === 'edit_document') {
        const removed: string[] = data.removed_sentences || [];
        const edited: Array<{ original: string; edited_sentence: string }> = data.edited_sentences || [];
        const lines: string[] = ['✏️ 문서 편집이 적용되었습니다.'];
        if (removed.length > 0) lines.push(`  • 삭제: ${removed.length}건`);
        if (edited.length > 0) lines.push(`  • 수정: ${edited.length}건`);
        // 수정 예시 최대 3개
        const preview = edited.slice(0, 3);
        for (const e of preview) {
          const o = (e.original || '').slice(0, 40);
          const n = (e.edited_sentence || '').slice(0, 40);
          if (o && n && o !== n) lines.push(`    "${o}" → "${n}"`);
        }
        if (edited.length > 3) lines.push(`    … 외 ${edited.length - 3}건`);
        restored.push({ role: 'bot', content: lines.join('\n'), responseType: rt });
        continue;
      }

      // summary / qa / general_chat / exception — 텍스트 응답 그대로
      let text = '';
      if (rt === 'summary' || rt === 'qa' || rt === 'general_chat' || rt === 'exception') {
        text = typeof fr === 'string' ? fr : (data.exception_final_response || '응답');
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
        const count = finalResponse.length;
        return {
          role: 'bot',
          content: `문서에서 주제문 ${count}개를 추출했어요. 아래에서 검사할 주제 하나를 클릭하면 그 주제와 맞지 않는 문장(부정문)을 바로 찾아드릴게요.`,
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
        const count = nsl.length;
        // 부정문 0개 — 카드 없이 안내만
        if (count === 0) {
          return {
            role: 'bot',
            content: '이 주제와 맞지 않는 문장은 없어요. 문서가 선택한 주제와 일관되게 작성되어 있습니다.',
            responseType,
          };
        }
        const negatives = nsl.map((sentence: string, idx: number) => ({
          sentence,
          reason: nsr[idx] || '삭제 제안',
          negativeId: nid[idx] ?? idx,
        }));
        return {
          role: 'bot',
          content: `이 주제와 맞지 않는 문장이 ${count}개 있어요. 수정하거나 삭제할 문장을 아래에서 선택해주세요.`,
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

        // 여백 — 에디터에 실제 적용되고 PDF 내보내기에 반영됨
        // (페이지 크기는 고정 A4폭 렌더 구조라 적용 불가 → 백엔드에서 보내지 않음)
        const pdfApplied: string[] = [];
        if (pdfStyleHint?.margins) {
          const m = pdfStyleHint.margins;
          pdfApplied.push(`여백: 위 ${m.top} / 아래 ${m.bottom} / 좌 ${m.left} / 우 ${m.right}`);
        }
        if (pdfApplied.length > 0) {
          lines.push('📄 여백 적용됨 (PDF 내보내기에 반영)');
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

    case 'apply_document': {
      // 직전 제안을 에디터에 직접 반영. 채팅창에는 explain 만 보여준다.
      // 새 응답 계약: final_response = explain string, data.revised_document = 본문 (별도 필드).
      // revised_document 는 Chatbot.tsx handleResponse → onApplyDocument 로 에디터에 전달.
      const explain =
        (typeof finalResponse === 'string' && finalResponse) ||
        '문서에 적용했어요.';
      return {
        role: 'bot',
        content: explain,
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
