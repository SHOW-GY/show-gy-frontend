import Sidebar from '../components/Sidebar';
import '../styles/design.css';
import '../styles/library.css';
import { useState } from 'react';
import Alldocument from '../library/Alldocument';
import Recent from '../library/Recent';
import Trash from '../library/Trash';

import Layout from '../components/Layout';

export default function Library() {
  const [activeMenu, setActiveMenu] = useState('recent');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Layout activeMenu="library">
      <div className="library-container">
        <div className="library-layout">
          {/* 왼쪽 사이드바 */}
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} open={sidebarOpen} setOpen={setSidebarOpen} />

          {/* 메인 콘텐츠 */}
          <main className="library-main">
            {activeMenu === 'my-drive' ? (
              <Alldocument />
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