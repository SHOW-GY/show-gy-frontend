/**
 * Chatbot 관련 타입 정의
 */

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

// TODO: API response 타입 명확화 필요 (현재 any로 처리)
// 가능한 후보: { thread_id?: string; response_type?: string; data?: { final_response?: any }; message?: string; session?: string }
export type ChatbotApiResponse = any;
