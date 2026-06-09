import type Quill from "quill";
import { marked } from "marked";
import mermaid from "mermaid";
import { normalizeTableHtml } from "./normalizeTableHtml";
import { ensureAllColGroups } from "../table/tableHelpers";

// mention 트리거 문자(@, #) 회피 + 마크다운 특수문자 회피
const MATH_PLACEHOLDER_PREFIX = "ZZSGMATHBLOCKZZ";
const MATH_PLACEHOLDER_SUFFIX = "ZZENDMATHBLOCKZZ";

// mermaid 초기화 (lazy: 한 번만)
let mermaidInitialized = false;
function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    flowchart: { htmlLabels: true, curve: "basis" },
  });
  mermaidInitialized = true;
}

{/* 마크다운을 HTML로 변환하는 로직 */}
export async function applyMarkdown(
  quill: Quill,
  md: string,
  suppressRef: { current: boolean }
) {
  // 0. 마크다운 표 normalize — LLM 응답에 헤더 행과 구분자/데이터 행 사이 빈 줄이 끼면
  //    marked 가 표를 두 개로 잘라서 헤더만 별도 작은 표로 보임. 빈 줄 제거.
  let normalizedMd = md;
  // 패턴 1: | header | header |\n\n| --- | --- |  → 빈 줄 제거
  normalizedMd = normalizedMd.replace(/(\|[^\n]+\|)\s*\n\s*\n(\s*\|[\s|:-]+\|)/g, "$1\n$2");
  // 패턴 2: | header | header |\n\n| data | data |  → 빈 줄 제거 (구분자 누락 시 fallback)
  normalizedMd = normalizedMd.replace(/(\|[^\n]+\|)\s*\n\s*\n(\s*\|[^\n]+\|)/g, "$1\n$2");

  // 1. $$...$$ 수식 블록을 placeholder로 치환 (marked가 처리 못하므로)
  const mathBlocks: string[] = [];
  const processedMd = normalizedMd.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex) => {
    const idx = mathBlocks.length;
    mathBlocks.push(tex.trim());
    return `${MATH_PLACEHOLDER_PREFIX}${idx}${MATH_PLACEHOLDER_SUFFIX}`;
  });

  // 2. ```mermaid 코드 블록을 감지해서 SVG로 변환 후 <img>로 교체
  const mermaidBlocks: string[] = [];
  const mermaidProcessed = processedMd.replace(
    /```mermaid\s*\n([\s\S]+?)\n```/g,
    (_match, code) => {
      const idx = mermaidBlocks.length;
      mermaidBlocks.push(code.trim());
      return `\n\n@@MERMAID_${idx}@@\n\n`;
    }
  );

  // mermaid → SVG 렌더링 (병렬)
  const mermaidSvgs: string[] = [];
  if (mermaidBlocks.length > 0) {
    ensureMermaidInit();
    for (let i = 0; i < mermaidBlocks.length; i++) {
      try {
        const { svg } = await mermaid.render(
          `sg-mermaid-${Date.now()}-${i}`,
          mermaidBlocks[i]
        );
        // SVG를 data URL로 변환해서 <img>로 사용
        const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        mermaidSvgs.push(`<p><img src="${dataUrl}" alt="다이어그램" style="max-width:100%;" /></p>`);
      } catch (e) {
        console.error("mermaid 렌더링 실패:", e);
        mermaidSvgs.push(`<pre><code>${mermaidBlocks[i].replace(/[<>&]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c] || c))}</code></pre>`);
      }
    }
  }

  // 마크다운 → HTML 변환
  let html = await marked.parse(mermaidProcessed);

  // 표 정규화 — Quill 내장 table 모듈이 못 다루는 thead/th 를 단일 tbody+td 로 평탄화.
  // (안 하면 헤더 행이 본문 표와 분리돼 별도 셀로 떨어져 나옴)
  html = normalizeTableHtml(html);

  // mermaid placeholder를 SVG <img>로 교체
  if (mermaidSvgs.length > 0) {
    html = html.replace(/<p>@@MERMAID_(\d+)@@<\/p>/g, (_m, i) => mermaidSvgs[parseInt(i, 10)] || "");
    // marked가 placeholder를 별도로 wrap 안 한 경우도 처리
    html = html.replace(/@@MERMAID_(\d+)@@/g, (_m, i) => mermaidSvgs[parseInt(i, 10)] || "");
  }

  suppressRef.current = true;
  quill.setText("");
  quill.clipboard.dangerouslyPasteHTML(html);

  // 3. 수식 placeholder를 찾아서 sg-math-block embed로 교체
  if (mathBlocks.length > 0) {
    const placeholderRegex = new RegExp(
      `${MATH_PLACEHOLDER_PREFIX}(\\d+)${MATH_PLACEHOLDER_SUFFIX}`
    );
    let safety = 500;
    while (safety-- > 0) {
      const text = quill.getText();
      const match = text.match(placeholderRegex);
      if (!match || match.index === undefined) break;

      const matchedStr = match[0];
      const blockIdx = parseInt(match[1], 10);
      quill.deleteText(match.index, matchedStr.length);

      let tex = mathBlocks[blockIdx] || "";
      if (tex.startsWith("\\text{") && tex.endsWith("}")) {
        tex = "";
      }
      quill.insertEmbed(match.index, "sg-math-block", { tex });
    }
  }

  // 표 colgroup 즉시 확정 — hover 시점에 auto→fixed 로 스냅되는 레이아웃 점프 방지.
  requestAnimationFrame(() => ensureAllColGroups(quill.root as HTMLElement));

  setTimeout(() => (suppressRef.current = false), 0);

  quill.focus();
}