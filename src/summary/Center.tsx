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
  const uploadData = (location.state as any)?.uploadData as
    | { title?: string; text?: string; summary?: string }
    | null;
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

  {/* 페이지 진입 시 draftText가 있으면 타이핑 애니메이션으로 입력 시작. 단, 이미 타이핑이 시작된 경우나 업로드 결과가 있는 경우에는 무시하여 중복 실행 방지 */ }
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

  {/* 타이핑 애니메이션 효과 구현. quill 인스턴스가 준비될 때까지 대기한 후, typingText의 각 문자를 일정 간격으로 에디터에 삽입. 컴포넌트가 언마운트되거나 타이핑이 중단될 때 타이머 정리하여 메모리 누수 방지 */ }
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

  {/* Quill 에디터 초기화 및 관련 이벤트 핸들링을 위한 커스텀 훅 사용. getUniformFontInRange 함수를 훅에 전달하여 에디터 내 특정 범위의 글꼴이 모두 동일한지 확인하는 기능 제공. 이 함수는 주어진 범위의 콘텐츠를 검사하여 적용된 글꼴을 수집하고, 하나의 글꼴만 존재하면 해당 글꼴을 반환하며, 여러 글꼴이 혼합되어 있거나 기본 글꼴만 존재하는 경우 null 반환 */ }
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

  {/* Quill 에디터 초기화 및 관련 이벤트 핸들링을 위한 커스텀 훅 사용. 여러 상태와 참조를 훅에 전달하여 에디터의 다양한 기능과 상호작용을 관리. 예를 들어, 테이블 플러스 버튼 위치 설정, 수학식 편집기 열기/닫기, 포맷팅 툴바 표시 등 에디터 내에서 발생하는 다양한 이벤트에 대응 */ }
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

  {/* fontSize 상태가 변경될 때마다 Quill 에디터의 루트 요소에 해당 글꼴 크기 적용. quillRef를 통해 현재 Quill 인스턴스에 접근하여 스타일을 직접 수정. 이렇게 하면 에디터 전체의 글꼴 크기가 변경되어 사용자가 입력하는 모든 텍스트에 새로운 크기가 적용 */ }
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    q.root.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  {/* showMarginSettings 상태가 true로 변경될 때마다 Escape 키 이벤트 리스너 등록. 사용자가 Escape 키를 누르면 페이지 여백 설정 패널이 닫히도록 구현. 컴포넌트가 언마운트되거나 showMarginSettings가 false로 변경될 때 이벤트 리스너를 정리하여 메모리 누수 방지 */ }
  useEffect(() => {
    if (!showMarginSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMarginSettings(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMarginSettings]);

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
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

  {/* 페이지 진입 시 draftText가 있으면 타이핑 애니메이션으로 입력 시작. 단, 이미 타이핑이 시작된 경우나 업로드 결과가 있는 경우에는 무시하여 중복 실행 방지 */ }
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

  {/* 업로드된 문서 데이터나 오류 메시지가 변경될 때마다 Quill 에디터에 해당 내용을 마크다운 형식으로 적용. 업로드 결과가 있으면 이를 기반으로 제목과 본문을 구성하여 에디터에 삽입. 만약 업로드 중 오류가 발생한 경우에는 오류 메시지를 마크다운으로 변환하여 에디터에 표시. suppressRef를 사용하여 이 과정에서 발생하는 이벤트를 일시적으로 무시하도록 설정하여 불필요한 이벤트 핸들러 실행 방지 */ }
  useEffect(() => {
    if (!uploadData && !uploadErrorMessage) return;
    const quill = quillRef.current;
    if (!quill) return;

    if (uploadErrorMessage) {
      void applyMarkdown(quill, uploadErrorMessage, suppressRef);
      return;
    }

    const title = normalizeTitle(uploadData?.title);
    const text = uploadData?.text || uploadData?.summary || "";
    void applyMarkdown(quill, buildMarkdownWithTitle(title, text), suppressRef);
  }, [uploadData, uploadErrorMessage]);

  {/* 에디터 내에서 마우스 다운 이벤트를 감지하여 포맷팅 툴바나 수학식 편집기 등 특정 UI 요소가 열려 있을 때 외부 클릭을 감지하여 해당 요소들을 닫는 기능 구현. 예를 들어, showFloating이 true인 경우에만 이벤트 리스너가 활성화되어 툴바 외부 클릭 시 툴바가 닫히도록 함. mathOpen이 true인 경우에도 수학식 편집기 외부 클릭 시 편집기가 닫히도록 구현. 컴포넌트가 언마운트될 때 이벤트 리스너를 정리하여 메모리 누수 방지 */ }
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

  {/* mathOpen이 true인 경우에만 이벤트 리스너가 활성화되어 수학식 편집기 외부 클릭 시 편집기가 닫히도록 구현. 컴포넌트가 언마운트될 때 이벤트 리스너를 정리하여 메모리 누수 방지 */ }
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

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  useEffect(() => {
    const onScroll = () => {
      if (!showFloating) return;
      setShowFloating(false);
      savedRangeRef.current = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showFloating]);

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setMargins(prev => ({ ...prev, [side]: value }));
  };
  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const updatePositions = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollThreshold = 75;
    const targetTop = 70 + Math.max(0, scrollTop - scrollThreshold);
    setPanelTop(targetTop);
  };

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const normalizeTitle = (raw?: string | null) => {
    if (!raw) return "";
    return raw.replace(/\.pdf$/i, "").trim();
  };

  {/* 페이지 진입 시 draftText가 있으면 타이핑 애니메이션으로 입력 시작. 단, 이미 타이핑이 시작된 경우나 업로드 결과가 있는 경우에는 무시하여 중복 실행 방지 */ }
  const buildMarkdownWithTitle = (title?: string, body?: string) => {
    const heading = title ? `# ${title}\n\n` : "";
    return `${heading}${body ?? ""}`.trimEnd();
  };

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
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

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const extractTopicFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const heading = div.querySelector("h1, h2, h3");
    return (heading?.textContent || "").trim();
  };

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      const topicId = extractTopicFromHtml(quillRef.current?.root?.innerHTML || "");
      return <Chatbot documentText={documentText} topicId={topicId} />;
    }

    if (activeTab === 'feedback') return <Feedback />;
    return <Search />;
  };

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const handleExportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;
    await exportPdf(quill, margins, fontSize);
  };

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
  const currentFontLabel = getFontLabel(fontLabel || selectedFont);

  {/* 페이지 스크롤 시 패널 위치 업데이트. 스크롤 이벤트에 대한 디바운스 처리로 성능 최적화. 사용자가 페이지를 스크롤할 때마다 updatePositions 함수가 호출되어 패널의 top 위치를 조정하여 항상 화면 상단에서 일정 간격을 유지하도록 함. 컴포넌트가 언마운트될 때 이벤트 리스너와 타이머를 정리하여 메모리 누수 방지 */ }
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