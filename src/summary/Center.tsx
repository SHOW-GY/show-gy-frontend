// React 라이브러리 호출
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { Group, Panel, Separator } from "react-resizable-panels";
// (추가) 아이콘을 left pane에서 직접 쓰려면
import saveIcon from "../assets/icons/save.png";
import settingsIcon from "../assets/icons/settings.png";


// Quill 라이브러리 호출
import Quill from 'quill';
import * as ImageResize from "quill-image-resize-module-plus";
import { marked } from "marked";
import QuillMarkdown from 'quilljs-markdown';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'
import 'quill/dist/quill.snow.css';
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";

// 컴포넌트 호출
import Layout from '../components/Layout';
import Chatbot from '../helper/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
import "../assets/font/font.css";
import '../styles/summary.css';

// Quill size 포맷 설정
const Q: any = (Quill as any).default ?? Quill;
const Size = Q.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Q.register(Size, true);

// Font 등록
const Font = Q.import("formats/font");
Font.whitelist = [
  "sans-serif", "serif", "monospace",
  "YeogiOttaeJalnan",
  "OngleipParkDahyeon",
  "KerisKeduLine",
  "Yeongwol",
  "Hamchorom",
  "Simple",
  "DaeguDongseongRo",
  "GiantsInline",
  "Mujeokhaebeong",
  "Cafe24Decobox",
  "NanumGothic",
  "NanumMyeongjo",
  "JejuGothic",
  "BlackHanSans",
];
Q.register(Font, true);
const ImageResizeModule = (ImageResize as any).default ?? ImageResize;
Quill.register("modules/imageResize", ImageResizeModule);

export default function Center() {
  const location = useLocation();
  const [fontSize] = useState(13);
  const [selectedFont, setSelectedFont] = useState('sans-serif');
  const [panelTop, setPanelTop] = useState(70);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback' | 'reference'>('chat');
  const [typingText, setTypingText] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const hasTypingStartedRef = useRef(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const suppressRef = useRef(false);
  const [fontLabel, setFontLabel] = useState("");
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [showMarginSettings, setShowMarginSettings] = useState(false);
  const [margins, setMargins] = useState({ top: 71, bottom: 71, left: 83, right: 83 });
  const lastFocusedQuillRef = useRef<Quill | null>(null);
  const documentContainerRef = useRef<HTMLDivElement | null>(null);
  const centerContainerRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 60, width: 79 });
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<'chat' | 'feedback' | 'reference', HTMLDivElement | null>>({
    chat: null,
    feedback: null,
    reference: null,
  });
  const draftText = (location.state as any)?.draftText as string | null;
  const uploadData = (location.state as any)?.uploadData as
    | { title?: string; text?: string; summary?: string }
    | null;
  const uploadErrorMessage = (location.state as any)?.uploadErrorMessage as string | null;
  const [uploadedContent, setUploadedContent] = useState<
    { title?: string; text?: string; summary?: string } | null
  >(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showFloating, setShowFloating] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ top: 0, left: 0 });
  const savedRangeRef = useRef<{ index: number; length: number } | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  type FtMenu = null | "color" | "font" | "size" | "line" | "align";
  const [ftMenu, setFtMenu] = useState<FtMenu>(null);

  // Draft text 적용
  useEffect(() => {
    if (uploadData || uploadErrorMessage) return;
    if (!draftText) return;
    const quill = quillRef.current;
    if (!quill) return;

    (async () => {
      const html = await marked.parse(draftText);

      suppressRef.current = true;
      quill.setText("");
      quill.clipboard.dangerouslyPasteHTML(html);
      setTimeout(() => (suppressRef.current = false), 0);

      quill.focus();
    })();
  }, [draftText]);

  // Typing effect initialization
  useEffect(() => {
    if (hasTypingStartedRef.current) return;
    if (uploadData || uploadErrorMessage) return;

    const stateDraft = (location.state as any)?.draftText;
    const draft = stateDraft || localStorage.getItem('draft_document');

    if (draft && draft.trim()) {
      setTypingText(draft);
      setIsTyping(true);
      hasTypingStartedRef.current = true;
      localStorage.removeItem('draft_document');
    }
  }, [location.state]);

  useEffect(() => {
    if (!isTyping || !typingText) return;

    let typingTimeoutId: number | null = null;
    let cancelled = false;

    const waitForQuillAndStart = () => {
      const quill = quillRef.current;
      if (!quill) {
        typingTimeoutId = window.setTimeout(waitForQuillAndStart, 50);
        return;
      }

      let currentIndex = 0;
      const typingSpeed = 30;

      const typeNextChar = () => {
        if (cancelled) return;

        if (currentIndex < typingText.length) {
          const char = typingText[currentIndex];
          const insertAt = quill.getLength() - 1;

          quill.insertText(insertAt, char);
          currentIndex++;

          typingTimeoutId = window.setTimeout(typeNextChar, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };

      typeNextChar();
    };

    waitForQuillAndStart();

    return () => {
      cancelled = true;
      if (typingTimeoutId !== null) clearTimeout(typingTimeoutId);
    };
  }, [isTyping, typingText]);

  // 1) Quill 생성: 딱 한 번만
  useEffect(() => {
    const el = editorRef.current;
    if (!el || quillRef.current) return;

    const quill = new Quill(el, {
      theme: "snow",
      modules: {
        toolbar: false,
        imageResize: {},
        history: {
          delay: 1000,
          maxStack: 200,
          userOnly: true,
        },
      },
      formats: [
        "size", "font", "bold", "italic", "underline", "color", "align",
        "header", "list", "blockquote", "code-block", "image",
      ],
      placeholder: "",
    });

    new QuillMarkdown(quill, {});

    quill.root.style.paddingTop = "8px";

    quillRef.current = quill;
    lastFocusedQuillRef.current = quill;

    quill.on("selection-change", (range) => {
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

      // 버튼 활성화
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

      savedRangeRef.current = { index: range.index, length: range.length };

      const uniform = getUniformFontInRange(quill, range.index, range.length);
      setFontLabel(uniform ?? "");

      // ✅ 좌표 계산 로직 교체 (scroll/rect 더하는거 전부 제거)
      const bounds = quill.getBounds(range.index, range.length);

      // ✅ 툴바를 배치할 기준 엘리먼트들
      const docEl = documentContainerRef.current;     // doc-pane-inner 상위(스크롤 포함)일 수도 있음
      const anchorEl = document.querySelector(".center-document") as HTMLElement | null;
      const editorEl = editorRef.current;

      if (!anchorEl || !editorEl) return;

      // ✅ 각 요소의 viewport 기준 rect
      const anchorRect = anchorEl.getBoundingClientRect();
      const editorRect = editorEl.getBoundingClientRect();

      // ✅ bounds는 "quill editor(=editorEl 내부)" 기준 좌표라서
      //    center-document(=anchorEl) 기준으로 변환해줘야 함
      const editorOffsetTop = editorRect.top - anchorRect.top;
      const editorOffsetLeft = editorRect.left - anchorRect.left;

      // ✅ 항상 '선택 영역 바로 아래'로
      const GAP = 10;
      const top = editorOffsetTop + bounds.bottom + GAP;
      const left = editorOffsetLeft + bounds.left + bounds.width / 2;

      const toolbarW = 560; // CSS max-width와 맞춤(대충)
      let clampedLeft = left;
      clampedLeft = Math.max(toolbarW / 2 + 12, clampedLeft);
      clampedLeft = Math.min(anchorEl.clientWidth - toolbarW / 2 - 12, clampedLeft);

      setFloatingPos({ top, left: clampedLeft });
      setShowFloating(true);
    });

    // 문서 변경 저장
    quill.on("text-change", () => {
      if (suppressRef.current) return;

      const html = quill.root.innerHTML;
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = (div.textContent || div.innerText || "").trim();
      setDocumentText(text);
    });

    return () => {
      quillRef.current = null;
    };
  }, []);

  // 2) fontSize 변경 시: 단일 Quill에만 적용
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    q.root.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    if (!showMarginSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMarginSettings(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMarginSettings]);

  // Scroll position handlers
  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        updatePositions();
      }, 200);
    };

    updatePositions();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ResizeObserver to track document height changes when pages are added/removed
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const updateContainerHeight = () => {
      const centerDoc = document.querySelector('.center-document');
      if (!centerDoc) return;

      const docHeight = (centerDoc as HTMLElement).offsetHeight;

      const newHeight = Math.max(100 * 16, docHeight + 170);
      setContainerHeight(newHeight);
    };

    setTimeout(updateContainerHeight, 100);

    const handleTextChange = () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(updateContainerHeight);
    };

    quill.on('text-change', handleTextChange);

    const handleWindowResize = () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(updateContainerHeight);
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      quill.off('text-change', handleTextChange);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  // Helper Underline position handlers
  useEffect(() => {
    const recalcUnderline = () => {
      const container = tabsContainerRef.current;
      const activeEl = tabRefs.current[activeTab];
      if (!container || !activeEl) return;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    };

    recalcUnderline();

    const container = tabsContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(recalcUnderline);
    });
    ro.observe(container);

    window.addEventListener('resize', recalcUnderline, { passive: true });
    return () => {
      window.removeEventListener('resize', recalcUnderline);
    };
  }, [activeTab]);

  // 업로드 결과 적용 (본문/요약/오류)
  useEffect(() => {
    if (!uploadData && !uploadErrorMessage) return;
    const quill = quillRef.current;
    if (!quill) return;

    if (uploadErrorMessage) {
      setUploadedContent(null);
      applyMarkdown(uploadErrorMessage);
      return;
    }

    const title = normalizeTitle(uploadData?.title);
    const text = uploadData?.text || uploadData?.summary || "";
    setUploadedContent({
      title,
      text: uploadData?.text ?? "",
      summary: uploadData?.summary ?? "",
    });
    applyMarkdown(buildMarkdownWithTitle(title, text));
  }, [uploadData, uploadErrorMessage]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!showFloating) return;
      const el = floatingRef.current;
      if (el && el.contains(e.target as Node)) return;

      setFtMenu(null);
      setShowFloating(false);
      savedRangeRef.current = null;
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [showFloating]);

  useEffect(() => {
    const onScroll = () => {
      if (!showFloating) return;
      setShowFloating(false);
      savedRangeRef.current = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showFloating]);

  // Margin handler
  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };

  // Update sidebar and panel positions based on scroll
  const updatePositions = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = 75;
    const targetTop = 70 + Math.max(0, scrollTop - scrollThreshold);
    setPanelTop(targetTop);
  };

  const normalizeTitle = (raw?: string | null) => {
    if (!raw) return "";
    return raw.replace(/\.pdf$/i, "").trim();
  };

  const buildMarkdownWithTitle = (title?: string, body?: string) => {
    const heading = title ? `# ${title}\n\n` : "";
    return `${heading}${body ?? ""}`.trimEnd();
  };

  const applyLineHeightToSavedRange = (lineHeight: string) => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    const saved = savedRangeRef.current;
    if (!quill || !saved) return;

    quill.setSelection(saved.index, saved.length, "silent");

    const [lineStart] = quill.getLine(saved.index);
    const [lineEnd] = quill.getLine(saved.index + Math.max(saved.length - 1, 0));

    const startIndex = quill.getIndex(lineStart);
    const endIndex = quill.getIndex(lineEnd);

    for (let i = startIndex; i <= endIndex; ) {
      const [line] = quill.getLine(i);
      if (!line) break;

      const dom = (line as any).domNode as HTMLElement | undefined;
      if (dom) dom.style.lineHeight = lineHeight;

      const len = Number((line as any).length?.() ?? 1);
      const next = i + Math.max(1, len);
      if (next <= i) break;
      i = next;
    }

    quill.focus();
  };

  // Markdown 적용 함수
  const applyMarkdown = async (md: string) => {
    const quill = quillRef.current;
    if (!quill) return;

    const html = await marked.parse(md);

    suppressRef.current = true;
    quill.setText("");
    quill.clipboard.dangerouslyPasteHTML(html);
    setTimeout(() => (suppressRef.current = false), 0);

    quill.focus();
  };

  // Panel content renderer
  const extractTopicFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const heading = div.querySelector("h1, h2, h3");
    return (heading?.textContent || "").trim();
  };

  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      const topicId = extractTopicFromHtml(quillRef.current?.root?.innerHTML || "");
      return <Chatbot documentText={documentText} topicId={topicId} />;
    }

    if (activeTab === 'feedback') return <Feedback />;
    return <Search />;
  };

  // PDF Export
  const exportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;

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

    // @ts-ignore
    if (document.fonts?.ready) await (document.fonts as any).ready;

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
  };

  // 유틸: 단일 폰트 확인
  const getUniformFontInRange = (quill: Quill, index: number, length: number) => {
    const contents = quill.getContents(index, length);
    const fonts = new Set<string>();

    for (const op of contents.ops || []) {
      if (typeof op.insert !== "string") continue;
      const f = (op.attributes as any)?.font ?? "__DEFAULT__";
      fonts.add(f);
      if (fonts.size > 1) return null;
    }

    const only = [...fonts][0];
    if (!only || only === "__DEFAULT__") return null;
    return only;
  };

  const FONT_LIST = [
    { key: 'sans-serif', label: 'Sans Serif', cssFamily: 'sans-serif' },
    { key: 'serif', label: 'Serif', cssFamily: 'serif' },
    { key: 'monospace', label: 'Monospace', cssFamily: 'monospace' },

    { key: 'YeogiOttaeJalnan', label: '잘난체', cssFamily: "'YeogiOttaeJalnan'" },
    { key: 'OngleipParkDahyeon', label: '박다현체', cssFamily: "'OngleipParkDahyeon'" },
    { key: 'KerisKeduLine', label: '케리스케두', cssFamily: "'KerisKeduLine'" },
    { key: 'Yeongwol', label: '영월', cssFamily: "'Yeongwol'" },
    { key: 'Hamchorom', label: '함초롬바탕', cssFamily: "'Hamchorom'" },
    { key: 'Simple', label: '단조', cssFamily: "'Simple'" },
    { key: 'DaeguDongseongRo', label: '대구동성로', cssFamily: "'DaeguDongseongRo'" },
    { key: 'GiantsInline', label: '롯데자이언츠', cssFamily: "'GiantsInline'" },
    { key: 'Mujeokhaebeong', label: '무적해병', cssFamily: "'Mujeokhaebeong'" },
    { key: 'Cafe24Decobox', label: '카페24데코', cssFamily: "'Cafe24Decobox'" },

    { key: 'NanumGothic', label: '나눔고딕', cssFamily: "'Nanum Gothic', sans-serif" },
    { key: 'NanumMyeongjo', label: '나눔명조', cssFamily: "'Nanum Myeongjo', serif" },
    { key: 'JejuGothic', label: '제주고딕', cssFamily: "'Jeju Gothic', sans-serif" },
    { key: 'BlackHanSans', label: '검은고딕', cssFamily: "'Black Han Sans', sans-serif" },
  ] as const;

  const currentFontLabel =
    FONT_LIST.find(f => f.key === (fontLabel || selectedFont))?.label ?? "Font";

  const applyFormatToSavedRange = (name: string, value: any) => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    const saved = savedRangeRef.current;
    if (!quill || !saved) return;

    quill.setSelection(saved.index, saved.length, "silent");
    quill.format(name as any, value);
    quill.focus();
  };

  // Render
  return (
    <Layout activeMenu="summary">
      <div className="center-split-root">
        <Group orientation="horizontal" className="center-split-group">

          {/* 1) LEFT: 저장/설정 + 여백 조절 */}
          <Panel defaultSize={18} minSize={14} maxSize={50} className="pane pane-left">
            <div className="left-pane">
              <button className="left-pane-btn" onClick={exportPdf} title="저장(PDF)">
                <img src={saveIcon} alt="save" />
              </button>

              <button
                className="left-pane-btn"
                onClick={() => setShowMarginSettings(true)}
                title="페이지 여백"
              >
                <img src={settingsIcon} alt="settings" />
              </button>
            </div>
          </Panel>

          <Separator className="resize-handle" />

          {/* 2) CENTER: 문서 */}
          <Panel defaultSize={55} minSize={35} className="pane pane-center">
            <div className="doc-pane">
              <div ref={documentContainerRef} className="doc-pane-inner">
                <div
                  className="center-document"
                  style={{
                    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                  }}
                >
                  <div ref={editorRef} className="document-input" />

      {/* ✅ (가장 중요) floating-toolbar는 반드시 center-document 내부에서 렌더 */}
                  {showFloating && (
                    <div
                      ref={floatingRef}
                      className="floating-toolbar"
                      style={{
                        top: `${floatingPos.top}px`,
                        left: `${floatingPos.left}px`,
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {/* Bold */}
                      <button
                        type="button"
                        className={`ft-btn ${isBoldActive ? "active" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormatToSavedRange("bold", !isBoldActive);
                          setIsBoldActive((v) => !v);
                        }}
                      >
                        B
                      </button>

                      {/* Underline */}
                      <button
                        type="button"
                        className={`ft-btn ${isUnderlineActive ? "active" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormatToSavedRange("underline", !isUnderlineActive);
                          setIsUnderlineActive((v) => !v);
                        }}
                      >
                        U
                      </button>

                      {/* Italic */}
                      <button
                        type="button"
                        className={`ft-btn ${isItalicActive ? "active" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormatToSavedRange("italic", !isItalicActive);
                          setIsItalicActive((v) => !v);
                        }}
                      >
                        I
                      </button>

                      <div className="ft-divider" />

                      {/* Color */}
                      <div className="ft-popover">
                        <button
                          type="button"
                          className={`ft-btn ${ftMenu === "color" ? "open" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFtMenu((m) => (m === "color" ? null : "color"));
                          }}
                        >
                          Color
                        </button>

                        {ftMenu === "color" && (
                          <div className="ft-dropdown" onMouseDown={(e) => e.preventDefault()}>
                            <div className="ft-color-grid">
                              {[
                                "#000000", "#FFFFFF", "#FF0000", "#FF6B6B", "#FFA500", "#FFD700",
                                "#FFFF00", "#00FF00", "#00CED1", "#0000FF", "#4169E1", "#8B00FF",
                                "#FF1493", "#FF69B4", "#A52A2A", "#808080", "#C0C0C0", "#FFB6C1",
                                "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#D5F4E6",
                                "#FFF9E6", "#FFE6E6", "#E6F3FF", "#F0E6FF", "#FFE6F0", "#E6FFE6", "#E6FFFF",
                              ].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className="ft-color"
                                  style={{ backgroundColor: c }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    applyFormatToSavedRange("color", c);
                                    setFtMenu(null);
                                  }}
                                  aria-label={`color-${c}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Font */}
                      <div className="ft-popover">
                        <button
                          type="button"
                          className={`ft-btn ${ftMenu === "font" ? "open" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFtMenu((m) => (m === "font" ? null : "font"));
                          }}
                        >
                          {currentFontLabel}
                        </button>

                        {ftMenu === "font" && (
                          <div className="ft-dropdown ft-dropdown--font" onMouseDown={(e) => e.preventDefault()}>
                            {FONT_LIST.map((f) => (
                              <button
                                key={f.key}
                                type="button"
                                className={`ft-item ${selectedFont === f.key ? "selected" : ""}`}
                                style={{ fontFamily: f.cssFamily }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const quill = lastFocusedQuillRef.current ?? quillRef.current;
                                  const saved = savedRangeRef.current;
                                  if (!quill || !saved) return;

                                  quill.setSelection(saved.index, saved.length, "silent");
                                  quill.formatText(saved.index, saved.length, "font", f.key);
                                  quill.focus();

                                  setSelectedFont(f.key);
                                  setFontLabel(f.key);
                                  setFtMenu(null);
                                }}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Size */}
                      <div className="ft-popover">
                        <button
                          type="button"
                          className={`ft-btn ${ftMenu === "size" ? "open" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFtMenu((m) => (m === "size" ? null : "size"));
                          }}
                        >
                          Size
                        </button>

                        {ftMenu === "size" && (
                          <div className="ft-dropdown" onMouseDown={(e) => e.preventDefault()}>
                            {["small", "normal", "large", "huge"].map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="ft-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const sizeValue = s === "normal" ? false : s;

                                  const quill = lastFocusedQuillRef.current ?? quillRef.current;
                                  const saved = savedRangeRef.current;
                                  if (!quill || !saved) return;

                                  quill.setSelection(saved.index, saved.length, "silent");
                                  quill.formatText(saved.index, saved.length, "size", sizeValue);
                                  quill.focus();

                                  setFtMenu(null);
                                }}
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Align */}
                      <div className="ft-popover">
                        <button
                          type="button"
                          className={`ft-btn ${ftMenu === "align" ? "open" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFtMenu((m) => (m === "align" ? null : "align"));
                          }}
                        >
                          Align
                        </button>

                        {ftMenu === "align" && (
                          <div className="ft-dropdown" onMouseDown={(e) => e.preventDefault()}>
                            {[
                              { key: "left", label: "Left" },
                              { key: "center", label: "Center" },
                              { key: "right", label: "Right" },
                            ].map((a) => (
                              <button
                                key={a.key}
                                type="button"
                                className="ft-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  applyFormatToSavedRange("align", a.key === "left" ? false : a.key);
                                  setFtMenu(null);
                                }}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Line height */}
                      <div className="ft-popover">
                        <button
                          type="button"
                          className={`ft-btn ${ftMenu === "line" ? "open" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFtMenu((m) => (m === "line" ? null : "line"));
                          }}
                        >
                          Line
                        </button>

                        {ftMenu === "line" && (
                          <div className="ft-dropdown" onMouseDown={(e) => e.preventDefault()}>
                            {[
                              { v: "1.0", label: "100%" },
                              { v: "1.2", label: "120%" },
                              { v: "1.4", label: "140%" },
                              { v: "1.6", label: "160%" },
                              { v: "1.8", label: "180%" },
                              { v: "2.0", label: "200%" },
                            ].map((s) => (
                              <button
                                key={s.v}
                                type="button"
                                className="ft-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  applyLineHeightToSavedRange(s.v);
                                  setFtMenu(null);
                                }}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Separator className="resize-handle" />

          {/* 3) RIGHT: 챗봇/피드백/참고자료 */}
          <Panel defaultSize={33} minSize={22} className="pane pane-right">
            <div className="right-pane">
              <div className="panel-tabs" ref={tabsContainerRef}>
                <div
                  className={`panel-tab ${activeTab === 'chat' ? 'active' : ''}`}
                  ref={el => (tabRefs.current.chat = el)}
                  onClick={() => setActiveTab('chat')}
                >
                  챗봇
                </div>
                <div
                  className={`panel-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                  ref={el => (tabRefs.current.feedback = el)}
                  onClick={() => setActiveTab('feedback')}
                >
                  피드백
                </div>
                <div
                  className={`panel-tab ${activeTab === 'reference' ? 'active' : ''}`}
                  ref={el => (tabRefs.current.reference = el)}
                  onClick={() => setActiveTab('reference')}
                >
                  참고자료
                </div>

                <div
                  className="panel-tab-underline"
                  style={{ left: underlineStyle.left, width: underlineStyle.width }}
                />
              </div>

              <div className="right-pane-body">
                {renderPanelContent()}
              </div>
            </div>
          </Panel>

        </Group>

        {showMarginSettings && (
          <div
            className="margin-modal-overlay"
            onClick={() => setShowMarginSettings(false)}
          >
            <div
              className="margin-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="margin-modal-head">
                <div className="margin-modal-title">페이지 여백</div>
                <button
                  type="button"
                  className="margin-modal-close"
                  onClick={() => setShowMarginSettings(false)}
                  aria-label="close"
                >
                  ×
                </button>
              </div>

              <div className="margin-modal-grid">
                <label>위</label>
                <input
                  type="number"
                  value={margins.top}
                  min={0}
                  onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                />

                <label>아래</label>
                <input
                  type="number"
                  value={margins.bottom}
                  min={0}
                  onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                />

                <label>좌</label>
                <input
                  type="number"
                  value={margins.left}
                  min={0}
                  onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                />

                <label>우</label>
                <input
                  type="number"
                  value={margins.right}
                  min={0}
                  onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                />
              </div>

              <div className="margin-modal-actions">
                <button
                  type="button"
                  className="margin-modal-apply"
                  onClick={() => setShowMarginSettings(false)}
                >
                  적용
                </button>
                <button
                  type="button"
                  className="margin-modal-close-btn"
                  onClick={() => setShowMarginSettings(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
