import React from 'react';
import fileupload from '../../../assets/icons/fileupload.png';
import search from '../../../assets/icons/search.png';

interface ChatInputBarProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function ChatInputBar({
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyPress,
}: ChatInputBarProps) {
  return (
    <div className="panel-input-bar">
      <textarea
        className="panel-input-field"
        placeholder="메시지를 입력하세요"
        value={chatInput}
        onChange={(e) => onChatInputChange(e.target.value)}
        onKeyPress={onKeyPress}
        rows={1}
      />
      <img 
        src={fileupload} 
        alt="파일 업로드" 
        className="panel-input-rect"
      />
      <img 
        src={search} 
        alt="검색" 
        className="panel-input-square" 
        onClick={onSendMessage}
      />
      <div className="panel-input-plus">+</div>
    </div>
  );
}
