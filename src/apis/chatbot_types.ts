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
  // 챗봇 입력창 첨부 파일에서 추출된 텍스트
  input_docs?: string;
  // 첨부 문서 역할 — 'template'(구조만 차용) | 'content'(본문으로 통째 교체)
  input_docs_kind?: 'template' | 'content';
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
  highlighted_html?: string;
  highlighted_delta?: DeltaDocument;
}

export interface ChatbotResponse {
  status: 'success' | 'error';
  response_type:
    | 'selection_main_topic'
    | 'negative_selection'
    | 'final_edit'
    | 'exception'
    | 'apply_document';
  data?: {
    final_response?:
      | ChatbotMainTopic[]
      | NegativeSentenceResponse
      | DeltaDocument
      | string;
    exception_final_response?: string;
    session_id?: string;
    negative_sentence_list?: string[];
    negative_id_list?: number[];
    negative_sentence_reason?: string[];
    highlighted_delta?: DeltaDocument;
    // apply_document 전용: 보완된 전체 문서 본문. backend chat_log 에 다시 저장되지 않아도 무방.
    revised_document?: string;
    [key: string]: any;
  };
  message?: string | null;
  title?: string;
  session_id?: string;
}

{/* 사용자가 금지된 말을 했을때 차단 */}
export interface CreateBlockChatRequest {
  ban_word_list: string[];
  ban_context: string;
}

export interface CreateBlockChatResponse {
  success: boolean;
  ban_list: string[];
  ban_context: string;
  msg: string;
}

export interface PatchBlockChatRequest {
  ban_word_list: string[];
}

export interface PatchBlockChatResponse {
  success: boolean;
  update_ban_word: string[];
}

export interface InsertionBanWordRequest {
  ban_word_list: string[];
  ban_context: string;
}

export interface InsertionBanWordResponse {
  success: boolean;
  ban_word_list: string[];
}