/**
 * 채팅 메시지가 추가될 때마다 스크롤을 아래로 자동 이동하는 Hook
 */

import { useEffect, RefObject } from 'react';
import { ChatMessage } from '../chatbot.types';

interface UseAutoScrollParams {
  chatContainerRef: RefObject<HTMLDivElement>;
  messages: ChatMessage[];
  isLoading: boolean;
}

export function useAutoScroll({ chatContainerRef, messages, isLoading }: UseAutoScrollParams) {
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, chatContainerRef]);
}
