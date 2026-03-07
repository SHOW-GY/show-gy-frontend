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
