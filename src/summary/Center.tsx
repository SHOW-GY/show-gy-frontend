import { useState, useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Header from '../components/Header';
import Chatbot from '../helper/Chatbot';
import Feedback from '../helper/Feedback';
import Search from '../helper/Search';
import '../styles/design.css';
import '../styles/animations.css';
import fontIcon from '../assets/icons/font.png';
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

export default function Center() {
  const [fontSize, setFontSize] = useState(13);
  const [sidebarTop, setSidebarTop] = useState(70);
  const [panelTop, setPanelTop] = useState(70);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback' | 'reference'>('chat');
  const [pages, setPages] = useState<string[]>(['']);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quillInstances = useRef<(Quill | null)[]>([]);
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

  // Initialize Quill editors when pages change
  useEffect(() => {
    pageRefs.current.forEach((el, idx) => {
      if (el && !quillInstances.current[idx]) {
        const quill = new Quill(el, {
          theme: 'snow',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              [{ 'color': [] }, { 'background': [] }],
            ],
          },
          placeholder: idx === 0 ? '문서를 입력하세요' : '',
        });
        
        quill.root.style.fontSize = `${fontSize}px`;
        
        if (pages[idx]) {
          quill.clipboard.dangerouslyPasteHTML(pages[idx]);
        }
        
        quill.on('text-change', () => {
          const html = quill.root.innerHTML;
          const selection = quill.getSelection();
          const caretPos = selection ? selection.index : 0;
          handlePageChange(idx, html, caretPos);
        });
        
        quillInstances.current[idx] = quill;
      }
    });
  }, [pages.length]);

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
    measure.textContent = text;
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
    setFontSize(prev => prev + 1);
  };

  // Font size handlers
  const handleDecrease = () => {
    setFontSize(prev => Math.max(1, prev - 1));
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
    const prevText = pages[pageIndex];
    const wasInsertion = newText.length > prevText.length;
    const wasDeletion = newText.length < prevText.length;
    
    // Check if new text overflows
    const overflows = !fits(newText);
    
    if (overflows && wasInsertion) {
      // Split the text that fits vs overflow
      const [head, tail] = splitToFit(newText);
      
      // Calculate where the caret should be
      // If caret is beyond the head, it should move to next page
      let targetPage = pageIndex;
      let targetCaret = caretPos;
      
      if (caretPos > head.length) {
        // Caret is in the overflow area, move to next page
        targetPage = pageIndex + 1;
        targetCaret = caretPos - head.length;
      }
      
      // Update pages
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
      
      // Move caret to appropriate position
      if (targetPage > pageIndex) {
        // Focus next page with calculated caret position
        setTimeout(() => {
          const nextQuill = quillInstances.current[targetPage];
          if (nextQuill) {
            nextQuill.focus();
            nextQuill.setSelection(targetCaret, 0);
          }
        }, 0);
      } else {
        // Stay on current page
        reflowFrom(pageIndex + 1); // Reflow starting from next page
      }
    } else if (wasDeletion) {
      // Update current page
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = newText;
        return newPages;
      });
      
      // Pull from next page if there's space
      setTimeout(() => {
        setPages(prevPages => {
          const newPages = [...prevPages];
          
          // Try to pull from next page
          if (pageIndex + 1 < newPages.length && !fits(newPages[pageIndex] + newPages[pageIndex + 1])) {
            const combined = newPages[pageIndex] + newPages[pageIndex + 1];
            const [head, tail] = splitToFit(combined);
            newPages[pageIndex] = head;
            newPages[pageIndex + 1] = tail;
            
            // Remove empty pages
            if (newPages[pageIndex + 1] === '') {
              newPages.splice(pageIndex + 1, 1);
            }
          } else if (pageIndex + 1 < newPages.length) {
            // Can fit everything, merge
            const combined = newPages[pageIndex] + newPages[pageIndex + 1];
            if (fits(combined)) {
              newPages[pageIndex] = combined;
              newPages.splice(pageIndex + 1, 1);
            } else {
              const [head, tail] = splitToFit(combined);
              newPages[pageIndex] = head;
              newPages[pageIndex + 1] = tail;
              
              if (newPages[pageIndex + 1] === '') {
                newPages.splice(pageIndex + 1, 1);
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
      }, 0);
    } else {
      // Normal update, no overflow
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[pageIndex] = newText;
        return newPages;
      });
    }
  };

  // Panel content renderer
  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      return <Chatbot />;
    }

    if (activeTab === 'feedback') {
      return <Feedback />;
    }

    return <Search />;
  };

  // Render
  return (
    <div className="center-container">
      <div className="center-sidebar" style={{ top: `${sidebarTop}px` }}>
        <img src={fontIcon} alt="sidebar icon" className="sidebar-icon-1" />
        
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

        <img src={B} alt="sidebar icon" className="sidebar-icon-4" />
        <img src={underline} alt="sidebar icon" className="sidebar-icon-5" />
        <img src={gradient} alt="sidebar icon" className="sidebar-icon-6" />
        <img src={A} alt="sidebar icon" className="sidebar-icon-7" />
        <img src={T} alt="sidebar icon" className="sidebar-icon-8" />
        
        <div className="sidebar-sort-container">
          <img src={sort} alt="sort" className="sidebar-icon-sort" />
          <img src={triangle} alt="triangle" className="sidebar-icon-triangle" />
        </div>
        <img src={settings} alt="sidebar icon" className="sidebar-icon-10" />
        <img src={save} alt="sidebar icon" className="sidebar-icon-9" />
      </div>
      <div ref={documentContainerRef}>
      {pages.map((content, idx) => (
        <div
          key={idx}
          className="center-document"
          style={{ top: `${70 + idx * (1123 + 30)}px` }}
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
