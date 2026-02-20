import type Quill from "quill";
import type { SlashItemId } from "./slashItems";

{/*슬래시 명령어 실행하는 로직 */ }
export type SlashCommandHelpers = {
  pickImageFile: () => Promise<File | null>;
  readAsDataURL: (file: File) => Promise<string>;
  insert3x3Table: (q: Quill) => void;
};

{/*슬래시 명령어 실행하는 로직 */ }
export async function runSlashCommand(
  q: Quill,
  cmd: SlashItemId | string,
  helpers: SlashCommandHelpers
) {
  const range = q.getSelection(true);
  if (!range) return;

  const before = q.getText(Math.max(0, range.index - 50), 50);
  const lastSlash = before.lastIndexOf("/");
  if (lastSlash !== -1) {
    const delLen = before.length - lastSlash;
    q.deleteText(range.index - delLen, delLen, "user");
  }

  const insertAt = q.getSelection(true)?.index ?? range.index;

  if (cmd === "text") {
    q.insertText(insertAt, "\n", "user");
    q.formatLine(insertAt, 1, "blockquote", true, "user");
    q.setSelection(insertAt + 1, 0, "silent");
    return;
  }

  if (cmd === "code") {
    q.insertText(insertAt, "\n", "user");
    q.formatLine(insertAt, 1, "code-block", true, "user");
    q.setSelection(insertAt + 1, 0, "silent");
    return;
  }

  if (cmd === "image") {
    const file = await helpers.pickImageFile();
    if (!file) return;
    const url = await helpers.readAsDataURL(file);
    q.insertEmbed(insertAt, "image", url, "user");
    q.insertText(insertAt + 1, "\n", "user");
    q.setSelection(insertAt + 2, 0, "silent");
    return;
  }

  if (cmd === "math") {
    q.insertEmbed(insertAt, "sg-math-block", { tex: "" }, "user");
    q.insertText(insertAt + 1, "\n", "user");
    q.setSelection(insertAt + 2, 0, "silent");

    requestAnimationFrame(() => {
      const root = q.root as HTMLElement;
      const nodes = root.querySelectorAll(".sg-math-block");
      const last = nodes[nodes.length - 1] as HTMLElement | undefined;
      if (!last) return;
      last.scrollIntoView({ block: "nearest" });
      last.click();
    });

    return;
  }

  if (cmd === "table") {
    helpers.insert3x3Table(q);
  }
}
