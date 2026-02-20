import type Quill from "quill";
import { marked } from "marked";

{/*마크다운을 HTML로 변환하는 로직 */}
export async function applyMarkdown(
  quill: Quill,
  md: string,
  suppressRef: { current: boolean }
) {
  const html = await marked.parse(md);

  suppressRef.current = true;
  quill.setText("");
  quill.clipboard.dangerouslyPasteHTML(html);
  setTimeout(() => (suppressRef.current = false), 0);

  quill.focus();
}