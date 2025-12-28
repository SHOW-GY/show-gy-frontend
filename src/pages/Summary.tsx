import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/animations.css';
import fileuploadIcon from '../assets/icons/fileupload.png';
import searchIcon from '../assets/icons/search.png';

export default function Summary() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate('/summary/center');
  };
  return (
    <div className="home-container">
      {/* Noise overlays */}
      <div className="noise-large"></div>
      <div className="noise-small"></div>

      {/* Blob decorations */}
      <div className="blob-purple"></div>
      <div className="blob-pink"></div>
      <div className="blob-cyan"></div>

      {/* Hero content */}
      <div className="hero-title">
        <p className="hero-title-main animate-reveal-left">안녕하세요, 박성철님</p>
        <p className="hero-title-sub animate-reveal-left">원하는 문서를 업로드 또는 작성해주세요.</p>
      </div>

      {/* Input and file upload */} 
      <div className="summary-input-area">
        <div className="summary-input-shell">
          <input
            type="text"
            className="summary-text-input"
            placeholder="문서 링크 또는 제목을 입력하세요"
            aria-label="문서 링크 또는 제목을 입력하세요"
          />
          <div className="summary-upload-group">
            <input type="file" id="summary-file-input" className="summary-file-input" aria-label="파일 업로드" />
            <label htmlFor="summary-file-input" className="summary-upload-hit">
              <img src={fileuploadIcon} alt="파일 업로드" className="summary-upload-icon" />
            </label>
            <button
              onClick={handleSearch}
              className="summary-search-btn"
              aria-label="검색"
            >
              <img src={searchIcon} alt="검색" className="summary-search-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* University info */}
      <div className="summary-university-info">한양대학교 ERICA 소프트웨어융합대학</div>

      {/* Header */}
      <Header activeMenu="summary" />
    </div>
  );
}