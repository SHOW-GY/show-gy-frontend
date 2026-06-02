import React, { RefObject } from 'react';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatMessageRow } from './ChatMessageRow';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  chatContainerRef: RefObject<HTMLDivElement>;
  onSelectionClick: (keyId: string, sentence: string) => void;
  onNegativeSubmit: (deleteIds: number[]) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  isStreaming,
  chatContainerRef,
  onSelectionClick,
  onNegativeSubmit,
}: ChatMessagesProps) {
  // 스트리밍 시작 후엔 마지막 봇 메시지가 실시간으로 채워지므로 별도 indicator 행은 숨김
  const showIndicator = isLoading && !isStreaming;
  return (
    <div className="panel-chat-container" ref={chatContainerRef}>
      {messages.map((msg, index) => (
        <ChatMessageRow
          key={index}
          message={msg}
          isLoading={isLoading}
          onSelectionClick={onSelectionClick}
          onNegativeSubmit={onNegativeSubmit}
        />
      ))}
      {showIndicator && (
        <div className="panel-chat-row row-bot">
          <img src={showgy} alt="SHOW-GY" className="panel-chat-avatar" />
          <div className="panel-chat-message bot-message">
            <p>생각 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  );
}
