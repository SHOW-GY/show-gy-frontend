/**
 * Chatbot 관련 상수
 */

import { ChatMessage } from './chatbot.types';

export const INITIAL_MESSAGE: ChatMessage = {
  role: 'bot',
  content: 'SHOW-BOT 입니다.\n무엇을 도와드릴까요?'
};

export const DEFAULT_THREAD_ID = 'default';
