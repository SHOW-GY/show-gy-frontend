/**
 * ChatMessageRow - 개별 메시지 행 렌더링
 * ⚠️ 기존 렌더링 결과를 동일하게 유지
 */

import React from 'react';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatSelections } from './ChatSelections';
import { ChatNegatives } from './ChatNegatives';

interface ChatMessageRowProps {
  message: ChatMessage;
  isLoading: boolean;
  onSelectionClick: (keyId: string, sentence: string) => void;
  onNegativeClick: (negativeId: number, action: 'delete' | 'keep') => void;
}

export function ChatMessageRow({
  message,
  isLoading,
  onSelectionClick,
  onNegativeClick,
}: ChatMessageRowProps) {
  return (
    <div className={`panel-chat-row ${message.role === 'user' ? 'row-user' : 'row-bot'}`}>
      {message.role === 'bot' && (
        <img
          src={showgy}
          alt="SHOW-GY"
          className="panel-chat-avatar"
        />
      )}
      <div className={`panel-chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
        <p className="chat-message-text">{message.content}</p>
        
        {message.negatives && message.negatives.length > 0 && (
          <ChatNegatives
            negatives={message.negatives}
            isLoading={isLoading}
            onNegativeClick={onNegativeClick}
          />
        )}

        {message.selections && message.selections.length > 0 && (
          <ChatSelections
            selections={message.selections}
            isLoading={isLoading}
            onSelectionClick={onSelectionClick}
          />
        )}
      </div>
    </div>
  );
}
