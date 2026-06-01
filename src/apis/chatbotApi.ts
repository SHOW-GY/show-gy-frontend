import apiClient, { BACKEND_URL } from './client';
import type {
  ChatbotCallRequest,
  ChatbotResponse,
  DeltaDocument,
  CreateBlockChatRequest,
  CreateBlockChatResponse,
  PatchBlockChatRequest,
  PatchBlockChatResponse,
  InsertionBanWordRequest,
  InsertionBanWordResponse,
} from './chatbot_types';

const CHATBOT_CALL_PATH = '/api/v1/chatbot/call/chatbot';

/**
 * 챗봇에 메시지를 전송합니다.
 * @param documentId - 문서 ID (경로 파라미터)
 * @param request - 챗봇 요청
 * @param sessionId - 선택사항인 세션 ID (쿼리 파라미터)
 */
async function postChatbotCall(
  documentId: string,
  request: ChatbotCallRequest,
  sessionId?: string
): Promise<ChatbotResponse> {
  const url = `${CHATBOT_CALL_PATH}/${documentId}`;
  const config = sessionId ? { params: { session_id: sessionId } } : undefined;
  const res = await apiClient.post<ChatbotResponse>(url, request, config);
  return res.data;
}

// 금칙어 차단 목록 생성
export async function createBlockChat(
  body: CreateBlockChatRequest
): Promise<CreateBlockChatResponse> {
  const res = await apiClient.post<CreateBlockChatResponse>('/api/v1/ban/ban_word_list', body);
  return res.data;
}

// 금칙어 차단 목록 수정
export async function patchBlockChat(body: PatchBlockChatRequest): Promise<PatchBlockChatResponse> {
  const res = await apiClient.patch<PatchBlockChatResponse>('/api/v1/ban/ban_word/list', body);
  return res.data;
}

// 금칙어 단어 추가
export async function insertBanWord(
  body: InsertionBanWordRequest
): Promise<InsertionBanWordResponse> {
  const res = await apiClient.post<InsertionBanWordResponse>(
    '/api/v1/ban/ban_word_list/ban_word',
    body
  );
  return res.data;
}

/** 특정 문서의 모든 채팅 세션 목록 조회 */
export async function getChatSessions(documentId: string): Promise<{
  status: string;
  data: Array<{ session_id: string; title: string; document_id: string }>;
}> {
  const res = await apiClient.get(`/api/v1/chatbot/sessions/${documentId}`);
  return res.data;
}

/** 특정 세션의 대화 내역 조회 (Redis) */
export async function getChatHistory(documentId: string, sessionId: string): Promise<{
  status: string;
  data: Array<{
    role: 'user' | 'assistant';
    content: any;
    response_type?: string;
    action?: string;
    timestamp?: string;
  }>;
}> {
  const res = await apiClient.get(`/api/v1/chatbot/history/${documentId}`, {
    params: { session_id: sessionId },
  });
  return res.data;
}

export async function sendChatbotMessage(
  documentId: string,
  action: ChatbotCallRequest['action'],
  query?: string,
  deltaDocument?: DeltaDocument,
  topicId?: string,
  negativeId?: string,
  sessionId?: string,
  inputDocs?: string,
): Promise<ChatbotResponse> {
  const request: ChatbotCallRequest = {
    action,
    ...(query && { query }),
    ...(deltaDocument && { delta_document: deltaDocument }),
    ...(topicId && { topic_id: topicId }),
    ...(negativeId && { negative_id: negativeId }),
    ...(inputDocs && { input_docs: inputDocs }),
  };

  return postChatbotCall(documentId, request, sessionId);
}

/** 챗봇 입력창 첨부 파일 → 텍스트 추출 (PDF/TXT/MD) */
export async function extractChatAttachment(file: File): Promise<{
  status: string;
  data: { filename: string; text: string; char_count: number };
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post('/api/v1/chatbot/extract-attachment', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}