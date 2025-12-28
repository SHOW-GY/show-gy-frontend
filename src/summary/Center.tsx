import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
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
import fileupload from '../assets/icons/fileupload.png';
import search from '../assets/icons/search.png';

export default function Center() {
  const [fontSize, setFontSize] = useState(13);
  const [sidebarTop, setSidebarTop] = useState(70);
  const [panelTop, setPanelTop] = useState(70);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback' | 'reference'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [pages, setPages] = useState<string[]>(['']);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 60, width: 79 });
  const timeoutRef = useRef<number | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<'chat' | 'feedback' | 'reference', HTMLDivElement | null>>({
    chat: null,
    feedback: null,
    reference: null,
  });

  const handleIncrease = () => {
    setFontSize(prev => prev + 1);
  };

  const handleDecrease = () => {
    setFontSize(prev => Math.max(1, prev - 1));
  };

  useEffect(() => {
    const updatePositions = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollThreshold = 75; // keep elements anchored until threshold is passed
      const targetTop = 70 + Math.max(0, scrollTop - scrollThreshold);
      setSidebarTop(targetTop);
      setPanelTop(targetTop);
    };

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

  // Paginate document text into pages using hidden measurement element
  useEffect(() => {
    const pageHeight = 1123 - 71 - 71; // center-document height minus vertical padding
    const contentWidth = 793 - 83 - 83; // center-document width minus horizontal padding
    const measure = measureRef.current;
    if (!measure) return;
    const text = documentText || '';
    const font = `${fontSize}px Inter, system-ui, sans-serif`;
    measure.style.width = `${contentWidth}px`;
    measure.style.font = font;

    const fits = (substr: string) => {
      measure.textContent = substr;
      return measure.scrollHeight <= pageHeight;
    };

    const result: string[] = [];
    let start = 0;
    while (start < text.length) {
      // Binary search largest chunk that fits this page
      let low = start + 1;
      let high = text.length;
      let fitIndex = start + 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = text.slice(start, mid);
        if (fits(candidate)) {
          fitIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      result.push(text.slice(start, fitIndex));
      start = fitIndex;
    }

    if (result.length === 0) {
      setPages(['']);
    } else {
      setPages(result);
    }
  }, [documentText, fontSize]);

  const renderPanelContent = () => {
    if (activeTab === 'chat') {
      return (
        <>
          <div className="panel-chat-message">
            <p>SHOW-GY 챗봇입니다.<br />무엇을 도와드릴까요?</p>
          </div>

          <div className="panel-input-bar">
            <textarea
              className="panel-input-field"
              placeholder="메시지를 입력하세요"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={1}
            />
            <img src={fileupload} alt="파일 업로드" className="panel-input-rect" />
            <img src={search} alt="검색" className="panel-input-square" />
            <div className="panel-input-plus">+</div>
          </div>
        </>
      );
    }

    if (activeTab === 'feedback') {
      return (
        <div className="panel-chat-message">
          <p>피드백을 남겨주세요.<br />검토 후 답변드릴게요.</p>
        </div>
      );
    }

    return (
      <div className="panel-chat-message">
        <p>참고자료를 불러오고 있습니다.<br />잠시만 기다려주세요.</p>
      </div>
    );
  };

  return (
    <div className="center-container">
      {/* Left Sidebar */}
      <div className="center-sidebar" style={{ top: `${sidebarTop}px` }}>
        {/* Icons */}
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

      {/* Main Document Pages */}
      {pages.map((content, idx) => (
        <div
          key={idx}
          className="center-document"
          style={{ top: `${70 + idx * (1123 + 30)}px` }}
        >
          {idx === 0 ? (
            <textarea
              className="document-input"
              placeholder="문서를 입력하세요"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              style={{ fontSize: `${fontSize}px` }}
            />
          ) : (
            <div className="document-page-view" style={{ fontSize: `${fontSize}px` }}>
              {content}
            </div>
          )}
        </div>
      ))}
      {/* Hidden measurement element for pagination */}
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

      {/* Right Panel */}
      <div className="center-panel" style={{ top: `${panelTop}px` }}>
        {/* Tabs */}
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
      {/* Header */}
      <Header activeMenu="summary" />
    </div>
  );
}
