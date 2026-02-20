import Sidebar from '../components/Sidebar';
import '../styles/design.css';
import '../styles/library.css';
import { useEffect, useState } from 'react';
import Alldocument from '../library/Alldocument';
import Recent from '../library/Recent';
import Trash from '../library/Trash';
import Layout from '../components/Layout';

type LibraryMenu = 'recent' | 'my-drive' | 'trash';

export default function Library() {
  const [activeMenu, setActiveMenu] = useState<LibraryMenu>('recent');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  {/* 모바일 여부 체크 */}
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <Layout activeMenu="library" onSelectLibraryMenu={(menu) => setActiveMenu(menu)} activeLibraryMenu={activeMenu}>
      <div className="library-container">
        <div className={`library-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
          {!isMobile && (
            <Sidebar
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              open={sidebarOpen}
              setOpen={setSidebarOpen}
            />
          )}
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