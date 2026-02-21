// src/apis/chatbot_types.ts

/**
 * Chatbot + Ban API Types
 * - 7001 (AI Server): /api/v1/chatbot/request, /api/v1/chatbot/request/astream
 * - 8000 (Backend):  /api/v1/chatbot/call, /api/v1/chatbot/call/astream
 * - 8000 (Backend):  /api/v1/ban/ban_word_list, /api/v1/ban/ban_word_list/ban_word
 *
 * NOTE:
 * - Response shape is intentionally loose (`any`) where unknown.
 * - Fill TODOs later with your real backend/AI response schemas.
 */

// =========================
// Common
// =========================
export type ApiStatus = "success" | "error" | string;

// =========================
// 7001 AI Server - request
// =========================
export type AiChatbotAction =
  | "first"
  | "selection_main_topic"
  | "selection_negative_topic"
  | string;

export interface AiChatbotRequest {
  thread_id: string;
  action: AiChatbotAction;
  query: string;
  document: string;
  json_document?: any; // TODO: define real JSON doc structure if used
  topic_id?: string | null;
  negative_id?: string | null;
}

export interface AiChatbotResponse {
  session?: string; // TODO: confirm existence/meaning
  status?: ApiStatus;
  response_type?: string;
  message?: string | null;
  title?: string | null;
  thread_id?: string;
  data?: any; // TODO: define per response_type
}

// =========================
// 8000 Backend - call
// =========================
/**
 * Backend call endpoints likely wrap/bridge AI server + do auth/session/DB.
 * Request/Response schemas below are placeholders.
 */

export interface BackendChatbotCallAstreamRequest {
  query: string;
  document: string; // TODO: confirm actual field name & format (HTML? plain text?)
  // TODO: if backend expects json_document or others, add later
}

/**
 * SSE stream events can vary.
 * Keep as `string` line chunks; parse on client if needed.
 */
export type SseLine = string;

export interface BackendChatbotCallRequest {
  action: "selection_main_topic" | "selection_negative_topic" | string;
  topic_id?: string | null;
  negative_id?: string | null;
  // TODO: confirm actual request payload fields
}

export interface BackendChatbotCallResponse {
  status?: ApiStatus;
  response_type?: string;
  data?: any; // TODO: define per response_type
  message?: string | null;
  title?: string | null;
  thread_id?: string; // TODO: confirm if backend returns this or only session_id
  session_id?: string; // TODO: confirm naming (session? session_id?)
}

// =========================
// 8000 Backend - ban
// =========================
export interface BanWordItem {
  // TODO: fill real fields (id, word, created_at, etc.)
  [key: string]: any;
}

export interface BanWordListResponse {
  status?: ApiStatus;
  data?: BanWordItem[]; // TODO: confirm structure
  message?: string | null;
}

export interface BanWordUpsertRequest {
  // TODO: confirm backend schema (word? ban_word? etc.)
  word: string;
}

export interface BanWordUpsertResponse {
  status?: ApiStatus;
  data?: any; // TODO: confirm structure
  message?: string | null;
}