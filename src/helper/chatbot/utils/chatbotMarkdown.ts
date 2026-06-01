/**
 * 챗봇 응답(말풍선)용 markdown + mermaid 렌더링 유틸.
 *
 * Center.tsx의 applyMarkdown은 Quill 인스턴스에 직접 쓰는 함수라 별도로 필요.
 * 여기서는 string -> HTML string 으로만 변환 (React가 dangerouslySetInnerHTML 로 박음).
 *
 * 주의: 봇 응답이므로 LLM 통제 하의 텍스트지만, 안전상 mermaid 외 raw HTML은
 *      marked 기본 escape 동작에 맡긴다.
 */
import { marked } from 'marked';
import mermaid from 'mermaid';

let mermaidReady = false;
function ensureMermaid() {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis' },
  });
  mermaidReady = true;
}

let mermaidCounter = 0;

// LLM 이 ```mermaid 펜스 없이 다이어그램 본문만 출력해도 잡기 위한 키워드 패턴.
// 줄 시작에서 이 키워드 중 하나가 보이면 그 블록 끝(다음 빈 줄 또는 한글 단락) 까지 mermaid 로 간주.
const MERMAID_KEYWORDS = [
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'stateDiagram',
  'erDiagram',
  'journey',
  'gantt',
  'pie',
  'gitGraph',
  'mindmap',
  'timeline',
  'quadrantChart',
  'requirementDiagram',
  'sankey-beta',
  'xychart-beta',
  'xyChart',
  'block-beta',
  'c4Context',
];

const MERMAID_FENCE_RE = /```mermaid\s*\n([\s\S]+?)\n```/g;
const MERMAID_FENCELESS_RE = new RegExp(
  '(^|\\n)(' + MERMAID_KEYWORDS.join('|') + ')[\\s\\S]*?(?=\\n\\s*\\n|\\n\\s*[가-힣A-Z][^\\n]*[\\.:!\\?]|$)',
  'g'
);

/**
 * 봇 메시지 문자열을 HTML 로 변환.
 * - ```mermaid 블록은 SVG 로 렌더 후 <img src="data:..."> 로 교체
 * - 펜스 없는 mermaid (xychart-beta, flowchart, pie ...) 도 자동 감지해 같은 처리
 * - 그 외 markdown 은 marked 기본 처리
 */
export async function renderChatbotMarkdown(content: string): Promise<string> {
  if (!content) return '';

  // 1. mermaid 블록을 placeholder 로 치환 (1) 정식 펜스 → (2) 펜스 없는 fallback
  const mermaidBlocks: string[] = [];
  let stripped = content.replace(MERMAID_FENCE_RE, (_m, code) => {
    const idx = mermaidBlocks.length;
    mermaidBlocks.push(code.trim());
    return `\n\n@@CHATBOT_MERMAID_${idx}@@\n\n`;
  });
  stripped = stripped.replace(MERMAID_FENCELESS_RE, (m, lead) => {
    const code = m.slice(lead.length).trim();
    if (!code) return m;
    const idx = mermaidBlocks.length;
    mermaidBlocks.push(code);
    return `${lead}\n\n@@CHATBOT_MERMAID_${idx}@@\n\n`;
  });

  // 2. mermaid -> SVG (병렬)
  const svgs: string[] = [];
  if (mermaidBlocks.length > 0) {
    ensureMermaid();
    for (let i = 0; i < mermaidBlocks.length; i++) {
      mermaidCounter += 1;
      try {
        const { svg } = await mermaid.render(
          `chatbot-mermaid-${mermaidCounter}`,
          mermaidBlocks[i]
        );
        const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        svgs.push(
          `<img src="${dataUrl}" alt="다이어그램" style="max-width:100%;display:block;margin:8px 0;" />`
        );
      } catch (e) {
        // 렌더 실패 시 원본 코드 그대로 표시
        const esc = mermaidBlocks[i].replace(/[<>&]/g, (c) =>
          ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c)
        );
        svgs.push(`<pre style="background:#0f0f15;padding:8px;border-radius:6px;font-size:12px;overflow:auto;"><code>${esc}</code></pre>`);
      }
    }
  }

  // 3. markdown -> HTML
  let html = await marked.parse(stripped, { breaks: true });

  // 4. placeholder -> SVG <img>
  if (svgs.length > 0) {
    html = html.replace(/<p>@@CHATBOT_MERMAID_(\d+)@@<\/p>/g, (_m, i) => svgs[parseInt(i, 10)] || '');
    html = html.replace(/@@CHATBOT_MERMAID_(\d+)@@/g, (_m, i) => svgs[parseInt(i, 10)] || '');
  }

  return html;
}
