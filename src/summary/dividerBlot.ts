import Quill from "quill";

const Q: any = (Quill as any).default ?? Quill;
const BlockEmbed = Q.import("blots/block/embed");

/**
 * SgDividerBlot — 섹션 구분용 가로선 (Quill BlockEmbed).
 *
 * Delta op 형식: `{ insert: { divider: true } }`
 *
 * 콘텐츠로 박히는 1급 블록이라:
 *  - 사용자가 Backspace 로 지울 수 있음
 *  - PDF export / 외부 뷰어 어디서나 보존
 *  - LLM 의존 X — backend delta converter 가 자동 삽입
 *
 * 시각 스타일은 `summary.css` 의 `hr.sg-divider` 규칙에서 정의.
 */
export class SgDividerBlot extends BlockEmbed {
  static blotName = "divider";
  static tagName = "hr";
  static className = "sg-divider";

  static create(_value?: any) {
    const node = super.create() as HTMLElement;
    node.setAttribute("contenteditable", "false");
    return node;
  }

  static value(_node: HTMLElement): Record<string, unknown> {
    // Quill 2.x: delta 직렬화 시 {insert: {divider: {...}}} 로 복원됨.
    // 빈 객체로 두어 backend 의 {divider: true} / {divider: {}} 둘 다 호환.
    return {};
  }
}
