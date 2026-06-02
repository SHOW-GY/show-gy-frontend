import React, { useRef } from 'react';
import fileupload from '../../../assets/icons/fileupload.png';
import search from '../../../assets/icons/search.png';

// 첨부 직후 사용자에게 보여줄 추천 멘트. 클릭 시 input 자동 입력 + 해당 kind 자동 set.
// 사용자가 직접 입력해도 OK — AI 측이 query 보고 kind 추론 (apply_input_docs_tool 내부).
const ATTACHED_SUGGESTIONS: Array<{ text: string; kind: 'template' | 'content' }> = [
  { text: '이 문서 양식으로 변경해줘', kind: 'template' },
  { text: '이 논문 내용으로 변경해줘', kind: 'content' },
  { text: '이 보고서 형식으로 재배치해줘', kind: 'template' },
  { text: '본문을 이 파일 내용으로 통째 교체', kind: 'content' },
];

interface ChatInputBarProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  // 첨부 파일 — 사용자가 입력창 + 버튼으로 추가한 참고 문서
  attachedFileName?: string;
  // 첨부 문서 역할 — 'template' (구조만 차용) | 'content' (본문으로 통째 교체) | null (미선택)
  attachedKind?: 'template' | 'content' | null;
  onAttachKindChange?: (kind: 'template' | 'content') => void;
  onAttachFile?: (file: File) => void;
  onRemoveAttachment?: () => void;
}

export function ChatInputBar({
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyPress,
  attachedFileName,
  attachedKind,
  onAttachKindChange,
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
          <div className="panel-attached-file-row">
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
          <div className="panel-attached-suggestions">
            <span className="panel-attached-suggestions-label">💡 이렇게 요청해 보세요:</span>
            <div className="panel-attached-suggestions-row">
              {ATTACHED_SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  className={`panel-attached-suggestion ${attachedKind === s.kind ? 'used' : ''}`}
                  onClick={() => {
                    onChatInputChange(s.text);
                    onAttachKindChange?.(s.kind);
                  }}
                  title={s.kind === 'template' ? '양식만 차용 (본문 내용 유지)' : '본문을 첨부 내용으로 통째 교체'}
                >
                  {s.text}
                </button>
              ))}
            </div>
            <span className="panel-attached-suggestions-hint">
              직접 입력하셔도 됩니다. (예: "이 보고서 양식으로 정리해줘")
            </span>
          </div>
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
