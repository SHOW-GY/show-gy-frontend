import React from 'react';
import { marked } from 'marked';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatSelections } from './ChatSelections';
import { ChatNegatives } from './ChatNegatives';
import { ChatSteps } from './ChatSteps';

// marked 설정 — inline HTML 비허용, 줄바꿈 = <br>
marked.setOptions({ breaks: true, gfm: true });

function renderMarkdownToHtml(text: string): string {
  // ⟦FEEDBACK⟧ ... ⟦/FEEDBACK⟧ 마커 잔존 방어 — 어느 경로로 들어와도 (token 누적/final/history 복원) 노출 차단
  let cleaned = text || '';
  const mStart = cleaned.indexOf('⟦FEEDBACK⟧');
  if (mStart !== -1) cleaned = cleaned.slice(0, mStart).trimEnd();
  // 닫는 마커만 따로 남은 케이스도 처리
  const mEnd = cleaned.indexOf('⟦/FEEDBACK⟧');
  if (mEnd !== -1) cleaned = cleaned.slice(0, mEnd).trimEnd();
  try {
    const html = marked.parse(cleaned, { async: false }) as string;
    return html;
  } catch {
    return cleaned;
  }
}

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
        {message.role === 'bot' && message.steps && message.steps.length > 0 && (
          <ChatSteps steps={message.steps} />
        )}
        {message.role === 'bot' ? (
          // 봇 응답은 마크다운 렌더링 (별표/헤딩/리스트 처리)
          <div
            className="chat-message-text chat-message-markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(message.content) }}
          />
        ) : (
          <p className="chat-message-text">{message.content}</p>
        )}
        
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
