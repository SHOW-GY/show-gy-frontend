/**
 * ChatMessages - 전체 채팅 메시지 목록 렌더링
 * ⚠️ 기존 렌더링 결과를 동일하게 유지
 */

import React, { RefObject } from 'react';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatMessageRow } from './ChatMessageRow';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  chatContainerRef: RefObject<HTMLDivElement>;
  onSelectionClick: (keyId: string, sentence: string) => void;
  onNegativeClick: (negativeId: number, action: 'delete' | 'keep') => void;
}

export function ChatMessages({
  messages,
  isLoading,
  chatContainerRef,
  onSelectionClick,
  onNegativeClick,
}: ChatMessagesProps) {
  return (
    <div className="panel-chat-container" ref={chatContainerRef}>
      {messages.map((msg, index) => (
        <ChatMessageRow
          key={index}
          message={msg}
          isLoading={isLoading}
          onSelectionClick={onSelectionClick}
          onNegativeClick={onNegativeClick}
        />
      ))}
      {isLoading && (
        <div className="panel-chat-row row-bot">
          <img src={showgy} alt="SHOW-GY" className="panel-chat-avatar" />
          <div className="panel-chat-message bot-message">
            <p>...</p>
          </div>
        </div>
      )}
    </div>
  );
}
