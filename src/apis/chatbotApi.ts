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
  inputDocsKind?: 'template' | 'content',
): Promise<ChatbotResponse> {
  const request: ChatbotCallRequest = {
    action,
    ...(query && { query }),
    ...(deltaDocument && { delta_document: deltaDocument }),
    ...(topicId && { topic_id: topicId }),
    ...(negativeId && { negative_id: negativeId }),
    ...(inputDocs && { input_docs: inputDocs }),
    ...(inputDocsKind && { input_docs_kind: inputDocsKind }),
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

/**
 * 챗봇 스트림 호출 — Server-Sent Events 로 토큰 단위 응답 받기.
 * onEvent 콜백으로 각 SSE 이벤트 전달 (token / tool / final / error / session).
 * 호출자가 토큰을 받아 message.content 에 append, final 받으면 메타데이터 처리.
 */
export type ChatbotStreamEvent =
  | { type: 'session'; session_id: string }
  | { type: 'token'; text: string }
  | { type: 'tool'; name: string }
  | { type: 'step'; key: string; state: 'start' | 'done'; elapsed_ms?: number }
  | { type: 'final'; response_type: string; data: any; title?: string }
  | { type: 'error'; message: string };

export async function sendChatbotMessageStream(
  documentId: string,
  action: ChatbotCallRequest['action'],
  onEvent: (evt: ChatbotStreamEvent) => void,
  options?: {
    query?: string;
    deltaDocument?: DeltaDocument;
    topicId?: string;
    negativeId?: string;
    sessionId?: string;
    inputDocs?: string;
    inputDocsKind?: 'template' | 'content';
    signal?: AbortSignal;
  },
): Promise<void> {
  const body: ChatbotCallRequest = {
    action,
    ...(options?.query && { query: options.query }),
    ...(options?.deltaDocument && { delta_document: options.deltaDocument }),
    ...(options?.topicId && { topic_id: options.topicId }),
    ...(options?.negativeId && { negative_id: options.negativeId }),
    ...(options?.inputDocs && { input_docs: options.inputDocs }),
    ...(options?.inputDocsKind && { input_docs_kind: options.inputDocsKind }),
  };

  const sessionParam = options?.sessionId ? `?session_id=${encodeURIComponent(options.sessionId)}` : '';
  const url = `${BACKEND_URL}/api/v1/chatbot/call/chatbot-stream/${encodeURIComponent(documentId)}${sessionParam}`;

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include', // httpOnly cookie (access_token) 전송
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`stream HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 라인 분리: 각 이벤트는 "data: ...\n\n" 형태
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const trimmed = raw.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const evt = JSON.parse(payload) as ChatbotStreamEvent;
        onEvent(evt);
      } catch {
        // JSON parse 실패는 무시
      }
    }
  }
}