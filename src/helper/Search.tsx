export interface ReferenceSource {
  title?: string;
  url: string;
  source?: "google" | "naver" | "jina" | string;
  snippet?: string;
}

interface SearchProps {
  sources?: ReferenceSource[];
}

const SOURCE_COLORS: Record<string, string> = {
  google: "#4285F4",
  naver: "#03C75A",
  jina: "#9b59b6",
};

export default function Search({ sources = [] }: SearchProps) {
  if (!sources.length) {
    return (
      <div className="panel-search-empty" style={{ padding: 20, color: "#aaa", lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          주제 분석 시 사용한 검색 결과가 여기에 표시됩니다.
          <br />
          챗봇에게 <span style={{ color: "#fff" }}>"이 문서 분석해줘"</span> 같은 요청을 해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-search" style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 12, color: "#fff", fontSize: 14, fontWeight: 600 }}>
        참고자료 ({sources.length}건)
      </div>
      {sources.map((src, idx) => {
        const sourceLabel = (src.source || "web").toUpperCase();
        const color = SOURCE_COLORS[(src.source || "").toLowerCase()] || "#888";
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  background: color,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}
              >
                {sourceLabel}
              </span>
              {src.title && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={src.title}
                >
                  {src.title}
                </a>
              )}
            </div>
            {src.snippet && (
              <p style={{ color: "#bbb", fontSize: 12, lineHeight: 1.5, margin: "0 0 6px" }}>
                {src.snippet}
              </p>
            )}
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#80c8ff",
                fontSize: 11,
                textDecoration: "none",
                display: "inline-block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
              title={src.url}
            >
              {src.url}
            </a>
          </div>
        );
      })}
    </div>
  );
}
