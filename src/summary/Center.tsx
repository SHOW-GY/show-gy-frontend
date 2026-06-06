import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type Quill from 'quill';
import { useLocation, useParams } from 'react-router-dom';
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
import { convertAllTableSyntax } from "./table/parseTableSyntax";
import { useQuillInit } from "./hooks/useQuillInit";
import { applyMarkdown } from "./utils/markdown";
import { exportPdf } from "./utils/pdf";
import { FONT_LIST, getFontLabel } from "./fonts";
import { getDocumentById, saveDocumentContent, editDocument, releaseEditing, getApprovedDocuments, evaluateDocument, getLeaderStyle, submitDocument } from '../apis/documentApi';
import type { LeaderStyleResponse } from '../apis/documentApi';
import type {
  FormatHints,
  PdfStyleHint,
  ChatbotFeedbackItem,
  ChatbotReferenceSource,
} from '../helper/chatbot/chatbot.types';

export default function Center() {
  const location = useLocation();
  const { documentId: paramDocumentId } = useParams<{ documentId: string }>();
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
  
  const uploadErrorMessage = (location.state as any)?.uploadErrorMessage as string | null;
  // 원본 doc id를 documentId로 잡으면, 복사본 생성 후 setDocumentId(copyId) 시점에
  // [documentId] 의존 cleanup이 원본 id로 releaseEditing PATCH를 보내서 원본 status를
  // 'pending'으로 잘못 바꿔버린다. 결과: waitForExtraction이 'pending'을 보고 폴링 진입 →
  // 로딩 화면이 60초 이상 멈춤. copy id가 결정된 뒤에만 documentId를 세팅한다.
  const [documentId, setDocumentId] = useState<number | undefined>(undefined);
  // 현재 화면의 doc 이 작업본인지 식별 — null/undefined 이면 원본
  const [docSourceId, setDocSourceId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentText, setDocumentText] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(!!paramDocumentId);
  const [loadError, setLoadError] = useState<string>('');
  const saveTimerRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const titleInitializedRef = useRef(false);  // 첫 로드 시점의 title 세팅으로 인한 auto-save 트리거 방지

  // 팀장(승인자) 누적 스타일 — 문서 로드 시 한 번 가져와서 PDF 내보내기에 사용
  const [leaderStyle, setLeaderStyle] = useState<LeaderStyleResponse["data"]>(null);
  // 사용자가 마진을 직접 조정했는지 — 조정했으면 leader style로 덮어쓰지 않음
  const userOverrodeMarginsRef = useRef(false);

  // 챗봇이 push하는 사이드 패널 데이터 (탭 전환에도 보존)
  const [feedbackItems, setFeedbackItems] = useState<ChatbotFeedbackItem[]>([]);
  const [referenceSources, setReferenceSources] = useState<ChatbotReferenceSource[]>([]);
  // apply 후 강제 리렌더용 — 챗봇에 전달되는 deltaDocument 스냅샷을 갱신해 재평가가 최신 본문을 채점하게 함
  const [docVersion, setDocVersion] = useState(0);
  void docVersion;

  // 평가 관련 state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [approvedDocs, setApprovedDocs] = useState<Array<{ id: number; title: string; approver_id: string; register_date: string | null }>>([]);
  const [selectedRefId, setSelectedRefId] = useState<number | undefined>();
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

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

  {/* 에디터 떠날 때 편집 상태 해제 */}
  useEffect(() => {
    return () => {
      if (documentId) {
        releaseEditing({ document_id: String(documentId) }).catch(() => {});
      }
    };
  }, [documentId]);

  {/* URL 파라미터로 문서 로드 (업로드/Library 모두 동일한 흐름) */}
  useEffect(() => {
    if (!paramDocumentId) return;
    let cancelled = false;

    const applyDocToEditor = (doc: any) => {
      const quill = quillRef.current;
      if (!quill) return;

      // delta_document가 있으면 우선 사용 (편집 서식 보존)
      if (doc.extracted_data?.delta_document?.ops) {
        quill.setContents(doc.extracted_data.delta_document);
        // setContents는 source='api'라 useQuillInit의 text-change 핸들러가 ::table 변환을 안 함 → 명시 호출
        convertAllTableSyntax(quill);
      }
      // [DISABLED 2026-05-06] visual_html 분기 — 백엔드 비주얼 파이프라인 비활성화로 미사용.
      // 재활성화 시 아래 블록 주석 해제 + 백엔드 run_extraction_pipeline의 2-b 블록도 함께 활성화.
      // spec: docs/superpowers/specs/2026-05-06-pdf-visual-fidelity-design.md
      //
      // else if (typeof doc.extracted_data?.visual_html === 'string' && doc.extracted_data.visual_html.trim()) {
      //   suppressRef.current = true;
      //   quill.setText('');
      //   quill.clipboard.dangerouslyPasteHTML(doc.extracted_data.visual_html);
      //   setTimeout(() => (suppressRef.current = false), 0);
      // }
      else if (doc.extracted_data?.text) {
        suppressRef.current = true;
        void applyMarkdown(quill, doc.extracted_data.text, suppressRef);
      }
    };

    // 종료 판정 헬퍼 — polling을 끊어도 되는 상태인지 검사.
    // 텍스트 *또는 delta_document* 가 있으면 사용자가 볼 수 있는 상태 → 종료.
    // (summarize 흐름은 text 없이 delta_document 만 있는 경우가 있음 — 그때도 종료해야 무한 polling 회피)
    // 그 외엔 명시적 완료/실패 상태만 종료.
    const isDoneStatus = (res: any): boolean => {
      const status = res?.data?.status;
      const extracted = res?.data?.extracted_data;
      const hasText = !!extracted?.text;
      const hasDelta = !!extracted?.delta_document &&
        (Array.isArray(extracted.delta_document?.ops)
          ? extracted.delta_document.ops.length > 0
          : true);
      if (hasText || hasDelta) return true;
      if (status === 'completed' || status === 'editing' || status === 'approved' || status === 'pending') return true;
      if (status === 'failed' || status === 'ocr_process') return true;
      return false;
    };

    const waitForExtraction = async (id: number, maxAttempts = 120): Promise<any> => {
      // 1) 캐시 hit 시 즉시 반환 — 뒤로가기/재진입 케이스에서 polling 0번
      const firstRes = await getDocumentById(id, { staleMs: 60_000 });
      if (isDoneStatus(firstRes)) return firstRes;

      // 2) 미완료면 polling (max 2분, 1.5초 간격) — 학술 논문 OCR이 30~60초 걸려서 필요
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) throw new Error('cancelled');
        const res = await getDocumentById(id, { force: true });
        if (isDoneStatus(res)) return res;
        await new Promise(r => setTimeout(r, 1500));
      }
      if (cancelled) throw new Error('cancelled');
      return await getDocumentById(id, { force: true });
    };

    const loadDocument = async () => {
      setIsLoadingDoc(true);
      setLoadError('');
      try {
        // 1. 추출 완료 대기
        const initialRes = await waitForExtraction(Number(paramDocumentId));
        if (cancelled) return;

        // 2. start-editing (복사본 생성)
        let targetId = Number(paramDocumentId);
        try {
          const editRes = await editDocument({ document_id: paramDocumentId! });
          if (editRes?.data?.copy_document_id) {
            targetId = editRes.data.copy_document_id;
            const copyRes = await getDocumentById(targetId);
            if (cancelled) return;
            setDocumentId(copyRes.data.id);
            setDocSourceId(copyRes.data.source_document_id ?? null);
            setDocumentTitle(copyRes.data.title || '');
            titleInitializedRef.current = true;
            applyDocToEditor(copyRes.data);
          } else {
            setDocumentId(initialRes.data.id);
            setDocSourceId(initialRes.data.source_document_id ?? null);
            setDocumentTitle(initialRes.data.title || '');
            titleInitializedRef.current = true;
            applyDocToEditor(initialRes.data);
          }
        } catch (editErr) {
          // start-editing 실패해도 원본은 로드
          setDocumentId(initialRes.data.id);
          setDocSourceId(initialRes.data.source_document_id ?? null);
          setDocumentTitle(initialRes.data.title || '');
          titleInitializedRef.current = true;
          applyDocToEditor(initialRes.data);
        }
      } catch (e) {
        if (cancelled) return;
        console.error('문서 로드 실패:', e);
        setLoadError('문서를 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setIsLoadingDoc(false);
      }
    };

    loadDocument();
    return () => { cancelled = true; };
  }, [paramDocumentId]);

  {/* draftText 처리 */}
  useEffect(() => {
    if (paramDocumentId || uploadErrorMessage) return;
    if (!draftText) return;
    const quill = quillRef.current;
    if (!quill) return;

    void applyMarkdown(quill, draftText, suppressRef);
  }, [draftText]);

  {/* 팀장(승인자) 누적 스타일 자동 로드 — PDF 내보내기 / 챗봇 hint에 사용 */}
  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getLeaderStyle(documentId);
        if (cancelled) return;
        if (res.has_data && res.data) {
          setLeaderStyle(res.data);
          // 사용자가 마진을 직접 조정하지 않았으면 팀장 마진으로 자동 적용
          if (!userOverrodeMarginsRef.current && res.data.margins) {
            setMargins(res.data.margins);
          }
        }
      } catch (err) {
        // 누적 데이터 없음 (404 등) — 사용자 기본값 유지
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  {/* 타이핑 상태 초기화 */ }
  useEffect(() => {
    if (hasTypingStartedRef.current) return;
    if (paramDocumentId || uploadErrorMessage) return;

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

  {/* 탭 전환 후 chat으로 돌아올 때 스크롤 복구 (display:none → block reflow 문제) */ }
  useEffect(() => {
    if (activeTab !== 'chat') return;
    // 다음 프레임에서 채팅 컨테이너의 스크롤을 맨 아래로
    requestAnimationFrame(() => {
      const chatContainer = document.querySelector('.panel-chat-container') as HTMLElement | null;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }, [activeTab]);

  {/* 업로드 오류 메시지 표시 */ }
  useEffect(() => {
    if (!uploadErrorMessage) return;
    const quill = quillRef.current;
    if (!quill) return;
    void applyMarkdown(quill, uploadErrorMessage, suppressRef);
  }, [uploadErrorMessage]);

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
    userOverrodeMarginsRef.current = true;
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

  {/* 자동 저장 (5초 debounce) */}
  useEffect(() => {
    if (!documentId || !documentText) return;

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      const quill = quillRef.current;
      if (!quill) return;
      const delta = quill.getContents();
      try {
        setIsSaving(true);
        await saveDocumentContent(documentId, delta, documentTitle.trim() || undefined);
      } catch (e) {
        console.error('자동 저장 실패:', e);
      } finally {
        setIsSaving(false);
      }
    }, 5000);

    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [documentText, documentId, documentTitle]);

  {/* HTML에서 주제 추출 */ }
  const extractTopicFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const heading = div.querySelector("h1, h2, h3");
    return (heading?.textContent || "").trim();
  };

  {/* 패널 콘텐츠 렌더링 — 3개 모두 항상 mount하고 display로 토글
       (탭 전환 시 챗봇 대화 내역 초기화 방지) */ }
  const renderPanelContent = () => {
    {
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

      const deltaDocument = quill ? quill.getContents() : undefined;

      const handleFinalEdit = (
        delta: { ops: any[] },
        removedSentences?: string[],
        editedSentences?: Array<{ original: string; edited_sentence: string }>,
        formatHints?: FormatHints,
        pdfStyleHint?: PdfStyleHint,
      ) => {
        if (!quill) return;

        // surgical 편집: 삭제할 문장을 원본에서 찾아서 제거
        if (removedSentences && removedSentences.length > 0) {
          const fullText = quill.getText();
          // 뒤에서부터 삭제해야 앞쪽 index가 밀리지 않음
          const positions: Array<{ idx: number; len: number }> = [];
          for (const sentence of removedSentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;
            const idx = fullText.indexOf(trimmed);
            if (idx !== -1) {
              positions.push({ idx, len: trimmed.length });
            }
          }
          positions.sort((a, b) => b.idx - a.idx); // 뒤에서부터
          for (const { idx, len } of positions) {
            quill.deleteText(idx, len);
          }

          // 빈 줄 정리: 번호만 남은 줄("4. ", "8.") 또는 공백만 있는 줄 제거
          let cleaned = quill.getText();
          const lines = cleaned.split('\n');
          const emptyLineIndices: Array<{ start: number; len: number }> = [];
          let cursor = 0;
          for (const line of lines) {
            const stripped = line.trim();
            // 빈 줄, 번호만 남은 줄 (예: "4.", "8. ", "10.")
            if (stripped === '' || /^\d+\.\s*$/.test(stripped) || /^[-•]\s*$/.test(stripped)) {
              emptyLineIndices.push({ start: cursor, len: line.length + 1 }); // +1 for \n
            }
            cursor += line.length + 1;
          }
          // 뒤에서부터 제거
          for (let i = emptyLineIndices.length - 1; i >= 0; i--) {
            const { start, len } = emptyLineIndices[i];
            if (start < quill.getLength()) {
              quill.deleteText(start, Math.min(len, quill.getLength() - start));
            }
          }
        }

        // surgical 편집: 수정할 문장을 원본에서 찾아서 교체
        if (editedSentences && editedSentences.length > 0) {
          for (const edit of editedSentences) {
            const fullText = quill.getText();
            const orig = edit.original?.trim();
            const replacement = edit.edited_sentence?.trim();
            if (!orig || !replacement) continue;
            const idx = fullText.indexOf(orig);
            if (idx !== -1) {
              quill.deleteText(idx, orig.length);
              quill.insertText(idx, replacement);
            }
          }
        }

        // fallback: surgical 정보 없으면 전체 Delta 교체
        if ((!removedSentences || removedSentences.length === 0) &&
            (!editedSentences || editedSentences.length === 0) &&
            delta.ops.length > 0) {
          quill.setContents(delta as any);
          convertAllTableSyntax(quill);
        }

        // 팀장 스타일 적용 트리거 — formatHints를 Quill 전체에 즉시 적용
        if (formatHints && Object.keys(formatHints).length > 0) {
          const length = quill.getLength();
          if (length > 0) {
            const attrs: Record<string, any> = {};
            if (formatHints.font) attrs.font = formatHints.font;
            // line-height/indent는 Quill 표준 attribute가 아니라 지원 폰트 한정
            if (Object.keys(attrs).length > 0) {
              quill.formatText(0, length, attrs);
              // selectedFont state도 동기화 (툴바 라벨 갱신)
              if (formatHints.font) {
                setSelectedFont(formatHints.font);
                setFontLabel(formatHints.font);
              }
            }
          }
        }

        // PDF 스타일 hint — 마진/페이지 크기는 PDF 내보내기 시 자동 적용되도록
        // leaderStyle state에 반영 (사용자가 마진을 override하지 않은 경우만)
        if (pdfStyleHint && pdfStyleHint.margins && !userOverrodeMarginsRef.current) {
          setMargins(pdfStyleHint.margins);
        }
      };

      // 부정문 하이라이트: 원본 서식 유지 + 해당 문장만 빨간색/밑줄/볼드
      const handleHighlight = (sentences: string[]) => {
        if (!quill || !sentences.length) return;
        const fullText = quill.getText();

        for (const sentence of sentences) {
          const trimmed = sentence.trim();
          if (!trimmed) continue;

          let searchFrom = 0;
          while (searchFrom < fullText.length) {
            const idx = fullText.indexOf(trimmed, searchFrom);
            if (idx === -1) break;
            quill.formatText(idx, trimmed.length, {
              color: '#dc2626',
              underline: true,
              bold: true,
            } as any);
            searchFrom = idx + trimmed.length;
          }
        }
      };

      // 하이라이트 해제: 전체 텍스트에서 빨간색/밑줄/볼드 제거
      const handleClearHighlight = () => {
        if (!quill) return;
        const length = quill.getLength();
        quill.formatText(0, length, {
          color: false,
          underline: false,
          bold: false,
        } as any);
      };

      // 챗봇이 직전 제안을 적용한 '보완된 전체 문서'를 받아 Quill 에 통째로 반영.
      // LLM 응답이 plain text 또는 약한 markdown 이므로 applyMarkdown 으로 일관되게 렌더링.
      const handleApplyDocument = (revisedDocument: string) => {
        if (!quill || !revisedDocument) return;
        // 부정문 하이라이트 잔류 방지 (같은 클로저 안의 handler 직접 호출)
        handleClearHighlight();
        // undo(되돌리기)는 *원본 HTML*(previous_document)을 복원한다. 이걸 마크다운 파서에 넣으면
        // 태그가 깨져 양식이 풀리므로, HTML 로 보이면 마크다운 변환 없이 그대로 붙여 서식 보존.
        const looksLikeHtml = /<\/?(p|h[1-6]|ul|ol|li|div|table|tr|td|strong|em|b|i|br|span)\b/i.test(revisedDocument);
        if (looksLikeHtml) {
          suppressRef.current = true;
          quill.setText("");
          quill.clipboard.dangerouslyPasteHTML(revisedDocument);
          setTimeout(() => { suppressRef.current = false; }, 0);
          setDocVersion((v) => v + 1);
          return;
        }
        // apply(마크다운) 결과는 applyMarkdown 으로 렌더. 완료 후 강제 리렌더 →
        // renderPanelContent 의 deltaDocument(quill.getContents())가 최신 본문으로 갱신.
        void applyMarkdown(quill, revisedDocument, suppressRef).then(() => setDocVersion((v) => v + 1));
      };

      return (
        <>
          <div style={{
            display: activeTab === 'chat' ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            <Chatbot
              documentId={documentId}
              documentText={currentDocumentText}
              topicId={topicId}
              deltaDocument={deltaDocument}
              onFinalEdit={handleFinalEdit}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
              onFeedback={setFeedbackItems}
              onReferences={setReferenceSources}
              onApplyDocument={handleApplyDocument}
            />
          </div>
          <div style={{ display: activeTab === 'feedback' ? 'block' : 'none', height: '100%' }}>
            <Feedback items={feedbackItems} />
          </div>
          <div style={{ display: activeTab === 'reference' ? 'block' : 'none', height: '100%' }}>
            <Search sources={referenceSources} />
          </div>
        </>
      );
    }
  };

  {/* PDF 내보내기 */ }
  const handleExportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;
    // 팀장 누적 폰트가 있으면 PDF에도 적용 (Quill 키 → CSS family는 pdf.ts에서 매핑)
    const leaderFont = leaderStyle?.fontFamily || null;
    // 기본 이름은 현재 문서 제목(확장자 제거)에서 가져오고, 사용자가 prompt로 수정 가능
    const defaultName = (documentTitle || '').replace(/\.[a-zA-Z0-9]{1,8}$/, '').trim() || 'document';
    const input = window.prompt('내보낼 PDF 파일 이름을 입력하세요 (.pdf 자동 추가)', defaultName);
    if (input === null) return;  // 사용자 취소
    const finalName = input.trim() || defaultName;
    await exportPdf(quill, margins, fontSize, leaderFont, finalName);
  };

  {/* 명시적 저장 — 자동저장(5초 debounce)과 별개로 즉시 백엔드 반영. 보관함의 그 문서가 갱신됨. */}
  const handleSaveNow = async () => {
    if (!documentId) return;
    const quill = quillRef.current;
    if (!quill) return;

    // 진행 중이던 debounce 자동저장은 취소 (중복 PATCH 방지)
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const delta = quill.getContents();
    const title = documentTitle.trim();
    if (!title) {
      alert('제목을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      await saveDocumentContent(documentId, delta, title);
      alert('저장되었습니다.');
    } catch (e: any) {
      console.error('저장 실패:', e);
      const detail = e?.response?.data?.detail;
      alert(typeof detail === 'string' ? detail : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  {/* 문서 평가하기 */ }
  const handleOpenEval = async () => {
    if (!documentId) return;
    setShowEvalModal(true);
    setEvalResult(null);
    try {
      const res = await getApprovedDocuments(documentId);
      setApprovedDocs(res.data || []);
      setSelectedRefId(res.default_ref_id || undefined);
    } catch (e) {
      console.error('승인 문서 목록 조회 실패:', e);
      setApprovedDocs([]);
    }
  };

  const handleEvaluate = async () => {
    if (!documentId) return;
    setIsEvaluating(true);
    try {
      const res = await evaluateDocument(documentId, selectedRefId);
      setEvalResult(res);
    } catch (e: any) {
      setEvalResult({ status: 'error', message: e?.response?.data?.detail || '평가 요청 실패' });
    } finally {
      setIsEvaluating(false);
    }
  };

  {/* 현재 선택된 글꼴 라벨 */ }
  const currentFontLabel = getFontLabel(fontLabel || selectedFont);

  {/* 선택된 범위에 형식 적용 */ }
  const applyFormatToSavedRange = (name: string, value: any) => {
    const quill = lastFocusedQuillRef.current ?? quillRef.current;
    const saved = savedRangeRef.current;
    if (!quill || !saved) return;

    quill.setSelection(saved.index, saved.length, "silent");
    // source="user" 명시 — userOnly:true history 가 기록하도록 (Cmd+Z 가능)
    quill.format(name as any, value, "user" as any);
    quill.focus();
  };

  return (
    <Layout activeMenu="summary">
      <div className="center-split-root">
        <Group orientation="horizontal" className="center-split-group">
          <Panel defaultSize={18} minSize={14} maxSize={50} className="pane pane-left">
            <div className="left-pane">
              {documentId && (
                <button
                  className="left-pane-btn"
                  onClick={handleSaveNow}
                  title="저장 (보관함에 즉시 반영)"
                  disabled={isSaving}
                  style={{ fontSize: '11px', fontWeight: 600, padding: '8px 4px' }}
                >
                  {isSaving ? '저장중' : '저장'}
                </button>
              )}

              <button className="left-pane-btn" onClick={handleExportPdf} title="PDF 다운로드">
                <img src={saveIcon} alt="PDF 다운로드" />
              </button>

              <button
                className="left-pane-btn"
                onClick={() => setShowMarginSettings(true)}
                title="페이지 여백"
              >
                <img src={settingsIcon} alt="settings" />
              </button>

              {documentId && (
                <button
                  className="left-pane-btn"
                  onClick={handleOpenEval}
                  title="문서 평가"
                  style={{ fontSize: '11px', fontWeight: 600, padding: '8px 4px' }}
                >
                  평가
                </button>
              )}

              {documentId && docSourceId != null && (
                <button
                  className="left-pane-btn"
                  onClick={async () => {
                    if (isSubmitting) return;
                    if (!confirm('팀장에게 검토를 위해 제출하시겠습니까?')) return;
                    setIsSubmitting(true);
                    try {
                      // 제출 전 마지막 저장 (잔류 변경 보존)
                      await handleSaveNow?.();
                      const r = await submitDocument(documentId);
                      alert(r.message || '제출되었습니다. 팀장 승인을 기다려주세요.');
                    } catch (e: any) {
                      alert(e?.response?.data?.message || '제출에 실패했습니다.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  title="팀장에게 검토 요청"
                  style={{ fontSize: '11px', fontWeight: 600, padding: '8px 4px', background: '#3b82f6', color: '#fff' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '제출중' : '제출'}
                </button>
              )}
            </div>
          </Panel>

          <Separator className="resize-handle" />

          <Panel defaultSize={55} minSize={35} className="pane pane-center">
            <div className="doc-pane">
              {/* 상단 툴바 — 제목 입력 전용 (액션 버튼은 좌측 패널) */}
              {documentId && (
                <div className="doc-toolbar">
                  <input
                    type="text"
                    className="document-title-input"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="문서 제목"
                    spellCheck={false}
                    maxLength={200}
                  />
                </div>
              )}
              <div ref={documentContainerRef} className="doc-pane-inner">
                <div
                  className="center-document"
                  style={{
                    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                    position: 'relative',
                  }}
                >
                  <div ref={editorRef} className="document-input" />
                  {(isLoadingDoc || loadError) && (
                    <div
                      style={{
                        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 100, gap: 12,
                      }}
                    >
                      {loadError ? (
                        <p style={{ color: '#dc2626', fontSize: 14 }}>{loadError}</p>
                      ) : (
                        <>
                          <div
                            style={{
                              width: 40, height: 40, border: '3px solid #e5e7eb',
                              borderTop: '3px solid #4f46e5', borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                          <p style={{ color: '#6b7280', fontSize: 13 }}>문서 불러오는 중...</p>
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </>
                      )}
                    </div>
                  )}
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
                                  // source="user" 명시 — userOnly:true history 가 기록하도록 (Cmd+Z 가능)
                                  quill.formatText(saved.index, saved.length, "font", f.key, "user" as any);
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
                                  // source="user" 명시 — userOnly:true history 가 기록하도록 (Cmd+Z 가능)
                                  quill.formatText(saved.index, saved.length, "size", sizeValue, "user" as any);
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

      {/* 문서 평가 모달 */}
      {showEvalModal && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowEvalModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '28px 32px',
              minWidth: 420, maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 18px', fontSize: 18 }}>문서 평가</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                레퍼런스 문서 (비교 기준)
              </label>
              {approvedDocs.length === 0 ? (
                <p style={{ color: '#999', fontSize: 13 }}>팀에 승인된 문서가 없습니다.</p>
              ) : (
                <select
                  value={selectedRefId || ''}
                  onChange={(e) => setSelectedRefId(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid #ddd', fontSize: 13,
                  }}
                >
                  {approvedDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.register_date?.split('T')[0] || '날짜 없음'})
                    </option>
                  ))}
                </select>
              )}
              {approvedDocs.length > 0 && (
                <p style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                  기본값: 가장 최근 승인된 문서
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating || approvedDocs.length === 0}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: approvedDocs.length === 0 ? '#ccc' : '#4f46e5',
                  color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                {isEvaluating ? '평가 중...' : '평가 실행'}
              </button>
              <button
                onClick={() => setShowEvalModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#fff', fontSize: 14, cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>

            {evalResult && (
              <div style={{
                background: evalResult.status === 'error' ? '#fef2f2' : '#f0fdf4',
                borderRadius: 8, padding: '14px 16px', fontSize: 13,
              }}>
                {evalResult.status === 'error' ? (
                  <p style={{ color: '#dc2626', margin: 0 }}>{evalResult.message}</p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#166534' }}>
                      {evalResult.message || '평가 완료'}
                    </p>
                    <p style={{ margin: 0, color: '#555', fontSize: 12 }}>
                      레퍼런스: 문서 #{evalResult.data?.ref_document_id} / 평가 대상: 문서 #{evalResult.data?.inp_document_id}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
}

