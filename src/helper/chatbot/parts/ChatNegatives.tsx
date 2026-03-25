import React, { useState } from 'react';

interface Negative {
  sentence: string;
  reason: string;
  negativeId: number;
}

interface ChatNegativesProps {
  negatives: Negative[];
  isLoading: boolean;
  onNegativeConfirm: (selectedIds: number[]) => void;
}

export function ChatNegatives({ negatives, isLoading, onNegativeConfirm }: ChatNegativesProps) {
  // 기본: 전체 선택 (삭제 대상)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(
    () => new Set(negatives.map(n => n.negativeId))
  );
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onNegativeConfirm(Array.from(checkedIds));
  };

  return (
    <div className="chat-negatives-container">
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 8 }}>
        삭제할 문장을 선택하고 "편집 진행"을 눌러주세요. 유지할 문장은 체크 해제하세요.
      </p>
      {negatives.map((neg, idx) => (
        <label
          key={idx}
          className="chat-negative-item"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '8px 0',
            cursor: confirmed ? 'default' : 'pointer',
            opacity: confirmed && !checkedIds.has(neg.negativeId) ? 0.5 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={checkedIds.has(neg.negativeId)}
            onChange={() => toggle(neg.negativeId)}
            disabled={isLoading || confirmed}
            style={{ marginTop: 4, accentColor: '#e74c3c' }}
          />
          <div>
            <p className="chat-negative-sentence" style={{ margin: 0 }}>
              {neg.sentence}
            </p>
            <p className="chat-negative-reason" style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#888' }}>
              <em>이유: {neg.reason}</em>
            </p>
          </div>
        </label>
      ))}
      {!confirmed && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            onClick={handleConfirm}
            disabled={isLoading || checkedIds.size === 0}
            className="chat-negative-button delete"
            style={{ flex: 1, padding: '8px 0', fontWeight: 'bold' }}
          >
            편집 진행 ({checkedIds.size}개 삭제)
          </button>
          <button
            onClick={() => { setConfirmed(true); onNegativeConfirm([]); }}
            disabled={isLoading}
            className="chat-negative-button skip"
            style={{ flex: 1, padding: '8px 0', fontWeight: 'bold', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            건너뛰기
          </button>
        </div>
      )}
      {confirmed && (
        <p style={{ fontSize: '0.85rem', color: '#2ecc71', marginTop: 8 }}>
          {checkedIds.size > 0 ? `${checkedIds.size}개 문장 삭제 요청 완료` : '수정 없이 건너뛰었습니다'}
        </p>
      )}
    </div>
  );
}
