import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Header from '../components/Header';
import Chatbot from '../helper/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
// import fontIcon from '../assets/icons/font.png';
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

  // Typing effect execution
  useEffect(() => {
    if (!isTyping || !typingText) return;
    
    const quill = quillInstances.current[0];
    if (!quill) return;
    
    let currentIndex = 0;
    const typingSpeed = 30; // ms per character
    let typingTimeoutId: number | null = null;
    
    const typeNextChar = () => {
      if (currentIndex < typingText.length) {
        const char = typingText[currentIndex];
        const currentLength = quill.getLength();
        
        if (char === '\n') {
          quill.insertText(currentLength - 1, '\n');
        } else {
          quill.insertText(currentLength - 1, char);
        }
        
        currentIndex++;
        typingTimeoutId = window.setTimeout(typeNextChar, typingSpeed);
      } else {
        // 타이핑 완료 - Quill 내용을 pages에 저장
        const html = quill.root.innerHTML;
        setPages([html]);
        setIsTyping(false);
      }
    };
    
    typeNextChar();
    
    return () => {
      if (typingTimeoutId !== null) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [isTyping, typingText, quillInstances.current[0]]);

  // Initialize Quill editors when pages length changes (structure changes only)
  useEffect(() => {
    pageRefs.current.forEach((el, idx) => {
      if (el && !quillInstances.current[idx]) {
        const quill = new Quill(el, {
          theme: 'snow',
          modules: {
            toolbar: false,
          },
          formats: ['size', 'font', 'bold', 'italic', 'underline', 'color'],
          placeholder: idx === 0 ? '문서를 입력하세요' : '',
        });
        
        quill.root.style.fontSize = `${fontSize}px`;
        quill.root.style.paddingTop = '8px';
        
        if (pages[idx]) {
          suppressChangeRef.current[idx] = true;
          quill.clipboard.dangerouslyPasteHTML(pages[idx]);
          setTimeout(() => { 
            suppressChangeRef.current[idx] = false;
          }, 0);
        }

        quill.on('selection-change', () => {
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

        quill.on('text-change', () => {
          if (suppressChangeRef.current[idx]) return;
          const html = quill.root.innerHTML;
          const selection = quill.getSelection();
          const caretPos = selection ? selection.index : 0;
          handlePageChange(idx, html, caretPos);
        });
        
        quillInstances.current[idx] = quill;
      }
    });
  }, [pages.length]);

  // Keep Quill editors in sync with pages content
  useEffect(() => {
    // 타이핑 중에는 동기화 스킵
    if (isTyping) return;
    
    pages.forEach((html, idx) => {
      // 현재 변경 중인 페이지는 스킵
      if (suppressChangeRef.current[idx]) return;
      
      const quill = quillInstances.current[idx];
      if (!quill) return;
      const current = quill.root.innerHTML;
      if (current !== html) {
        suppressChangeRef.current[idx] = true;
        quill.clipboard.dangerouslyPasteHTML(html);
        setTimeout(() => { suppressChangeRef.current[idx] = false; }, 0);
      }
    });
    // Clean up extra quill instances if pages shrank
    for (let i = pages.length; i < quillInstances.current.length; i++) {
      quillInstances.current[i] = null;
    }
    quillInstances.current.length = pages.length;
  }, [pages, isTyping]);

  // Update font size for all Quill instances
  useEffect(() => {
    quillInstances.current.forEach(quill => {
      if (quill) {
        quill.root.style.fontSize = `${fontSize}px`;
      }
    });
  }, [fontSize]);

  // Constants
  const pageHeight = 1123 - 71 * 4;
  const contentWidth = 793 - 83 * 2;

  // Helper: Check if text fits within one page
  const fits = (text: string): boolean => {
    const measure = measureRef.current;
    if (!measure) return true;
    measure.innerHTML = text;
    return measure.scrollHeight <= pageHeight;
  };

  // Helper: Split text into [head, tail] where head is max prefix that fits
  const splitToFit = (text: string): [string, string] => {
    if (fits(text)) {
      return [text, ''];
    }
    
    let low = 0;
    let high = text.length;
    let fitIndex = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = text.slice(0, mid);
      if (fits(candidate)) {
        fitIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    return [text.slice(0, fitIndex), text.slice(fitIndex)];
  };

  // Helper: Reflow pages starting from pageIndex
  const reflowFrom = (pageIndex: number, targetPageForFocus?: number, targetCaretPos?: number) => {
    setPages(prevPages => {
      const newPages = [...prevPages];
      
      // Ensure pageIndex is valid
      if (pageIndex < 0 || pageIndex >= newPages.length) {
        return prevPages;
      }
      
      // Start reflowing from the edited page
      let i = pageIndex;
      while (i < newPages.length) {
        const currentPage = newPages[i];
        
        // Check if current page overflows
        if (!fits(currentPage)) {
          const [head, tail] = splitToFit(currentPage);
          newPages[i] = head;
          
          // Push overflow to next page
          if (i + 1 < newPages.length) {
            newPages[i + 1] = tail + newPages[i + 1];
          } else {
            newPages.push(tail);
          }
          i++;
        } else {
          // Current page fits, try to pull from next page
          if (i + 1 < newPages.length) {
            const combined = currentPage + newPages[i + 1];
            const [head, tail] = splitToFit(combined);
            
            // Only pull if we can fit more
            if (head.length > currentPage.length) {
              newPages[i] = head;
              newPages[i + 1] = tail;
              
              // If next page is now empty, remove it
              if (newPages[i + 1] === '') {
                newPages.splice(i + 1, 1);
              } else {
                i++;
              }
            } else {
              // Can't pull more, move to next page
              i++;
            }
          } else {
            // Last page and it fits, done
            break;
          }
        }
      }
      
      // Remove trailing empty pages
      while (newPages.length > 1 && newPages[newPages.length - 1] === '') {
        newPages.pop();
      }
      
      // Ensure at least one page
      if (newPages.length === 0) {
        newPages.push('');
      }
      
      return newPages;
    });

    // Handle focus and caret positioning after state update
    if (targetPageForFocus !== undefined && targetCaretPos !== undefined) {
      setTimeout(() => {
        const targetQuill = quillInstances.current[targetPageForFocus];
        if (targetQuill) {
          targetQuill.focus();
          targetQuill.setSelection(targetCaretPos, 0);
        }
      }, 0);
    }
  };

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
        // normal은 false로, 나머지는 그대로 적용
        const sizeValue = size === 'normal' ? false : size;
        // formatText 대신 format 메서드를 사용하여 적용
        quill.formatText(selection.index, selection.length, 'size', sizeValue);
        // 선택 유지 및 포커스
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

  // Handle page text change
  const handlePageChange = (pageIndex: number, newText: string, caretPos: number) => {
    // 타이핑 중에는 페이지 분할하지 않고 내용만 업데이트
    if (isTyping) {
      suppressChangeRef.current[pageIndex] = true;
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = newText;
        return newPages;
      });
      setTimeout(() => {
        suppressChangeRef.current[pageIndex] = false;
      }, 0);
      return;
    }
    
    const prevText = pages[pageIndex];
    const wasInsertion = newText.length > prevText.length;
    const wasDeletion = newText.length < prevText.length;
    
    // Check if new text overflows
    const overflows = !fits(newText);
    
    if (overflows && wasInsertion) {
      // Split the text that fits vs overflow
      const [head, tail] = splitToFit(newText);
      
      // Calculate where the caret should be
      let targetPage = pageIndex;
      let targetCaret = caretPos;
      
      if (caretPos > head.length) {
        // Caret is in the overflow area, move to next page
        targetPage = pageIndex + 1;
        targetCaret = caretPos - head.length;
      }
      
      // Update pages - only modify current and next pages
      suppressChangeRef.current[pageIndex] = true;
      
      // 새 페이지를 추가하는 경우 미리 suppressChangeRef 배열 확장
      if (pageIndex + 1 >= pages.length) {
        suppressChangeRef.current[pageIndex + 1] = true;
      } else {
        suppressChangeRef.current[pageIndex + 1] = true;
      }
      
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = head;
        
        // Push tail to next page
        if (pageIndex + 1 < newPages.length) {
          newPages[pageIndex + 1] = tail + newPages[pageIndex + 1];
        } else {
          newPages.push(tail);
        }
        
        return newPages;
      });
      
      setTimeout(() => {
        suppressChangeRef.current[pageIndex] = false;
        suppressChangeRef.current[pageIndex + 1] = false;
      }, 0);
      
      // Move caret to appropriate position
      if (targetPage > pageIndex) {
        setTimeout(() => {
          const nextQuill = quillInstances.current[targetPage];
          if (nextQuill) {
            nextQuill.focus();
            nextQuill.setSelection(targetCaret, 0);
          }
        }, 0);
      }
    } else if (wasDeletion) {
      // Simply update current page, don't pull from next page for pages > 0
      // This prevents affecting previous pages
      suppressChangeRef.current[pageIndex] = true;
      
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = newText;
        
        // Only for first page, try to pull from next page
        if (pageIndex === 0 && pageIndex + 1 < newPages.length) {
          const combined = newPages[pageIndex] + newPages[pageIndex + 1];
          if (fits(combined)) {
            newPages[pageIndex] = combined;
            newPages.splice(pageIndex + 1, 1);
          } else {
            const [head, tail] = splitToFit(combined);
            newPages[pageIndex] = head;
            newPages[pageIndex + 1] = tail;
            
            if (newPages[pageIndex + 1] === '' || newPages[pageIndex + 1] === '<p><br></p>') {
              newPages.splice(pageIndex + 1, 1);
            }
          }
        }
        
        return newPages;
      });
      
      setTimeout(() => {
        suppressChangeRef.current[pageIndex] = false;
      }, 0);
    } else {
      // Normal update, no overflow
      suppressChangeRef.current[pageIndex] = true;
      
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = newText;
        return newPages;
      });
      
      setTimeout(() => {
        suppressChangeRef.current[pageIndex] = false;
      }, 0);
    }
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

<<<<<<< Updated upstream
=======
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
          pagebreak: { mode: ["css", "legacy"] },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            scrollY: 0,
            windowWidth: 794,

            // ✅✅✅ 핵심: clone 문서에서 강제 스타일 주입
            onclone: (clonedDoc: Document) => {
              // 1) clone 문서에 강제 CSS 삽입
              const style = clonedDoc.createElement("style");
              style.textContent = `
                /* html2pdf clone 환경에서 0-height 방지용 강제 패치 */
                html, body { height: auto !important; overflow: visible !important; }
                .ql-container, .ql-snow, .ql-editor { height: auto !important; overflow: visible !important; }
                .ql-editor { min-height: 1px !important; display: block !important; }
                /* 혹시 flex/absolute로 높이 깨는 케이스 방지 */
                #pdf-wrapper { position: static !important; display: block !important; }
              `;
              clonedDoc.head.appendChild(style);

              // 2) wrapper 찾아서 "보이게" + 레이아웃 강제
              const w = clonedDoc.getElementById("pdf-wrapper") as HTMLElement | null;
              if (!w) return;

              w.style.left = "0";
              w.style.top = "0";
              w.style.position = "static";
              w.style.opacity = "1";
              w.style.visibility = "visible";
              w.style.display = "block";
              w.style.height = "auto";
              w.style.overflow = "visible";
              w.style.background = "#fff";

              const e = w.querySelector(".ql-editor") as HTMLElement | null;
              if (e) {
                e.style.setProperty("display", "block", "important");
                e.style.setProperty("height", "auto", "important");
                e.style.setProperty("min-height", "1px", "important");
                e.style.setProperty("overflow", "visible", "important");
              }
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
>>>>>>> Stashed changes
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
          <img src={triangle} alt="triangle" className="sidebar-icon-triangle" />
        </div>
        <img src={settings} alt="sidebar icon" className="sidebar-icon-10" onClick={() => setShowMarginSettings(!showMarginSettings)} style={{ cursor: 'pointer' }} />
        <img src={save} alt="sidebar icon" className="sidebar-icon-9" />
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
      {pages.map((content, idx) => (
        <div
          key={idx}
          className="center-document"
          style={{ 
            top: `${70 + idx * (1123 + 30)}px`,
            padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`
          }}
        >
          <div
            ref={el => (pageRefs.current[idx] = el)}
            className="document-input"
          />
        </div>
      ))}  
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
