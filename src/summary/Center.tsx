import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {marked} from "marked";
import Quill from 'quill';
import QuillMarkdown from 'quilljs-markdown';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'
import 'quill/dist/quill.snow.css';
import { pdfExporter } from "quill-to-pdf";
import { saveAs } from "file-saver";
import Header from '../components/Header';
import Chatbot from '../helper/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
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
const Size = Quill.import('formats/size') as any;
Size.whitelist = ['small', false, 'large', 'huge'];
Quill.register(Size, true);

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
  const [activePageIdx, setActivePageIdx] = useState(0);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const suppressRef = useRef(false);
  const loadedOnceRef = useRef(false);
  const [docHtml, setDocHtml] = useState<string>('');

  
  // Initialize pages with draft if available
  const getInitialPages = () => {
    // 타이핑 효과를 위해 빈 페이지로 시작
    return [''];
  };
  
  const [pages, setPages] = useState<string[]>(getInitialPages());
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showLineSpacingPicker, setShowLineSpacingPicker] = useState(false);
  const [showMarginSettings, setShowMarginSettings] = useState(false);
  const [margins, setMargins] = useState({ top: 71, bottom: 71, left: 83, right: 83 });
  const measureRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quillInstances = useRef<(Quill | null)[]>([]);
  const suppressChangeRef = useRef<boolean[]>([]);
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
  
  // Center에서 draftText 받아서 pages[0]에 html로 세팅
  useEffect(() => {
    if (!draftText) return;

    (async () => {
      const html = await marked.parse(draftText);
      console.log("MD -> HTML:", html);

      setPages(prev => {
        const next = prev.length ? [...prev] : [""];
        next[0] = html;
        return next;
      });
    })();
  }, [draftText]);

  // Typing effect initialization
  useEffect(() => {
    if (hasTypingStartedRef.current) return;
    
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
      
      // quill.setText("");
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


  // ✅ 1) Quill 생성: 딱 한 번만
  useEffect(() => {
    const el = editorRef.current;
    if (!el || quillRef.current) return;

    const quill = new Quill(el, {
      theme: "snow",
      modules: { toolbar: false },
      formats: [
        "size", "font", "bold", "italic", "underline", "color", "align",
        "header", "list", "blockquote", "code-block",
      ],
      placeholder: "", // 원하면 "문서를 입력하세요"
    });

    // 마크다운 입력 UX
    new QuillMarkdown(quill, {});

    quill.root.style.paddingTop = "8px";

    quillRef.current = quill;
    lastFocusedQuillRef.current = quill;

    // 포맷 버튼 활성화 갱신
    quill.on("selection-change", () => {
      lastFocusedQuillRef.current = quill;
      const selection = quill.getSelection();
      if (selection) {
        const format = quill.getFormat(selection.index, selection.length);
        setIsBoldActive(!!format.bold);
        setIsUnderlineActive(!!format.underline);
        setIsItalicActive(!!format.italic);
      } else {
        setIsBoldActive(false);
        setIsUnderlineActive(false);
        setIsItalicActive(false);
      }
    });

    // 문서 변경 저장
    quill.on("text-change", () => {
      if (suppressRef.current) return;
      setDocHtml(quill.root.innerHTML);
    });

    return () => {
      quillRef.current = null;
    };
  }, []);

  // ✅ 2) fontSize 변경 시: 단일 Quill에만 적용
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    q.root.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  // ✅ 3) 초기 docHtml 로드: 딱 1번만 (새로고침/불러오기용)
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    if (loadedOnceRef.current) return;

    if (docHtml && docHtml.trim().length > 0) {
      suppressRef.current = true;
      q.clipboard.dangerouslyPasteHTML(docHtml);
      setTimeout(() => (suppressRef.current = false), 0);
    }

    loadedOnceRef.current = true;
  }, [docHtml]);




  // Constants
  const pageHeight = 1123 - 71 * 4;
  const contentWidth = 793 - 83 * 2;

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
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        quill.formatText(selection.index, selection.length, 'font', font);
      }
      quill.focus();
    }
    setSelectedFont(font);
    setShowFontPicker(false);
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

  // Update measureRef when fontSize changes
  useEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    measure.style.width = `${contentWidth}px`;
    measure.style.fontSize = `${fontSize}px`;
  }, [fontSize, contentWidth]);


  // Repaginate all pages when font size changes
  useEffect(() => {
    // Combine all pages into one text
    const fullText = pages.join('');
    
    // Re-split from scratch
    const measure = measureRef.current;
    if (!measure) return;
    
    const result: string[] = [];
    let start = 0;
    
    while (start < fullText.length) {
      let low = start + 1;
      let high = fullText.length;
      let fitIndex = start + 1;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = fullText.slice(start, mid);
        measure.textContent = candidate;
        if (measure.scrollHeight <= pageHeight) {
          fitIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      result.push(fullText.slice(start, fitIndex));
      start = fitIndex;
    }
    
    if (result.length === 0) {
      setPages(['']);
    } else {
      setPages(result);
    }
  }, [fontSize]); // Only trigger on fontSize change

  // Quill 생성할 때 "포커스 감지"로 activePageIdx 갱신
  useEffect(() => {
    pageRefs.current.forEach((el, idx) => {
      if (el && !quillInstances.current[idx]) {
        const quill = new Quill(el, { /* ... */ });
        quillInstances.current[idx] = quill;

        quill.on("selection-change", (range) => {
          if (range) setActivePageIdx(idx);
        });
      }
    });
  }, [pages, fontSize /* 필요한 것들 */]);

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
    const html = await marked.parse(md);

    setPages(prev => {
      const next = prev.length ? [...prev] : [""];
      next[0] = html;
      return next;
    });
  };

  // Panel content renderer
  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      const htmlToText = (html: string) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
      };
      const documentText = pages.map(htmlToText).join('\n\n');
      return <Chatbot documentText={documentText} />;
    }

    if (activeTab === 'feedback') {
      return <Feedback />;
    }

    return <Search />;
  };

  // Center 컴포넌트 내부에 추가
  const exportPdf = async () => {
    const quill = quillRef.current;
    if (!quill) return;

    // ✅ quill의 raw content (Delta)
    const delta = quill.getContents();

    // ✅ PDF 생성 (Blob 반환)
    const blob = await pdfExporter.generatePdf(delta);

    // ✅ 다운로드
    saveAs(blob as Blob, "document.pdf");
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
            {selectedFont === 'sans-serif' ? 'Sans' : selectedFont === 'serif' ? 'Serif' : 'Mono'}
          </div>
          {showFontPicker && (
            <div className="sidebar-selector-dropdown">
              {['sans-serif', 'serif', 'monospace'].map(font => (
                <div
                  key={font}
                  className={`sidebar-selector-item ${selectedFont === font ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFont(font);
                  }}
                >
                  {font === 'sans-serif' ? 'Sans Serif' : font === 'serif' ? 'Serif' : 'Monospace'}
                </div>
              ))}
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
        <img src={save} alt="sidebar icon" className="sidebar-icon-9" onClick={exportPdf} style={{ cursor: 'pointer' }} />
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

      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          left: -99999,
          top: -99999,
          width: 627,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          visibility: 'hidden',
        }}
      />

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
      <Header activeMenu="summary" />
    </div>
  );
}
