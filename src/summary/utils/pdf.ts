import type Quill from "quill";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";

type Margins = { top: number; bottom: number; left: number; right: number };

export async function exportPdf(quill: Quill, margins: Margins, fontSize: number) {
  const html = quill.root.innerHTML;

  const wrapper = document.createElement("div");
  wrapper.id = "pdf-wrapper";
  wrapper.className = "ql-snow";

  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.background = "#fff";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "9999";
  wrapper.style.display = "block";
  wrapper.style.height = "auto";
  wrapper.style.overflow = "visible";

  const editor = document.createElement("div");
  editor.className = "ql-editor";
  editor.innerHTML = html;

  editor.style.setProperty("display", "block", "important");
  editor.style.setProperty("height", "auto", "important");
  editor.style.setProperty("min-height", "1px", "important");
  editor.style.setProperty("overflow", "visible", "important");

  editor.style.padding = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;
  editor.style.fontSize = `${fontSize}px`;

  wrapper.appendChild(editor);
  document.body.appendChild(wrapper);

  void wrapper.offsetHeight;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  if (await (document as any).fonts?.ready) await (document as any).fonts.ready;

  try {
    const worker = html2pdf()
      .from(wrapper)
      .set({
        margin: 10,
        filename: "document.pdf",
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          avoid: ["p", "li", "pre", "blockquote", "table", "img", "h1", "h2", "h3", "hr"],
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0,
          windowWidth: 794,
          onclone: (clonedDoc: Document) => {
            const style = clonedDoc.createElement("style");
            style.textContent = `
              html, body { height: auto !important; overflow: visible !important; }
              .ql-container, .ql-snow, .ql-editor { height: auto !important; overflow: visible !important; }
              .ql-editor { min-height: 1px !important; display: block !important; }

              .ql-editor p,
              .ql-editor li,
              .ql-editor blockquote,
              .ql-editor pre,
              .ql-editor table,
              .ql-editor img,
              .ql-editor h1,
              .ql-editor h2,
              .ql-editor h3 {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                break-after: avoid !important;
                page-break-after: avoid !important;
              }

              #pdf-wrapper { position: static !important; display: block !important; }

              .ql-editor ol,
              .ql-editor ul {
                padding-left: 1.6em !important;
                margin: 0.4em 0 !important;
              }

              .ql-editor ol > li { list-style-type: decimal !important; }
              .ql-editor ul > li { list-style-type: disc !important; }

              .ql-editor li::before { content: none !important; }
              .ql-editor li > .ql-ui { display: none !important; }

              .ql-editor ol, .ql-editor ul,
              .ql-editor li {
                list-style: initial !important;
              }
            `;
            clonedDoc.head.appendChild(style);

            const w = clonedDoc.getElementById("pdf-wrapper") as HTMLElement | null;
            if (!w) return;
            w.style.position = "static";
            w.style.display = "block";
            w.style.height = "auto";
            w.style.overflow = "visible";
            w.style.background = "#fff";
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any)
      .toPdf();

    const blob = (await worker.output("blob")) as Blob;
    saveAs(blob, "document.pdf");
  } finally {
    document.body.removeChild(wrapper);
  }
}
