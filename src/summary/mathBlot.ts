import Quill from "quill";
import katex from "katex";
import "katex/dist/katex.min.css";

const Q: any = (Quill as any).default ?? Quill;
const BlockEmbed = Q.import("blots/block/embed");

{ /*수식 블록을 렌더링하는 로직 */ }
export function renderKatexHtml(tex: string) {
  const safe = (tex || "").trim();
  if (!safe) {
    return "<span class=\"sg-math-placeholder\">수식 입력</span>";
  }
  try {
    return katex.renderToString(safe, {
      displayMode: true,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return "<span class=\"sg-math-error\">Invalid TeX</span>";
  }
}

{ /*수식 블록을 정의하는 로직 */ }
export class SgMathBlockBlot extends BlockEmbed {
  static blotName = "sg-math-block";
  static tagName = "div";
  static className = "sg-math-block";

  static create(value: any) {
    const node = super.create() as HTMLElement;
    const tex = (value?.tex ?? "").toString();

    node.setAttribute("data-tex", tex);
    node.setAttribute("contenteditable", "false");
    node.innerHTML = renderKatexHtml(tex);
    return node;
  }

  static value(node: HTMLElement) {
    return { tex: node.getAttribute("data-tex") || "" };
  }
}
