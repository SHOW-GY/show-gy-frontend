import { useState } from 'react';

interface Negative {
  sentence: string;
  reason: string;
  negativeId: number;
}

interface ChatNegativesProps {
  negatives: Negative[];
  isLoading: boolean;
  onSubmit: (deleteIds: number[]) => void;
}

export function ChatNegatives({ negatives, isLoading, onSubmit }: ChatNegativesProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    if (selected.size === 0 || submitted) return;
    setSubmitted(true);
    onSubmit(Array.from(selected));
  };

  const handleCancel = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit([]);
  };

  const allChecked = negatives.length > 0 && selected.size === negatives.length;
  const toggleAll = () => {
    if (submitted) return;
    setSelected(allChecked ? new Set() : new Set(negatives.map(n => n.negativeId)));
  };

  return (
    <div className="chat-negatives-container">
      <div className="chat-negative-toolbar">
        <label className="chat-negative-toggle-all">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            disabled={submitted || isLoading}
          />
          전체 선택
        </label>
        <span className="chat-negative-counter">
          {selected.size > 0 ? `${selected.size}개 선택됨` : '문장을 선택하세요'}
        </span>
      </div>

      {negatives.map((neg) => {
        const checked = selected.has(neg.negativeId);
        return (
          <label key={neg.negativeId} className={`chat-negative-item ${checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              className="chat-negative-checkbox"
              checked={checked}
              onChange={() => toggle(neg.negativeId)}
              disabled={submitted || isLoading}
            />
            <div className="chat-negative-body">
              <p className="chat-negative-sentence">
                <strong>삭제 후보:</strong> {neg.sentence}
              </p>
              <p className="chat-negative-reason">
                <em>이유: {neg.reason}</em>
              </p>
            </div>
          </label>
        );
      })}

      <div className="chat-negative-actions">
        <button
          onClick={handleDelete}
          disabled={selected.size === 0 || submitted || isLoading}
          className="chat-negative-button delete"
        >
          {selected.size > 0 ? `선택한 ${selected.size}개 삭제` : '선택한 문장 삭제'}
        </button>
        <button
          onClick={handleCancel}
          disabled={submitted || isLoading}
          className="chat-negative-button keep"
        >
          전체 보관
        </button>
      </div>

      {submitted && (
        <div className="chat-negatives-submitted">요청 전송됨</div>
      )}
    </div>
  );
}
