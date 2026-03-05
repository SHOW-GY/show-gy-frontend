import axios, { AxiosInstance } from 'axios';
import type {
  FirstChatRequest,
  FirstChatResponse,
  SecondChatRequest,
  SecondChatResponse,
  CreateBlockChatRequest,
  CreateBlockChatResponse,
  PatchBlockChatRequest,
  PatchBlockChatResponse,
  InsertionBanWordRequest,
  InsertionBanWordResponse,
} from './chatbot_types';

const BACKEND_URL = 'http://localhost:8000';

const chatbotClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: true,
});

type ChatAction = 'first' | 'selection_main_topic' | 'selection_negative_topic';

interface SelectionNegativeTopicRequest {
  action: 'selection_negative_topic';
  topic_id: string;
  negative_id: string;
}

export interface ChatbotMessageResponse {
  thread_id?: string;
  response_type?: string;
  data?: {
    final_response?: any;
    [key: string]: unknown;
  };
  message?: string;
  session?: string;
  [key: string]: unknown;
}

type ChatbotCallRequest =
  | FirstChatRequest
  | SecondChatRequest
  | SelectionNegativeTopicRequest;

const CHATBOT_CALL_PATH = '/api/v1/chatbot/call';
const CHATBOT_FIRST_CALL_PATH = '/api/v1/chatbot/call/astream';

function buildJsonDocument(documentText: string): FirstChatRequest['json_document'] {
  console.log('🔨 [buildJsonDocument] 문서 변환:', {
    docLength: documentText?.length,
    preview: documentText?.substring(0, 100)
  });
  return [{ additionalProp1: documentText ? { text: documentText } : {} }];
}

async function postChatbotCall<TResponse>(body: ChatbotCallRequest): Promise<TResponse> {
  const res = await chatbotClient.post<TResponse>(CHATBOT_CALL_PATH, body);
  return res.data;
}

async function postFirstChatCall<TResponse>(body: FirstChatRequest): Promise<TResponse> {
  const res = await chatbotClient.post<TResponse>(CHATBOT_FIRST_CALL_PATH, body);
  return res.data;
}

// 처음 챗봇과 대화
export async function firstChat(body: FirstChatRequest): Promise<FirstChatResponse> {
  return postFirstChatCall<FirstChatResponse>(body);
}

// 이후 챗봇과 대화(메인 주제 선택)
export async function secondChat(body: SecondChatRequest): Promise<SecondChatResponse> {
  return postChatbotCall<SecondChatResponse>(body);
}

// 금칙어 차단 목록 생성
export async function createBlockChat(
  body: CreateBlockChatRequest
): Promise<CreateBlockChatResponse> {
  const res = await chatbotClient.post<CreateBlockChatResponse>('/api/v1/ban/ban_word_list', body);
  return res.data;
}

// 금칙어 차단 목록 수정
export async function patchBlockChat(body: PatchBlockChatRequest): Promise<PatchBlockChatResponse> {
  const res = await chatbotClient.patch<PatchBlockChatResponse>('/api/v1/ban/ban_word/list', body);
  return res.data;
}

// 금칙어 단어 추가
export async function insertBanWord(
  body: InsertionBanWordRequest
): Promise<InsertionBanWordResponse> {
  const res = await chatbotClient.post<InsertionBanWordResponse>(
    '/api/v1/ban/ban_word_list/ban_word',
    body
  );
  return res.data;
}

// Chatbot.tsx 사용을 위한 통합 함수
export async function sendChatbotMessage(
  message: string,
  threadId: string,
  actionType: ChatAction,
  documentText: string,
  topicId: string,
  negativeId?: string
): Promise<ChatbotMessageResponse> {
  console.log('📤 [sendChatbotMessage] 호출:', {
    actionType,
    messageLength: message.length,
    documentTextLength: documentText?.length,
    topicId,
    threadId
  });

  if (actionType === 'first') {
    const body: FirstChatRequest = {
      thread_id: threadId,
      action: 'first',
      query: message,
      document: documentText,
      json_document: buildJsonDocument(documentText),
      topic_id: topicId,
      negative_id: negativeId ?? '',
    };

    console.log('📦 [sendChatbotMessage] First Chat Body:', body);
    return postFirstChatCall<ChatbotMessageResponse>(body);
  }

  if (actionType === 'selection_main_topic') {
    const body: SecondChatRequest = {
      action: 'selection_main_topic',
      topic_id: topicId,
      negative_id: negativeId ?? '',
    };

    return postChatbotCall<ChatbotMessageResponse>(body);
  }

  const body: SelectionNegativeTopicRequest = {
    action: 'selection_negative_topic',
    topic_id: topicId,
    negative_id: negativeId ?? '',
  };

  return postChatbotCall<ChatbotMessageResponse>(body);
}