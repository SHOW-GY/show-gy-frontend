import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type Quill from 'quill';
import { useLocation } from 'react-router-dom';
import { Group, Panel, Separator } from "react-resizable-panels";
import saveIcon from "../assets/icons/save.png";
import settingsIcon from "../assets/icons/settings.png";
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css';
import 'quill/dist/quill.snow.css';
import "quill-mention/dist/quill.mention.css";
import Layout from '../components/Layout';
import Chatbot from '../helper/chatbot/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
import "../assets/font/font.css";
import '../styles/summary.css';
import { renderKatexHtml } from "./mathBlot";
import { useQuillInit } from "./hooks/useQuillInit";
import { applyMarkdown } from "./utils/markdown";
import { exportPdf } from "./utils/pdf";
import { FONT_LIST, getFontLabel } from "./fonts";
import { UploadDocumentResponse } from '../apis/types';

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
  
  {/* localStorage에서 uploadData 읽기 */}
  const [uploadData] = useState<UploadDocumentResponse | null>(() => {
    try {
      const stored = localStorage.getItem('uploadedDocument');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('localStorage에서 uploadData 읽기 실패:', e);
    }
    return null;
  });
  
  const uploadErrorMessage = (location.state as any)?.uploadErrorMessage as string | null;
  const [documentText, setDocumentText] = useState<string>("");

  const [showFloating, setShowFloating] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ top: 0, left: 0 });
  const savedRangeRef = useRef<{ index: number; length: number } | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [tablePlus, setTablePlus] = useState<null | {
    top: number;
    left: number;
    w: number;
    h: number;
  }>(null);
  const hoveredTableRef = useRef<HTMLTableElement | null>(null);

  type FtMenu = null | "color" | "font" | "size" | "line" | "align";
  const [ftMenu, setFtMenu] = useState<FtMenu>(null);
  const [mathOpen, setMathOpen] = useState(false);
  const mathOpenRef = useRef(false);
  const [mathTex, setMathTex] = useState("");
  const [mathPos, setMathPos] = useState({ top: 0, left: 0 });
  const mathTargetElRef = useRef<HTMLElement | null>(null);
  const mathPrevTexRef = useRef<string>("");
  const mathInputRef = useRef<HTMLTextAreaElement | null>(null);
  const tableApiRef = useRef<{
  addRow?: (where: "above" | "below") => void;
  addCol?: (where: "left" | "right") => void;
  refresh?: () => void;
}>({});

  {/* 문서 텍스트가 변경될 때마다 챗봇 패널에 전달하여 최신 상태 유지 */}
  useEffect(() => {
    if (uploadData || uploadErrorMessage) return;
    if (!draftText) return;
    const quill = quillRef.current;
    if (!quill) return;

    void applyMarkdown(quill, draftText, suppressRef);
  }, [draftText]);

  {/* 타이핑 상태 초기화 */ }
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

  {/* 타이핑 상태 초기화 */ }
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

  {/* 특정 범위 내의 일관된 글꼴 확인 */ }
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

  {/* Quill 에디터 초기화 */ }
  useQuillInit({
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
  });

  {/* 글꼴 크기 업데이트 */ }
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    q.root.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  {/* 페이지 여백 설정 패널 열기/닫기 */ }
  useEffect(() => {
    if (!showMarginSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMarginSettings(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMarginSettings]);

  {/* 페이지 스크롤 시 패널 위치 업데이트 */ }
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

  {/* 문서 텍스트가 변경될 때마다 챗봇 패널에 전달하여 최신 상태 유지 */}
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const updateContainerHeight = () => {
      const centerDoc = document.querySelector('.center-document');
      if (!centerDoc) return;

      const docHeight = (centerDoc as HTMLElement).offsetHeight;
    };

    setTimeout(updateContainerHeight, 100);

    const handleTextChange = () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(updateContainerHeight);
      
      // documentText 상태 업데이트 (suppressRef 무시)
      const html = quill.root.innerHTML;
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = (div.textContent || div.innerText || "").trim();
      if (text !== documentText) {
        console.log('📝 [Center.tsx] 문서 텍스트 강제 업데이트:', {
          textLength: text.length,
          preview: text.substring(0, 100)
        });
        setDocumentText(text);
      }
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

  {/* 선택지 하단의 밑줄 위치 계산 */ }
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

  {/* 업로드 데이터나 오류 메시지가 변경될 때마다 에디터 내용 업데이트 */ }
  useEffect(() => {
    if (!uploadData && !uploadErrorMessage) return;
    const quill = quillRef.current;
    if (!quill) return;

    if (uploadErrorMessage) {
      void applyMarkdown(quill, uploadErrorMessage, suppressRef);
      return;
    }

    const title = normalizeTitle(uploadData?.title);
    const extractedData = (uploadData as any)?.extracted_data;
    const text = extractedData?.text || extractedData?.summary || "";
    void applyMarkdown(quill, buildMarkdownWithTitle(title, text), suppressRef);
  }, [uploadData, uploadErrorMessage]);

  {/* 외부 클릭 시 패널 닫기 */ }
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

  {/* 수학식 편집기 외부 클릭 시 닫기 */ }
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!mathOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest(".sg-math-editor")) return;
      if (t.closest(".sg-math-block")) return;
      setMathOpen(false);
      mathOpenRef.current = false;
      mathTargetElRef.current = null;
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [mathOpen]);

  useEffect(() => {
    if (!mathOpen) return;

    let raf: number | null = null;

    const updateMathPos = () => {
      const el = mathTargetElRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      setMathPos({
        top: rect.bottom + 10,
        left: rect.left,
      });
    };

    const schedule = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateMathPos);
    };

    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    const roTarget =
      documentContainerRef.current ??
      document.querySelector(".doc-pane") ??
      document.querySelector(".center-split-root");

    const ro = roTarget ? new ResizeObserver(schedule) : null;
    if (ro && roTarget) ro.observe(roTarget);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (ro) ro.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [mathOpen]);

  {/* 페이지 스크롤 시 패널 위치 업데이트 */ }
  useEffect(() => {
    const onScroll = () => {
      if (!showFloating) return;
      setShowFloating(false);
      savedRangeRef.current = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showFloating]);

  {/* 페이지 여백 설정 */ }
  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };
  {/* 패널 위치 업데이트 */ }
  const updatePositions = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = 75;
    const targetTop = 70 + Math.max(0, scrollTop - scrollThreshold);
    setPanelTop(targetTop);
  };

  {/* 제목 정규화 */ }
  const normalizeTitle = (raw?: string | null) => {
    if (!raw) return "";
    return raw.replace(/\.pdf$/i, "").trim();
  };

  {/* 페이지 진입 시 draftText가 있으면 타이핑 애니메이션으로 입력 시작. 단, 이미 타이핑이 시작된 경우나 업로드 결과가 있는 경우에는 무시하여 중복 실행 방지 */ }
  const buildMarkdownWithTitle = (title?: string, body?: string) => {
    const heading = title ? `# ${title}\n\n` : "";
    return `${heading}${body ?? ""}`.trimEnd();
  };

  {/* 선택된 범위에 줄 높이 적용 */ }
  const applyLineHeightToSavedRange = (lineHeight: string) => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    const saved = savedRangeRef.current;
    if (!quill || !saved) return;

    quill.setSelection(saved.index, saved.length, "silent");

    const [lineStart] = quill.getLine(saved.index);
    const [lineEnd] = quill.getLine(saved.index + Math.max(saved.length - 1, 0));

    if (!lineStart || !lineEnd) return;
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

  {/* HTML에서 주제 추출 */ }
  const extractTopicFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const heading = div.querySelector("h1, h2, h3");
    return (heading?.textContent || "").trim();
  };

  {/* 패널 콘텐츠 렌더링 */ }
  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      const quill = quillRef.current;
      
      // Quill 에디터에서 직접 텍스트 읽기
      let currentDocumentText = documentText;
      if (quill && (!currentDocumentText || currentDocumentText.trim().length === 0)) {
        const html = quill.root.innerHTML;
        const div = document.createElement("div");
        div.innerHTML = html;
        currentDocumentText = (div.textContent || div.innerText || "").trim();
      }
      
      const topicId = extractTopicFromHtml(quill?.root?.innerHTML || "");
      
      console.log('🔍 [Center.tsx] Chatbot에 전달:', { 
        documentText: currentDocumentText?.substring(0, 100), 
        docLength: currentDocumentText?.length,
        topicId,
        stateDocLength: documentText?.length
      });
      
      return <Chatbot documentText={currentDocumentText} topicId={topicId} />;
    }

    if (activeTab === 'feedback') return <Feedback />;
    return <Search />;
  };

  {/* PDF 내보내기 */ }
  const handleExportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;
    await exportPdf(quill, margins, fontSize);
  };

  {/* 현재 선택된 글꼴 라벨 */ }
  const currentFontLabel = getFontLabel(fontLabel || selectedFont);

  {/* 선택된 범위에 형식 적용 */ }
  const applyFormatToSavedRange = (name: string, value: any) => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    const saved = savedRangeRef.current;
    if (!quill || !saved) return;

    quill.setSelection(saved.index, saved.length, "silent");
    quill.format(name as any, value);
    quill.focus();
  };

  return (
    <Layout activeMenu="summary">
      <div className="center-split-root">
        <Group orientation="horizontal" className="center-split-group">
          <Panel defaultSize={18} minSize={14} maxSize={50} className="pane pane-left">
            <div className="left-pane">
              <button className="left-pane-btn" onClick={handleExportPdf} title="저장(PDF)">
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
                  {tablePlus && (
                    <>
                      {/* 열 추가(오른쪽) */}
                      <div
                        className="sg-table-plus sg-table-plus--col"
                        style={{
                          top: tablePlus.top + tablePlus.h / 2 - 32,
                          left: tablePlus.left + tablePlus.w + 10,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          tableApiRef.current.addCol?.("right");
                          requestAnimationFrame(() => tableApiRef.current.refresh?.());
                        }}
                        title="열 추가"
                      >
                        +
                      </div>

                      {/* 행 추가(아래) */}
                      <div
                        className="sg-table-plus sg-table-plus--row"
                        style={{
                          top: tablePlus.top + tablePlus.h + 10,
                          left: tablePlus.left + tablePlus.w / 2 - 32,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          tableApiRef.current.addRow?.("below");
                          requestAnimationFrame(() => tableApiRef.current.refresh?.());
                        }}
                        title="행 추가"
                      >
                        +
                      </div>
                    </>
                  )}
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

                  {mathOpen && createPortal(
                    <div
                      className="sg-math-editor"
                      style={{ top: `${mathPos.top}px`, left : `${mathPos.left}px` }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        ref={mathInputRef}
                        className="sg-math-textarea"
                        value={mathTex}
                        placeholder="LaTeX 입력 예: \\frac{a}{b}"
                        onChange={(e) => {
                          const next = e.target.value;
                          setMathTex(next);

                          const el = mathTargetElRef.current;
                          if (!el) return;

                          el.setAttribute("data-tex", next);
                          el.innerHTML = renderKatexHtml(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            const el = mathTargetElRef.current;
                            if (el) {
                              const prev = mathPrevTexRef.current;
                              el.setAttribute("data-tex", prev);
                              el.innerHTML = renderKatexHtml(prev);
                            }
                            setMathOpen(false);
                            mathOpenRef.current = false;
                            mathTargetElRef.current = null;
                          }
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            e.preventDefault();
                            setMathOpen(false);
                            mathOpenRef.current = false;
                            mathTargetElRef.current = null;
                          }
                        }}
                      />

                      <div className="sg-math-actions">
                        <button
                          type="button"
                          className="sg-math-btn"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setMathOpen(false);
                            mathOpenRef.current = false;
                            mathTargetElRef.current = null;
                          }}
                        >
                          완료
                        </button>

                        <button
                          type="button"
                          className="sg-math-btn ghost"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const el = mathTargetElRef.current;
                            if (el) {
                              const prev = mathPrevTexRef.current;
                              el.setAttribute("data-tex", prev);
                              el.innerHTML = renderKatexHtml(prev);
                            }
                            setMathOpen(false);
                            mathOpenRef.current = false;
                            mathTargetElRef.current = null;
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Separator className="resize-handle" />

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

