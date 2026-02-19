import type Quill from "quill";
import { marked } from "marked";

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
