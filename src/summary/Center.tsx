// React 라이브러리 호출
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Quill 라이브러리 호출
import Quill from 'quill';
import * as ImageResize from "quill-image-resize-module-plus";
import {marked} from "marked";
import QuillMarkdown from 'quilljs-markdown';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'
import 'quill/dist/quill.snow.css';
import { pdfExporter } from "quill-to-pdf";
import { saveAs } from "file-saver";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import html2pdf from "html2pdf.js";

// 컴포넌트 호출
import Header from '../components/Header';
import Chatbot from '../helper/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
import "../assets/font/font.css";

// 아이콘 호출
import plus from '../assets/icons/plus.png';
import minus from '../assets/icons/minus.png';
import B from '../assets/icons/B.png';
import underline from '../assets/icons/underline.png';
import gradient from '../assets/icons/gradient.png';
import A from '../assets/icons/A.png';
import T from '../assets/icons/T.png';
import sort from '../assets/icons/sort.png';
import triangle from '../assets/icons/inverse_triangle.png';
import save from '../assets/icons/save.png';
import settings from '../assets/icons/settings.png';


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

// Image Resize 모듈 등록 (default export 꼬임 방지)
const ImageResizeModule = (ImageResize as any).default ?? ImageResize;
Quill.register("modules/imageResize", ImageResizeModule);

export default function Center() {
  const location = useLocation();
  const [fontSize, setFontSize] = useState(13);
  const [selectedFont, setSelectedFont] = useState('sans-serif');
  const [sidebarTop, setSidebarTop] = useState(70);
  const [panelTop, setPanelTop] = useState(70);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback' | 'reference'>('chat');
  const [typingText, setTypingText] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const hasTypingStartedRef = useRef(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const suppressRef = useRef(false);
  const [fontLabel, setFontLabel] = useState(""); // sidebar-selector-button에 보여줄 텍스트
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showLineSpacingPicker, setShowLineSpacingPicker] = useState(false);
  const [showMarginSettings, setShowMarginSettings] = useState(false);
  const [margins, setMargins] = useState({ top: 71, bottom: 71, left: 83, right: 83 });
  const lastFocusedQuillRef = useRef<Quill | null>(null);
  const documentContainerRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 60, width: 79 });
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
  const [exportHtml, setExportHtml] = useState<string>("");
  const [documentText, setDocumentText] = useState<string>("");

  // Draft text 적용
  useEffect(() => {
    if (uploadData || uploadErrorMessage) return;
    if (!draftText) return;
    const quill = quillRef.current;
    if (!quill) return;

    (async () => {
      const html = await marked.parse(draftText);

      suppressRef.current = true;
      quill.setText(""); // 기존 내용 비우고
      quill.clipboard.dangerouslyPasteHTML(html);
      setTimeout(() => (suppressRef.current = false), 0);

      // 라벨/버튼 상태 한번 갱신하고 싶으면
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
        setIsBoldActive(false);
        setIsUnderlineActive(false);
        setIsItalicActive(false);
        setFontLabel(""); 
        return;
      }

      // 기존: 버튼 활성화
      const format = quill.getFormat(range.index, range.length);
      setIsBoldActive(!!format.bold);
      setIsUnderlineActive(!!format.underline);
      setIsItalicActive(!!format.italic);

      if (range.length === 0) {
        const f = (quill.getFormat(range).font as string | undefined) ?? "";
        setFontLabel(f);
      } else {
        const uniform = getUniformFontInRange(quill, range.index, range.length);
        setFontLabel(uniform ?? "");
      }
    });


    // 문서 변경 저장
    quill.on("text-change", () => {
      if (suppressRef.current) return;
      // documentText 업데이트
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

  // Font size handlers
  const handleIncrease = () => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const format = quill.getFormat(selection.index) as any;
        const currentSize = format.size ? parseInt(format.size) : 16;
        const newSize = currentSize + 2;
        quill.formatText(selection.index, selection.length, 'size', newSize.toString());
        return;
      }
    }
    setFontSize(prev => prev + 1);
  };

  // Font size handlers
  const handleDecrease = () => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const format = quill.getFormat(selection.index) as any;
        const currentSize = format.size ? parseInt(format.size) : 16;
        const newSize = Math.max(8, currentSize - 2);
        quill.formatText(selection.index, selection.length, 'size', newSize.toString());
        return;
      }
    }
    setFontSize(prev => Math.max(1, prev - 1));
  };

  // Bold handler
  const handleBold = () => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const currentFormat = quill.getFormat();
        quill.format('bold', !currentFormat.bold);
        setIsBoldActive(!currentFormat.bold);
      }
    }
  };

  // Underline handler
  const handleUnderline = () => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const currentFormat = quill.getFormat();
        quill.format('underline', !currentFormat.underline);
        setIsUnderlineActive(!currentFormat.underline);
      }
    }
  };

  // Italic handler
  const handleItalic = () => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const currentFormat = quill.getFormat();
        quill.format('italic', !currentFormat.italic);
        setIsItalicActive(!currentFormat.italic);
      }
    }
  };
  // Color handler
  const handleColor = (color: string) => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        quill.formatText(selection.index, selection.length, 'color', color);
      }
      quill.focus();
    }
    setShowColorPicker(false);
  };

  // Font handler
  const handleFont = (font: string) => {
    const quill = lastFocusedQuillRef.current;
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection) return;

    if (selection.length > 0) {
      quill.formatText(selection.index, selection.length, 'font', font);
    } else {
      // ✅ 커서만 있을 때: 다음 입력부터 적용
      quill.format('font', font);
    }

    quill.focus();
    setSelectedFont(font);
    setShowFontPicker(false);
    setFontLabel(font);
  };


  // Size selector handler
  const handleSize = (size: string) => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const sizeValue = size === 'normal' ? false : size;
        quill.formatText(selection.index, selection.length, 'size', sizeValue);
        setTimeout(() => {
          quill.setSelection(selection.index, selection.length);
        }, 0);
      }
    }
    setShowSizePicker(false);
  };

  // Margin handler
  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };

  // Line spacing handler
  const handleLineSpacing = (spacing: string) => {
    const quill = lastFocusedQuillRef.current;
    if (quill) {
      const editor = quill.root as HTMLElement;
      editor.style.lineHeight = spacing;
      quill.focus();
    }
    setShowLineSpacingPicker(false);
  };

  // Update sidebar and panel positions based on scroll
  const updatePositions = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = 75;
    const targetTop = 70 + Math.max(0, scrollTop - scrollThreshold);
    setSidebarTop(targetTop);
    setPanelTop(targetTop);
  };

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
    const container = documentContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to batch multiple callbacks
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        updatePositions();
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
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
    window.addEventListener('resize', recalcUnderline, { passive: true });
    return () => {
      window.removeEventListener('resize', recalcUnderline);
    };
  }, [activeTab]);

  const normalizeTitle = (raw?: string | null) => {
    if (!raw) return "";
    return raw.replace(/\.pdf$/i, "").trim();
  };

  const buildMarkdownWithTitle = (title?: string, body?: string) => {
    const heading = title ? `# ${title}\n\n` : "";
    return `${heading}${body ?? ""}`.trimEnd();
  };

  // 정렬 적용 함수
  const applyAlign = (value: "left" | "center" | "right") => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    if (!quill) return;

    if (value === "left") {
      quill.format("align", false);
    } else {
      quill.format("align", value);
    }

    setAlignOpen(false);
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

  // Center 컴포넌트 내부에 추가
  const exportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;

    const html = quill.root.innerHTML;

    // 1) 캡처 대상 DOM
    const wrapper = document.createElement("div");
    wrapper.id = "pdf-wrapper";
    wrapper.className = "ql-snow";

    // ✅ 숨김은 opacity만 (visibility 쓰면 clone에서 제외될 수 있음)
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px"; // 화면 밖으로 보내기(레이아웃은 유지)
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

    // ✅ 원본 DOM에서도 높이 자동 강제
    editor.style.setProperty("display", "block", "important");
    editor.style.setProperty("height", "auto", "important");
    editor.style.setProperty("min-height", "1px", "important");
    editor.style.setProperty("overflow", "visible", "important");

    editor.style.padding = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;
    editor.style.fontSize = `${fontSize}px`;

    wrapper.appendChild(editor);
    document.body.appendChild(wrapper);

    // 레이아웃 확정
    void wrapper.offsetHeight;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    // 폰트 로드 대기
    // @ts-ignore
    if (document.fonts?.ready) await (document.fonts as any).ready;

    // (진단용)
    console.log("wrapper h:", wrapper.getBoundingClientRect().height);
    console.log("editor h:", editor.getBoundingClientRect().height);

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

                /* Quill은 기본 list-style을 꺼놓고 counter로 번호를 그리는데,
                  PDF에서는 native marker를 쓰도록 강제 */
                .ql-editor ol > li {
                  list-style-type: decimal !important;
                }
                .ql-editor ul > li {
                  list-style-type: disc !important;
                }

                /* Quill이 그리는 가짜 마커 제거 */
                .ql-editor li::before {
                  content: none !important;
                }
                .ql-editor li > .ql-ui {
                  display: none !important;
                }

                /* 혹시 list-style이 none으로 잡혀있으면 무조건 되살림 */
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

  // 주어진 범위 내에서 단일 폰트인지 확인하는 유틸리티 함수
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

  // CSS 텍스트에서 font-family 추출 유틸리티 함수
  const parseFontFamiliesFromCssText = (cssText: string) => {
    // @font-face 블록에서 font-family:'...' 만 뽑는다
    const families = new Set<string>();
    const re = /@font-face\s*{[^}]*font-family\s*:\s*['"]([^'"]+)['"][^}]*}/gms;

    let m: RegExpExecArray | null;
    while ((m = re.exec(cssText)) !== null) {
      families.add(m[1]);
    }
    return Array.from(families);
  };

  // Font 목록
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

  // 현재 선택된 폰트 라벨
  const currentFontLabel = 
    FONT_LIST.find(f => f.key === (fontLabel || selectedFont))?.label ?? "Font";

  // Delta를 HTML로 변환하는 유틸리티 함수
  const deltaToHtml = (delta: any) => {
    const ops = delta?.ops ?? [];
    const converter = new QuillDeltaToHtmlConverter(ops, {
      // 기본값으로 두고, 결과 보고 옵션 추가하면 됨
      // (너 font.css가 ql-font-XXX 클래스 매핑을 갖고 있어서
      //  class 기반 출력이 나오면 가장 좋음)
    });
    return converter.convert();
  };

  // HTML 내보내기 함수
  const exportHtmlTest = () => {
    const quill = quillRef.current;
    if (!quill) return;

    const delta = quill.getContents();
    const html = deltaToHtml(delta);

    setExportHtml(html);
  };

  const handleShowSummary = () => {
    if (!uploadedContent?.summary) return;
    const md = buildMarkdownWithTitle(uploadedContent.title, uploadedContent.summary);
    applyMarkdown(md);
  };

  const handleUndo = () => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    quill?.history?.undo();
  };

  const handleRedo = () => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    quill?.history?.redo();
  };

  // Render
  return (
    <div className="center-container">
      <div className="center-sidebar" style={{ top: `${sidebarTop}px` }}>
        
        <div className="sidebar-counter-container">
          <img 
            src={minus} 
            alt="decrease" 
            className="sidebar-icon-3" 
            onClick={handleDecrease}
          />
          <div className="sidebar-counter">{fontSize}</div>
          <img 
            src={plus} 
            alt="increase" 
            className="sidebar-icon-2" 
            onClick={handleIncrease}
          />
        </div>
        <div className="sidebar-counter-line" />

        {/* Font Selector */}
        <div className="sidebar-selector-container">
          <div 
            className="sidebar-selector-button"
            onClick={() => setShowFontPicker(!showFontPicker)}
          >
            {currentFontLabel}
          </div>
          {showFontPicker && (
            <div className="sidebar-selector-dropdown">
              {/* Font Selector */}
              <div className="sidebar-selector-container">
                <div
                  className="sidebar-selector-button"
                  onClick={() => setShowFontPicker(v => !v)}
                  style={{
                    fontFamily:
                      FONT_LIST.find(f => f.key === (fontLabel || selectedFont))?.cssFamily ?? 'sans-serif',
                  }}
                >
                  {currentFontLabel}
                </div>

                {showFontPicker && (
                  <div className="sidebar-selector-dropdown">
                    {FONT_LIST.map(f => (
                      <div
                        key={f.key}
                        className={`sidebar-selector-item ${selectedFont === f.key ? 'selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleFont(f.key);
                        }}
                        style={{ fontFamily: f.cssFamily }}  // ✅ 미리보기
                      >
                        {f.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Size Selector */}
        <div className="sidebar-selector-container">
          <div 
            className="sidebar-selector-button"
            onClick={() => setShowSizePicker(!showSizePicker)}
          >
            Size
          </div>
          {showSizePicker && (
            <div className="sidebar-selector-dropdown">
              {['small', 'normal', 'large', 'huge'].map(size => (
                <div
                  key={size}
                  className="sidebar-selector-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSize(size);
                  }}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>

        <img src={B} alt="sidebar icon" className={`sidebar-icon-4 ${isBoldActive ? 'active' : ''}`} onClick={handleBold} style={isBoldActive ? { filter: 'brightness(1.5) saturate(1.5)' } : {}} />
        <img src={underline} alt="sidebar icon" className={`sidebar-icon-5 ${isUnderlineActive ? 'active' : ''}`} onClick={handleUnderline} style={isUnderlineActive ? { filter: 'brightness(1.5) saturate(1.5)' } : {}} />
        <img src={gradient} alt="sidebar icon" className={`sidebar-icon-6 ${isItalicActive ? 'active' : ''}`} onClick={handleItalic} style={isItalicActive ? { filter: 'brightness(1.5) saturate(1.5)' } : {}} />
        <div className="color-picker-anchor">
          <img src={A} alt="sidebar icon" className="sidebar-icon-7" onClick={() => setShowColorPicker(!showColorPicker)} style={{ cursor: 'pointer' }} />
          {showColorPicker && (
            <div className="color-picker-dropdown">
              {['#000000', '#FFFFFF', '#FF0000', '#FF6B6B', '#FFA500', '#FFD700', '#FFFF00', '#00FF00', '#00CED1', '#0000FF', '#4169E1', '#8B00FF', '#FF1493', '#FF69B4', '#A52A2A', '#808080', '#C0C0C0', '#FFB6C1', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#D5F4E6', '#FFF9E6', '#FFE6E6', '#E6F3FF', '#F0E6FF', '#FFE6F0', '#E6FFE6', '#E6FFFF'].map(color => (
                <div
                  key={color}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleColor(color);
                  }}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="line-spacing-container">
          <img src={T} alt="sidebar icon" className="sidebar-icon-8" onClick={() => setShowLineSpacingPicker(!showLineSpacingPicker)} style={{ cursor: 'pointer' }} />
          {showLineSpacingPicker && (
            <div className="line-spacing-dropdown">
              {['100%', '120%', '140%', '160%', '180%', '200%'].map(spacing => (
                <div
                  key={spacing}
                  className="line-spacing-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleLineSpacing(spacing);
                  }}
                >
                  {spacing}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="sidebar-sort-container">
          <img src={sort} alt="sort" className="sidebar-icon-sort" />
          <img src={triangle} alt="triangle" className="sidebar-icon-triangle" onClick={() => setAlignOpen((v) => !v)} />

          {alignOpen && (
            <div className="align-dropdown">
              <button type = "button" onClick = {() => applyAlign('left')}>왼쪽 정렬</button>
              <button type = "button" onClick = {() => applyAlign('center')}>가운데 정렬</button>
              <button type = "button" onClick = {() => applyAlign('right')}>오른쪽 정렬</button>
            </div>
          )}
        </div>
        <img src={settings} alt="sidebar icon" className="sidebar-icon-10" onClick={() => setShowMarginSettings(!showMarginSettings)} style={{ cursor: 'pointer' }} />
        <img
          src={save}
          alt="sidebar icon"
          className="sidebar-icon-9"
          onClick={exportPdf}   // ✅ 여기만 exportPdf -> exportHtmlTest
          style={{ cursor: 'pointer' }}
        />
      </div>


      {showMarginSettings && (
        <div className="margin-settings-overlay" onClick={() => setShowMarginSettings(false)}>
          <div className="margin-settings-modal" onClick={(e) => e.stopPropagation()}>
            <h3>페이지 여백</h3>
            <div className="margin-inputs">
              <div className="margin-input-group">
                <label>위쪽</label>
                <input
                  type="number"
                  value={margins.top}
                  onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                  min="0"
                />
                <span>mm</span>
              </div>
              <div className="margin-input-group">
                <label>아래쪽</label>
                <input
                  type="number"
                  value={margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                  min="0"
                />
                <span>mm</span>
              </div>
              <div className="margin-input-group">
                <label>왼쪽</label>
                <input
                  type="number"
                  value={margins.left}
                  onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                  min="0"
                />
                <span>mm</span>
              </div>
              <div className="margin-input-group">
                <label>오른쪽</label>
                <input
                  type="number"
                  value={margins.right}
                  onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                  min="0"
                />
                <span>mm</span>
              </div>
            </div>
            <div className="margin-buttons">
              <button onClick={() => setShowMarginSettings(false)} className="margin-apply-btn">적용</button>
              <button onClick={() => setShowMarginSettings(false)} className="margin-cancel-btn">취소</button>
            </div>
          </div>
        </div>
      )}

      <div ref={documentContainerRef}>
        <div
          className="center-document"
          style={{
            top: "70px",
            padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
          }}
        >
          <div ref={editorRef} className="document-input" />
        </div>
      </div>

      <div className="center-panel" style={{ top: `${panelTop}px` }}>
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
        {renderPanelContent()}
      </div>
      <div className="center-undo-controls">
        <button
          type="button"
          className="center-undo-btn"
          onClick={handleUndo}
          aria-label="실행 취소"
        >
          ←
        </button>
        <button
          type="button"
          className="center-undo-btn"
          onClick={handleRedo}
          aria-label="다시 실행"
        >
          →
        </button>
      </div>
      <button
        type="button"
        className="center-summary-btn"
        onClick={handleShowSummary}
        disabled={!uploadedContent?.summary}
      >
        요약
      </button>
      <Header activeMenu="summary" />
    </div>
  );
}