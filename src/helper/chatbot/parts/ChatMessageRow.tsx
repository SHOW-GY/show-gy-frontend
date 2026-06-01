import React from 'react';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatSelections } from './ChatSelections';
import { ChatNegatives } from './ChatNegatives';

interface ChatMessageRowProps {
  message: ChatMessage;
  isLoading: boolean;
  onSelectionClick: (keyId: string, sentence: string) => void;
  onNegativeSubmit: (deleteIds: number[]) => void;
}

export function ChatMessageRow({
  message,
  isLoading,
  onSelectionClick,
  onNegativeSubmit,
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
            onSubmit={onNegativeSubmit}
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
