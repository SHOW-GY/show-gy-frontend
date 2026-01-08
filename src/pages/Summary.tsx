import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/animations.css';
import fileuploadIcon from '../assets/icons/fileupload.png';
import searchIcon from '../assets/icons/search.png';

export default function Summary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userNickname, setUserNickname] = useState<string>('사용자');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserNickname(user.nickname || user.name || '사용자');
      } catch (e) {
        console.error('사용자 정보 파싱 실패:', e);
      }
    }
  }, []);

  const handleSearch = () => {
    navigate('/summary/center');
  };
  return (
    <div className="home-container">
      <div className="noise-large"></div>
      <div className="noise-small"></div>

      <div className="blob-purple"></div>
      <div className="blob-pink"></div>
      <div className="blob-cyan"></div>

      <div className="hero-title">
        <p className="hero-title-main animate-reveal-left">안녕하세요, {userNickname}님</p>
        <p className="hero-title-sub animate-reveal-left">원하는 문서를 업로드 또는 작성해주세요.</p>
      </div>

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

      <div className="summary-university-info">한양대학교 ERICA x 롯데이노베이트</div>

      <Header activeMenu="summary" />
    </div>
  );
}