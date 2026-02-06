import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/design.css';
import '../styles/library.css';
import { useState } from 'react';
import Recent from '../library/Recent';
import Trash from '../library/Trash';
import glasses from '../assets/icons/Glasses.png';

import Layout from '../components/Layout';

interface FileItem {
  id: number;
  name: string;
  date: string;
  Leader: string;
}

export default function Library() {
  const [activeMenu, setActiveMenu] = useState('my-drive');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <Layout activeMenu="library">
      <div className="library-container">
        <div className="library-layout">
          {/* 왼쪽 사이드바 */}
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} open={sidebarOpen} setOpen={setSidebarOpen} />

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
    </Layout>
  );
}