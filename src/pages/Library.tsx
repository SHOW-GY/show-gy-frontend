import Header from '../components/Header';
import '../styles/design.css';
import '../styles/library.css';
import { useState } from 'react';
import starIcon from '../assets/icons/star.png';
import Recent from '../library/Recent';
import Important from '../library/Important';
import Trash from '../library/Trash';

interface FileItem {
  id: number;
  name: string;
  date: string;
  location: string;
}

export default function Library() {
  const [activeMenu, setActiveMenu] = useState('my-drive');
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: 'Computer_vision.pdf', date: '2025-10-25', location: '기본 폴더' },
    { id: 2, name: 'Machine_Learning_final.pdf', date: '2025-10-04', location: '기본 폴더' },
  ]);

  const folders = [
    { id: 1, name: '기본 폴더' },
    { id: 2, name: '폴더 이름' },
    { id: 3, name: '폴더 이름' },
    { id: 4, name: '폴더 이름' },
  ];

  return (
    <div className="library-container">
      {/* Header: 다른 페이지와 동일하게 최상단에 배치 */}
      <Header activeMenu="library" />
      <div className="library-layout">
        {/* 왼쪽 사이드바 */}
        <aside className="library-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeMenu === 'my-drive' ? 'active' : ''}`}
              onClick={() => setActiveMenu('my-drive')}
            >
              내 드라이브
            </button>
            <button 
              className={`nav-item ${activeMenu === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveMenu('recent')}
            >
              최근 문서함
            </button>
            <button 
              className={`nav-item ${activeMenu === 'important' ? 'active' : ''}`}
              onClick={() => setActiveMenu('important')}
            >
              중요 문서함
            </button>
            <button 
              className={`nav-item ${activeMenu === 'trash' ? 'active' : ''}`}
              onClick={() => setActiveMenu('trash')}
            >
              휴지통
            </button>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="library-main">
          {activeMenu === 'recent' ? (
            <Recent />
          ) : activeMenu === 'important' ? (
            <Important />
          ) : activeMenu === 'trash' ? (
            <Trash />
          ) : (
            <>
              {/* 검색바 */}
              <div className="library-search">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="검색어를 입력해주세요"
                  className="search-input"
                />
              </div>

              {/* 새폴더 버튼
              <button className="new-folder-btn">+ 새폴더</button> */}

              {/* 파일 테이블 */}
              <div className="files-table">
                <div className="table-header">
                  <div className="column-header">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;이름</div>
                  <div className="column-header">수정 날짜</div>
                  <div className="column-header">위치</div>
                </div>
                <div className="table-body">
                  {files.map((file) => (
                    <div key={file.id} className="table-row">
                      <div className="table-cell name-cell">
                        <img src={starIcon} alt="즐겨찾기" className="table-star" />
                        {file.name}
                      </div>
                      <div className="table-cell">{file.date}</div>
                      <div className="table-cell">{file.location}</div>
                      <div className="table-menu">⋮</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}