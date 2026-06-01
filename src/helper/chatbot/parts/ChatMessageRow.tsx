import { useEffect, useState } from 'react';
import showgy from '../../../assets/image/showgy.png';
import { ChatMessage } from '../chatbot.types';
import { ChatSelections } from './ChatSelections';
import { ChatNegatives } from './ChatNegatives';
import { renderChatbotMarkdown } from '../utils/chatbotMarkdown';

interface ChatMessageRowProps {
  message: ChatMessage;
  isLoading: boolean;
  onSelectionClick: (keyId: string, sentence: string) => void;
  onNegativeSubmit: (deleteIds: number[]) => void;
}

/**
 * 봇 메시지: markdown + mermaid 자동 렌더 (코드 블록 -> SVG).
 * 사용자 메시지: 안전상 plain text 유지.
 */
function BotMessageContent({ content }: { content: string }) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    renderChatbotMarkdown(content).then((h) => {
      if (!cancelled) setHtml(h);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!html) {
    // 첫 페인트 또는 빈 응답: 원문 그대로 (깜박임 회피)
    return <p className="chat-message-text">{content}</p>;
  }
  return (
    <div
      className="chat-message-text chat-message-md"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
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
        {message.role === 'bot' ? (
          <BotMessageContent content={message.content} />
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
