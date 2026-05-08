import { useState } from "react";

export interface FeedbackItem {
  sentence: string;
  reason: string;
}

interface FeedbackProps {
  items?: FeedbackItem[];
}

export default function Feedback({ items = [] }: FeedbackProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!items.length) {
    return (
      <div className="panel-feedback-empty" style={{ padding: 20, color: "#aaa", lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          부정문 선정 결과가 여기에 표시됩니다.
          <br />
          챗봇에게 <span style={{ color: "#fff" }}>"이상한 문장 찾아줘"</span> 같은 요청을 해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-feedback" style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 12, color: "#fff", fontSize: 14, fontWeight: 600 }}>
        부정문 선정 사유 ({items.length}건)
      </div>
      {items.map((item, idx) => {
        const isOpen = expanded.has(idx);
        return (
          <div
            key={idx}
            style={{
              marginBottom: 10,
              padding: 12,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 13,
                lineHeight: 1.5,
                cursor: "pointer",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
              onClick={() => toggle(idx)}
            >
              <span style={{ color: "#ff9b9b", fontWeight: 600, flexShrink: 0 }}>
                #{idx + 1}
              </span>
              <span style={{ flex: 1 }}>{item.sentence}</span>
              <span style={{ color: "#888", fontSize: 11, flexShrink: 0 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </div>
            {isOpen && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px dashed rgba(255,255,255,0.15)",
                  color: "#bbb",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "#80c8ff", fontWeight: 600 }}>사유:</span> {item.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
