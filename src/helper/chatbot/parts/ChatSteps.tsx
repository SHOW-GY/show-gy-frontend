import React from 'react';
import { ChatStep } from '../chatbot.types';

interface ChatStepsProps {
  steps: ChatStep[];
}

/**
 * AI 사고 과정 표시 (ChatGPT/Claude 스타일).
 * 진행 중인 step 은 회색 spinner, 완료된 step 은 ✅ 체크.
 * 메시지 본문 위에 작게 누적 표시.
 */
function formatElapsed(ms?: number): string {
  if (ms == null) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ChatSteps({ steps }: ChatStepsProps) {
  return (
    <div className="chat-steps">
      {steps.map((step, idx) => (
        <div key={`${step.key}-${idx}`} className={`chat-step ${step.done ? 'done' : 'active'}`}>
          <span className="chat-step-icon">{step.done ? '✓' : '◌'}</span>
          <span className="chat-step-label">{step.label}</span>
          {step.done && step.elapsedMs != null && (
            <span className="chat-step-elapsed">{formatElapsed(step.elapsedMs)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
