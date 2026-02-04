import Header from '../components/Header';
import '../styles/design.css';
import '../styles/library.css';
import { useState } from 'react';
import Recent from '../library/Recent';
import Trash from '../library/Trash';
import glasses from '../assets/icons/Glasses.png';

interface FileItem {
  id: number;
  name: string;
  date: string;
  Leader: string;
}

export default function Library() {
  const [activeMenu, setActiveMenu] = useState('my-drive');
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: 'SHOW-GY', date: '2025-10-25', Leader: '김용민' },
    { id: 2, name: '컴퓨터비전', date: '2025-10-04', Leader: '박성철' },
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
              나의 팀
            </button>
            <button 
              className={`nav-item ${activeMenu === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveMenu('recent')}
            >
              최근 문서함
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
          ) : activeMenu === 'trash' ? (
            <Trash />
          ) : (
            <>
              {/* 검색바 */}
              <div className="library-search">
                <span className="search-icon"><img src={glasses} alt="Glasses Icon" /></span>
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
                  <div className="column-header">팀명</div>
                  <div className="column-header">수정 날짜</div>
                  <div className="column-header">팀장</div>
                </div>
                <div className="table-body">
                  {files.map((file) => (
                    <div key={file.id} className="table-row">
                      <div className="table-cell name-cell">
                        {file.name}
                      </div>
                      <div className="table-cell">{file.date}</div>
                      <div className="table-cell">{file.Leader}</div>
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