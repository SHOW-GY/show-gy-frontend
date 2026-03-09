{/* 챗봇 요청 - 통합 엔드포인트 */}
export interface DeltaOp {
  insert?: string;
  delete?: number;
  retain?: number;
  attributes?: Record<string, any>;
}

export interface DeltaDocument {
  ops: DeltaOp[];
}

export type ChatbotAction = 'first' | 'selection_main_topic' | 'selection_negative_topic' | 'edit_document';

export interface ChatbotCallRequest {
  action: ChatbotAction;
  query?: string;
  delta_document?: DeltaDocument;
  topic_id?: string;
  negative_id?: string;
}

{/* 챗봇 응답 - 통합 */}
export interface ChatbotResponseSource {
  provider: string;
  url: string;
}

export interface ChatbotMainTopic {
  key_id: string;
  main_topic_sentence: string;
  sources: ChatbotResponseSource[];
}

export interface NegativeSentenceResponse {
  negative_sentence_list: string[];
  negative_id_list: number[];
  negative_sentence_reason: string[];
  highlighted_delta: DeltaDocument;
}

export interface ChatbotResponse {
  status: 'success' | 'error';
  response_type: 'selection_main_topic' | 'selection_negative_sentence' | 'final_edit' | 'exception';
  data?: {
    final_response?: ChatbotMainTopic[] | NegativeSentenceResponse | DeltaDocument | string;
    exception_final_response?: string;
    [key: string]: any;
  };
  message?: string | null;
  title?: string;
}

{/* 사용자가 금지된 말을 했을때 차단 */}
export interface CreateBlockChatRequest {
  ban_word_list: [string];
  ban_context: string;
}

export interface CreateBlockChatResponse {
  success: boolean;
  ban_list: [string];
  ban_context: string;
  msg: string;
}

export interface PatchBlockChatRequest {
  ban_word_list: [string];
}

export interface PatchBlockChatResponse {
  success: boolean;
  update_ban_word: [string];
}

export interface InsertionBanWordRequest {
  ban_word_list: [string];
  ban_context: string;
}

export interface InsertionBanWordResponse {
  success: boolean;
  ban_word_list: [string];
}