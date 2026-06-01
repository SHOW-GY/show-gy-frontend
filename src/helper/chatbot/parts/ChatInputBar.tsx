import React, { useRef } from 'react';
import fileupload from '../../../assets/icons/fileupload.png';
import search from '../../../assets/icons/search.png';

interface ChatInputBarProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  // 첨부 파일 — 사용자가 입력창 + 버튼으로 추가한 참고 문서
  attachedFileName?: string;
  onAttachFile?: (file: File) => void;
  onRemoveAttachment?: () => void;
}

export function ChatInputBar({
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyPress,
  attachedFileName,
  onAttachFile,
  onRemoveAttachment,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
    // 같은 파일 다시 첨부 가능하게 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="panel-input-bar-wrap">
      {attachedFileName && (
        <div className="panel-attached-file">
          <span className="panel-attached-file-name">📎 {attachedFileName}</span>
          <button
            type="button"
            className="panel-attached-file-remove"
            onClick={onRemoveAttachment}
            aria-label="첨부 제거"
          >
            ×
          </button>
        </div>
      )}
      <div className="panel-input-bar">
        <textarea
          className="panel-input-field"
          placeholder={attachedFileName ? '첨부 문서 기준으로 요청을 입력하세요' : '메시지를 입력하세요'}
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          rows={1}
        />
        <img
          src={fileupload}
          alt="파일 업로드"
          className="panel-input-rect"
          onClick={handlePlusClick}
          style={{ cursor: 'pointer' }}
        />
        <img
          src={search}
          alt="검색"
          className="panel-input-square"
          onClick={onSendMessage}
        />
        <div
          className="panel-input-plus"
          onClick={handlePlusClick}
          style={{ cursor: 'pointer' }}
        >
          +
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
