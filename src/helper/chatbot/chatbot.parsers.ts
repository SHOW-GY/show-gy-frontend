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
  const finalResponse = response.data?.final_response;

  // TODO: finalResponse 타입 후보
  // - Array<{ key_id: string; main_topic_sentence: string }> (선택지)
  // - { negative_sentence_list?: string[]; negative_sentence_reason?: string[]; negative_id_list?: number[] } (삭제 제안)
  // - string (일반 텍스트 응답)

  // final_response가 배열(선택지)인 경우
  if (Array.isArray(finalResponse)) {
    return {
      role: 'bot',
      content: '다음 중에서 선택해주세요:',
      selections: finalResponse,
      responseType: responseType
    };
  } 
  // negative_sentence_list가 있는 경우 - 삭제 제안
  else if (typeof finalResponse === 'object' && finalResponse?.negative_sentence_list) {
    const negatives = finalResponse.negative_sentence_list.map(
      (sentence: string, idx: number) => ({
        sentence,
        reason: finalResponse.negative_sentence_reason?.[idx] || '삭제 제안',
        negativeId: finalResponse.negative_id_list?.[idx] || idx,
      })
    );
    return {
      role: 'bot',
      content: '다음 문장들을 삭제하시겠습니까?',
      negatives,
      responseType: responseType
    };
  } 
  // final_response가 문자열인 경우
  else if (typeof finalResponse === 'string') {
    return {
      role: 'bot',
      content: finalResponse,
      responseType: responseType
    };
  } 
  // message 또는 session 사용
  else {
    const botResponse = response.message || response.session || '응답을 받았습니다.';
    return {
      role: 'bot',
      content: botResponse,
      responseType: responseType
    };
  }
}
