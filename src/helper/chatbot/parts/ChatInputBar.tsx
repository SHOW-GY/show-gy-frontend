import React from 'react';
import fileupload from '../../../assets/icons/fileupload.png';
import search from '../../../assets/icons/search.png';

interface ChatInputBarProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function ChatInputBar({
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyPress,
  disabled = false,
}: ChatInputBarProps) {
  return (
    <div className="panel-input-bar">
      <textarea
        className="panel-input-field"
        placeholder={disabled ? "위 선택지 중 하나를 선택해주세요" : "메시지를 입력하세요"}
        value={chatInput}
        onChange={(e) => onChatInputChange(e.target.value)}
        onKeyPress={onKeyPress}
        rows={1}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      <img 
        src={fileupload} 
        alt="파일 업로드" 
        className="panel-input-rect"
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', pointerEvents: disabled ? 'none' : 'auto' }}
      />
      <img 
        src={search} 
        alt="검색" 
        className="panel-input-square" 
        onClick={disabled ? undefined : onSendMessage}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', pointerEvents: disabled ? 'none' : 'auto' }}
      />
      <div 
        className="panel-input-plus"
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', pointerEvents: disabled ? 'none' : 'auto' }}
      >+</div>
    </div>
  );
}
