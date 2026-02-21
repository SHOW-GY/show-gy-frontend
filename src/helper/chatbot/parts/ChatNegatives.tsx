/**
 * ChatNegatives - 삭제 제안 목록 렌더링
 * ⚠️ 기존 렌더링 결과를 동일하게 유지 (인라인 스타일 -> CSS 클래스로 변환)
 */

import React from 'react';

interface Negative {
  sentence: string;
  reason: string;
  negativeId: number;
}

interface ChatNegativesProps {
  negatives: Negative[];
  isLoading: boolean;
  onNegativeClick: (negativeId: number, action: 'delete' | 'keep') => void;
}

export function ChatNegatives({ negatives, isLoading, onNegativeClick }: ChatNegativesProps) {
  return (
    <div className="chat-negatives-container">
      {negatives.map((neg, idx) => (
        <div key={idx} className="chat-negative-item">
          <p className="chat-negative-sentence">
            <strong>삭제 제안:</strong> {neg.sentence}
          </p>
          <p className="chat-negative-reason">
            <em>이유: {neg.reason}</em>
          </p>
          <div className="chat-negative-buttons">
            <button
              onClick={() => onNegativeClick(neg.negativeId, 'delete')}
              disabled={isLoading}
              className="chat-negative-button delete"
            >
              삭제
            </button>
            <button
              onClick={() => onNegativeClick(neg.negativeId, 'keep')}
              disabled={isLoading}
              className="chat-negative-button keep"
            >
              보관
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
