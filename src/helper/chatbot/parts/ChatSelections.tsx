/**
 * ChatSelections - 선택지 목록 렌더링
 * ⚠️ 기존 렌더링 결과를 동일하게 유지 (인라인 스타일 -> CSS 클래스로 변환)
 */

import React from 'react';

interface Selection {
  key_id: string;
  main_topic_sentence: string;
}

interface ChatSelectionsProps {
  selections: Selection[];
  isLoading: boolean;
  onSelectionClick: (keyId: string, sentence: string) => void;
}

export function ChatSelections({ selections, isLoading, onSelectionClick }: ChatSelectionsProps) {
  return (
    <div className="chat-selections-container">
      {selections.map((sel) => (
        <button
          key={sel.key_id}
          onClick={() => onSelectionClick(sel.key_id, sel.main_topic_sentence)}
          disabled={isLoading}
          className="chat-selection-button"
        >
          {sel.main_topic_sentence}
        </button>
      ))}
    </div>
  );
}
