// src/apis/chatbotApi.ts

import axios, { AxiosInstance } from "axios";
import type {
  AiChatbotRequest,
  AiChatbotResponse,
  BackendChatbotCallAstreamRequest,
  BackendChatbotCallRequest,
  BackendChatbotCallResponse,
  SseLine,
  BanWordListResponse,
  BanWordUpsertRequest,
  BanWordUpsertResponse,
} from "./chatbot_types";

/**
 * Endpoints summary
 * 7001 (AI):
 * - POST /api/v1/chatbot/request
 * - POST /api/v1/chatbot/request/astream (SSE)
 *
 * 8000 (Backend):
 * - POST /api/v1/chatbot/call
 * - POST /api/v1/chatbot/call/astream (SSE)
 * - GET  /api/v1/ban/ban_word_list
 * - POST /api/v1/ban/ban_word_list/ban_word
 */

// TODO: move to env (Vite): import.meta.env.VITE_AI_URL / VITE_BACKEND_URL
const AI_URL = "http://127.0.0.1:7001";
const BACKEND_URL = "http://127.0.0.1:8000";

// -------------------------
// Axios instances
// -------------------------
const aiClient: AxiosInstance = axios.create({
  baseURL: AI_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const backendClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// TODO: If backend requires JWT, attach Authorization here (interceptor or per request).
// backendClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// -------------------------
// 7001 AI - request
// -------------------------
export async function aiChatbotRequest(body: AiChatbotRequest): Promise<AiChatbotResponse> {
  const res = await aiClient.post<AiChatbotResponse>("/api/v1/chatbot/request", body);
  return res.data;
}

/**
 * 7001 AI - request/astream (SSE)
 * - This returns streamed text/event-stream.
 * - We keep it generic: you get raw SSE lines; you decide parsing.
 *
 * Usage:
 *   const controller = new AbortController();
 *   for await (const line of aiChatbotRequestAstream(body, controller.signal)) { ... }
 */
export async function* aiChatbotRequestAstream(
  body: AiChatbotRequest,
  signal?: AbortSignal
): AsyncGenerator<SseLine, void, void> {
  const res = await fetch(`${AI_URL}/api/v1/chatbot/request/astream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  // TODO: handle non-200 responses more strictly if needed
  if (!res.ok || !res.body) {
    throw new Error(`AI astream failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE는 보통 \n\n 단위로 이벤트가 끊김
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // chunk는 "data: {...}" 형태가 많음. 일단 raw로 넘김
      yield chunk;
    }
  }

  if (buffer.trim().length > 0) {
    yield buffer;
  }
}

// -------------------------
// 8000 Backend - call
// -------------------------
/**
 * 8000 Backend - /chatbot/call
 * session_id를 query로 받는 구조일 가능성이 있음(네가 말한 흐름 기반).
 * TODO: 네 백엔드 실제 파라미터명(session_id 등) 확정 후 타입 강화.
 */
export async function backendChatbotCall(
  sessionId: string,
  body: BackendChatbotCallRequest
): Promise<BackendChatbotCallResponse> {
  const res = await backendClient.post<BackendChatbotCallResponse>(
    "/api/v1/chatbot/call",
    body,
    { params: { session_id: sessionId } } // TODO: confirm param key
  );
  return res.data;
}

/**
 * 8000 Backend - /chatbot/call/astream (SSE)
 * - session_id가 query로 올 수도 있고, request body에 포함될 수도 있음.
 * - 여기선 "body + optional sessionId query" 패턴으로 둠.
 */
export async function* backendChatbotCallAstream(
  body: BackendChatbotCallAstreamRequest,
  sessionId?: string,
  signal?: AbortSignal
): AsyncGenerator<SseLine, void, void> {
  const url = new URL(`${BACKEND_URL}/api/v1/chatbot/call/astream`);
  if (sessionId) url.searchParams.set("session_id", sessionId); // TODO: confirm param key

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // TODO: attach JWT if needed
  // const token = localStorage.getItem("access_token");
  // if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Backend astream failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      yield chunk;
    }
  }

  if (buffer.trim().length > 0) {
    yield buffer;
  }
}

// -------------------------
// 8000 Backend - ban endpoints
// -------------------------
export async function getBanWordList(): Promise<BanWordListResponse> {
  const res = await backendClient.get<BanWordListResponse>("/api/v1/ban/ban_word_list");
  return res.data;
}

export async function upsertBanWord(body: BanWordUpsertRequest): Promise<BanWordUpsertResponse> {
  const res = await backendClient.post<BanWordUpsertResponse>(
    "/api/v1/ban/ban_word_list/ban_word",
    body
  );
  return res.data;
}