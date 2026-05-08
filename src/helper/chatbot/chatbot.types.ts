/**
 * Chatbot 관련 타입 정의
 */

import type { ChatbotResponse } from '../../apis/chatbot_types';

export interface FormatHints {
  font?: string;          // Quill 폰트 키
  lineHeight?: string;    // 예: "1.6"
  indent?: number | null;
}

export interface PdfStyleHint {
  margins?: { top: number; bottom: number; left: number; right: number };
  pageSize?: { width: number; height: number };
}

export interface ChatbotFeedbackItem {
  sentence: string;
  reason: string;
}

export interface ChatbotReferenceSource {
  title?: string;
  url: string;
  source?: string;
  snippet?: string;
}

export interface ChatbotProps {
  documentId?: number;
  documentText?: string;
  topicId?: string;
  deltaDocument?: { ops: any[] };
  onFinalEdit?: (
    delta: { ops: any[] },
    removedSentences?: string[],
    editedSentences?: Array<{ original: string; edited_sentence: string }>,
    formatHints?: FormatHints,
    pdfStyleHint?: PdfStyleHint,
  ) => void;
  onHighlight?: (sentences: string[]) => void;
  onClearHighlight?: () => void;
  // 부정문 선정 결과 — Feedback 탭으로 push
  onFeedback?: (items: ChatbotFeedbackItem[]) => void;
  // 검색 참고자료 — Search 탭으로 push
  onReferences?: (sources: ChatbotReferenceSource[]) => void;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  selections?: Array<{ key_id: string; main_topic_sentence: string }>;
  negatives?: Array<{ 
    sentence: string; 
    reason: string; 
    negativeId: number;
  }>;
  responseType?: string;
}

// Chatbot API response 타입
export type ChatbotApiResponse = ChatbotResponse;
