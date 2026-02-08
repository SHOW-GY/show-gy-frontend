import Sidebar from '../components/Sidebar';
import '../styles/design.css';
import '../styles/library.css';
import { useState } from 'react';
import Alldocument from '../library/Alldocument';
import Recent from '../library/Recent';
import Trash from '../library/Trash';

import Layout from '../components/Layout';

interface FileItem {
  id: number;
  name: string;
  date: string;
  Leader: string;
}

export default function Library() {
  const [activeMenu, setActiveMenu] = useState('recent');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: 'SHOW-GY', date: '2025-10-25', Leader: '김용민' },
    { id: 2, name: '컴퓨터비전', date: '2025-10-04', Leader: '박성철' },
  ]);

  return (
    <Layout activeMenu="library">
      <div className="library-container">
        <div className="library-layout">
          {/* 왼쪽 사이드바 */}
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} open={sidebarOpen} setOpen={setSidebarOpen} />

          {/* 메인 콘텐츠 */}
          <main className="library-main">
            {activeMenu === 'my-drive' ? (
              <Alldocument files={files} />
            ) : activeMenu === 'recent' ? (
              <Recent />
            ) : activeMenu === 'trash' ? (
              <Trash />
            ) : (
              <>
              </>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}