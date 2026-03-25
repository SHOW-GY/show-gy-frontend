/**
 * Chatbot 관련 타입 정의
 */

import type { ChatbotResponse } from '../../apis/chatbot_types';

export interface ChatbotProps {
  deltaDocument?: { ops: any[] };
  topicId?: string;
  onDocumentEdit?: (delta: { ops: any[] }) => void;
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
  delta?: { ops: any[] };
  responseType?: string;
}

// Chatbot API response 타입
export type ChatbotApiResponse = ChatbotResponse;
