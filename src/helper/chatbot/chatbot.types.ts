/**
 * Chatbot 관련 타입 정의
 */

import type { ChatbotResponse } from '../../apis/chatbot_types';

export interface ChatbotProps {
  documentText?: string;
  topicId?: string;
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
