import { useEffect } from "react";
import type { RefObject, MutableRefObject, Dispatch, SetStateAction } from "react";
import type Quill from "quill";
import QuillMarkdown from "quilljs-markdown";
import { Q } from "../setupQuill";
import { SLASH_ITEMS } from "../slashItems";
import { runSlashCommand } from "../runSlashCommand";
import { attachTableInteractions } from "../table/tableAttach";
import { isCursorInTable, isCursorInCodeBlock, isCursorInTextBlock } from "../table/tableHelpers";
import { detectAndConvertTableSyntax, detectAndConvertMathSyntax } from "../table/parseTableSyntax";

type TableModule = {
  insertTable: (rows: number, cols: number) => void;
};

type UseQuillInitArgs = {
  editorRef: RefObject<HTMLDivElement>;
  quillRef: MutableRefObject<Quill | null>;
  lastFocusedQuillRef: MutableRefObject<Quill | null>;
  suppressRef: MutableRefObject<boolean>;
  setTablePlus: Dispatch<SetStateAction<any>>;
  hoveredTableRef: MutableRefObject<HTMLTableElement | null>;
  tableApiRef: MutableRefObject<{
    addRow?: (where: "above" | "below") => void;
    addCol?: (where: "left" | "right") => void;
    refresh?: () => void;
  }>;
  mathOpenRef: MutableRefObject<boolean>;
  mathTargetElRef: MutableRefObject<HTMLElement | null>;
  mathPrevTexRef: MutableRefObject<string>;
  mathInputRef: MutableRefObject<HTMLTextAreaElement | null>;
  setMathTex: Dispatch<SetStateAction<string>>;
  setMathPos: Dispatch<SetStateAction<{ top: number; left: number }>>;
  setMathOpen: Dispatch<SetStateAction<boolean>>;
  setShowFloating: Dispatch<SetStateAction<boolean>>;
  setFloatingPos: Dispatch<SetStateAction<{ top: number; left: number }>>;
  setFtMenu: Dispatch<SetStateAction<any>>;
  setFontLabel: Dispatch<SetStateAction<string>>;
  setIsBoldActive: Dispatch<SetStateAction<boolean>>;
  setIsUnderlineActive: Dispatch<SetStateAction<boolean>>;
  setIsItalicActive: Dispatch<SetStateAction<boolean>>;
  savedRangeRef: MutableRefObject<{ index: number; length: number } | null>;
  setDocumentText: Dispatch<SetStateAction<string>>;
  getUniformFontInRange: (quill: Quill, index: number, length: number) => string | null;
};

export function useQuillInit({
  editorRef,
  quillRef,
  lastFocusedQuillRef,
  suppressRef,
  setTablePlus,
  hoveredTableRef,
  tableApiRef,
  mathOpenRef,
  mathTargetElRef,
  mathPrevTexRef,
  mathInputRef,
  setMathTex,
  setMathPos,
  setMathOpen,
  setShowFloating,
  setFloatingPos,
  setFtMenu,
  setFontLabel,
  setIsBoldActive,
  setIsUnderlineActive,
  setIsItalicActive,
  savedRangeRef,
  setDocumentText,
  getUniformFontInRange,
}: UseQuillInitArgs) {
  useEffect(() => {
    const el = editorRef.current;
    if (!el || quillRef.current) return;

    {/*이미지 생성*/}
    const pickImageFile = (): Promise<File | null> =>
      new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });
    
    {/*base64로 변환*/}
    const readAsDataURL = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    
    {/*표 삽입 로직*/}
    const insert3x3Table = (q: Quill) => {
      const tb = q.getModule("table") as TableModule | null;
      if (!tb) return;
      tb.insertTable(3, 3);
      q.setSelection(q.getLength() - 1, 0, Q.sources.SILENT);
    };

    let quill: any;
    try {
      quill = new Q(el, {
        theme: "snow",
        modules: {
          table: true,
          toolbar: false,
          imageResize: {},
          history: {
            delay: 1000,
            maxStack: 200,
            userOnly: true,
          },
          keyboard: {
            bindings: {},
          },
          mention: {
            mentionDenotationChars: ["/"],
            showDenotationChar: true,
            minChars: 0,
            allowedChars: /^[A-Za-z]*$/,
            positioningStrategy: "fixed",

            source: (searchTerm: string, renderList: any) => {
              // 표, 코드블록, 텍스트블록 안에서는 드롭다운 미표시
              if (isCursorInTable(quill) || isCursorInCodeBlock(quill) || isCursorInTextBlock(quill)) {
                renderList([], searchTerm);
                return;
              }

              const term = (searchTerm || "").toLowerCase();
              const list = SLASH_ITEMS
                .filter((it) => it.id.startsWith(term) || it.value.includes(searchTerm))
                .map((it) => ({
                  id: it.id,
                  value: it.value,
                  denotationChar: "/",
                  desc: it.desc,
                }));
              renderList(list, searchTerm);
            },

            renderItem: (item: any) => {
              const div = document.createElement("div");
              div.className = "sg-slash-item";
              div.innerHTML = `\n                <div class="sg-slash-title">${item.value}</div>\n              `;
              return div;
            },

            onSelect: (item: any) => {
              requestAnimationFrame(() =>
                runSlashCommand(quill, item.id, {
                  pickImageFile,
                  readAsDataURL,
                  insert3x3Table,
                })
              );
            },
          },
        },
        formats: [
          "size",
          "font",
          "bold",
          "italic",
          "underline",
          "color",
          "align",
          "header",
          "list",
          "blockquote",
          "code-block",
          "image",
          "sg-math-block",
          "table",
        ],
        placeholder: "",
      } as any);
    } catch (err) {
      return;
    }

    {/* '/'를 했을때 드롭다운 나오게 하는 로직 */}
    quill.keyboard.addBinding({ key: 13 }, () => {
      const range = quill.getSelection(true);
      if (!range) return true;

      const before = quill.getText(Math.max(0, range.index - 50), 50);
      const m = before.match(/\/(math|code|text|image|table)$/i);
      if (!m) return true;

      const cmd = m[1].toLowerCase();
      void runSlashCommand(quill, cmd, {
        pickImageFile,
        readAsDataURL,
        insert3x3Table,
      });
      return false;
    });

    new QuillMarkdown(quill, {});

    quill.root.style.paddingTop = "8px";

    quillRef.current = quill;
    lastFocusedQuillRef.current = quill;
    
    {/*quill에서 표 관련 인터랙션 붙이는 로직*/}
    const detachTable = attachTableInteractions({
      quill,
      hoveredTableRef,
      setTablePlus,
      tableApiRef,
      mathOpenRef,
    });

    {/*수식 입력 인터랙션 붙이는 로직*/}
    const onRootClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.(".sg-math-block") as HTMLElement | null;
      if (!t) return;

      const anchorEl = document.querySelector(".center-document") as HTMLElement | null;
      if (!anchorEl) return;

      const a = anchorEl.getBoundingClientRect();
      const r = t.getBoundingClientRect();

      const tex = t.getAttribute("data-tex") || "";
      mathTargetElRef.current = t;
      mathPrevTexRef.current = tex;

      setMathTex(tex);
      setMathPos({
        top: r.bottom - a.top + 200,
        left: r.left - a.left,
      });
      setMathOpen(true);
      mathOpenRef.current = true;

      requestAnimationFrame(() => {
        mathInputRef.current?.focus();
        mathInputRef.current?.setSelectionRange(tex.length, tex.length);
      });
    };

    {/* quill에서 포커스 변경, 텍스트 변경 감지하는 로직 */}
    quill.root.addEventListener("click", onRootClick);
    
    {/* 브라우저 네이티브 selectionchange로 추가 감지 */}
    const handleNativeSelectionChange = () => {
      const nativeSelection = window.getSelection();
      const nativeText = nativeSelection?.toString() || "";
      
      if (nativeText.length > 0) {
        const quillRange = quill.getSelection();
        if (!quillRange || quillRange.length === 0) {
          
          if (mathOpenRef.current) return;
          if (!nativeSelection || nativeSelection.rangeCount === 0) return;
          
          const nativeRange = nativeSelection.getRangeAt(0);
          const container = nativeRange.commonAncestorContainer;
          const parentElement = container.nodeType === Node.TEXT_NODE 
            ? container.parentElement 
            : container as HTMLElement;
          
          if (parentElement?.closest('.sg-math-block')) return;
          if (parentElement?.closest('table')) return;
          if (parentElement?.closest('.ql-code-block-container')) return;
          if (parentElement?.closest('pre')) return;
          const rect = nativeRange.getBoundingClientRect();
          const anchorEl = document.querySelector(".center-document") as HTMLElement | null;
          const editorEl = editorRef.current;
          
          if (!anchorEl || !editorEl) return;
          
          const anchorRect = anchorEl.getBoundingClientRect();
          const editorRect = editorEl.getBoundingClientRect();
          const finalBounds = {
            top: rect.top - editorRect.top,
            left: rect.left - editorRect.left,
            bottom: rect.bottom - editorRect.top,
            right: rect.right - editorRect.left,
            width: rect.width,
            height: rect.height,
          };
          
          const editorOffsetTop = editorRect.top - anchorRect.top;
          const editorOffsetLeft = editorRect.left - anchorRect.left;
          const GAP = 10;
          const top = editorOffsetTop + finalBounds.bottom + GAP;
          const left = editorOffsetLeft + finalBounds.left + finalBounds.width / 2;
          const toolbarW = 280;
          let clampedLeft = left;
          clampedLeft = Math.max(toolbarW / 2 + 12, clampedLeft);
          clampedLeft = Math.min(anchorEl.clientWidth - toolbarW / 2 - 12, clampedLeft);
          
          setFloatingPos({ top, left: clampedLeft });
          setShowFloating(true);
          savedRangeRef.current = { index: 0, length: nativeText.length };
        }
      }
    };
    
    document.addEventListener("selectionchange", handleNativeSelectionChange);
    
    quill.on("selection-change", (range: any) => {
      if (mathOpenRef.current) return;

      lastFocusedQuillRef.current = quill;

      if (!range) {
        setFtMenu(null);
        setShowFloating(false);
        savedRangeRef.current = null;
        setIsBoldActive(false);
        setIsUnderlineActive(false);
        setIsItalicActive(false);
        setFontLabel("");
        return;
      }

      const format = quill.getFormat(range.index, range.length);
      setIsBoldActive(!!format.bold);
      setIsUnderlineActive(!!format.underline);
      setIsItalicActive(!!format.italic);

      if (range.length === 0) {
        setFtMenu(null);
        setShowFloating(false);
        savedRangeRef.current = null;

        const f = (quill.getFormat(range).font as string | undefined) ?? "";
        setFontLabel(f);
        return;
      }
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const nativeRange = nativeSelection.getRangeAt(0);
        const container = nativeRange.commonAncestorContainer;
        const parentElement = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement;
        
        if (parentElement?.closest('.sg-math-block')) return;
        if (parentElement?.closest('table')) return;
        if (parentElement?.closest('.ql-code-block-container')) return;
        if (parentElement?.closest('pre')) return;
      }

      savedRangeRef.current = { index: range.index, length: range.length };

      const uniform = getUniformFontInRange(quill, range.index, range.length);
      setFontLabel(uniform ?? "");
      const bounds = quill.getBounds(range.index, range.length);
      const anchorEl = document.querySelector(".center-document") as HTMLElement | null;
      const editorEl = editorRef.current;

      if (!anchorEl || !editorEl) return;

      {/* bounds가 null이면 window.getSelection()으로 폴백 */}
      let finalBounds = bounds;
      if (!finalBounds) {
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const nativeRange = nativeSelection.getRangeAt(0);
          const rect = nativeRange.getBoundingClientRect();
          const editorRect = editorEl.getBoundingClientRect();
          
          {/* Quill bounds 형식으로 변환 (에디터 기준 상대 좌표) */}
          finalBounds = {
            top: rect.top - editorRect.top,
            left: rect.left - editorRect.left,
            bottom: rect.bottom - editorRect.top,
            right: rect.right - editorRect.left,
            width: rect.width,
            height: rect.height,
          };
        }
      }

      {/* 여전히 bounds를 구할 수 없으면 종료 */}
      if (!finalBounds) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const editorRect = editorEl.getBoundingClientRect();
      const editorOffsetTop = editorRect.top - anchorRect.top;
      const editorOffsetLeft = editorRect.left - anchorRect.left;
      const GAP = 10;
      const top = editorOffsetTop + finalBounds.bottom + GAP;
      const left = editorOffsetLeft + finalBounds.left + finalBounds.width / 2;
      const toolbarW = 280;
      let clampedLeft = left;
      clampedLeft = Math.max(toolbarW / 2 + 12, clampedLeft);
      clampedLeft = Math.min(anchorEl.clientWidth - toolbarW / 2 - 12, clampedLeft);

      setFloatingPos({ top, left: clampedLeft });
      setShowFloating(true);
    });

    {/* quill에서 텍스트 변경 감지하는 로직 */}
    quill.on("text-change", (delta: any, oldDelta: any, source: any) => {
      if (suppressRef.current) return;

      const html = quill.root.innerHTML;
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = (div.textContent || div.innerText || "").trim();
      setDocumentText(text);

      {/* ::table 구문 자동 감지 및 변환 */}
      if (source === 'user') {
        detectAndConvertTableSyntax(quill);
        detectAndConvertMathSyntax(quill);
      }

      {/* 텍스트 삭제 시 편집기 자동 숨김 처리 */}
      if (savedRangeRef.current) {
        const currentRange = quill.getSelection();
        if (!currentRange || currentRange.length === 0) {
          setShowFloating(false);
          savedRangeRef.current = null;
          setFtMenu(null);
        }
      }
    });

    return () => {
      detachTable();
      quill.root.removeEventListener("click", onRootClick);
      document.removeEventListener("selectionchange", handleNativeSelectionChange);
      quillRef.current = null;
    };
  }, []);
}
