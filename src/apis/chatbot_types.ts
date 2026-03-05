{/* 처음 챗봇과 대화할때 */}
export interface FirstChatRequest {
  thread_id: string;
  action: 'first';
  query: string;
  document: string;
  json_document: Array<{ additionalProp1: any }>;
  topic_id: string;
  negative_id: string;
}

export interface FirstChatResponse {
  thread_id: string;
}

{/* 이후 챗봇과 대화할때 */}
export interface SecondChatRequest {
  action: 'selection_main_topic';
  topic_id: string;
  negative_id: string;
}

export interface SecondChatResponse {
  thread_id: string;
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