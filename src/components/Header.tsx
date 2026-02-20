import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/design.css';
import logo from '../assets/image/logo.png';

type LibraryMenu = "recent" | "my-drive" | "trash";

interface HeaderProps {
  activeMenu?: 'home' | 'summary' | 'library' | 'login' | 'mypage' | 'showgy';
  onSelectLibraryMenu?: (menu: LibraryMenu) => void;
  activeLibraryMenu?: LibraryMenu;
}

function Header({
  activeMenu = 'home',
  onSelectLibraryMenu,
  activeLibraryMenu,
}: HeaderProps) {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLibraryMenuSelect = (menu: LibraryMenu) => {
    onSelectLibraryMenu?.(menu);
    navigate('/library');
    setMobileOpen(false);
  };

  const handleMobileLibraryEntry = () => {
    if (userNickname) {
      onSelectLibraryMenu?.('recent');
      navigate('/library');
    } else {
      navigate('/login');
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserNickname(user.nickname || user.name || '사용자');
        } catch (e) {
        }
      }
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('userLogin', loadUser as EventListener);
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('userLogin', loadUser as EventListener);
    };
  }, []);

  return (
    <div className="header">
      <div className="header-inner">
        <div className="brand" onClick={() => navigate('/showgy')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="SHOW-GY Logo" className="brand-logo" />
          <span className="brand-text">SHOW-GY</span>
        </div>

        <div className="menu">
          <div style={{ position: 'relative' }}>
            <div className="menu-home" onClick={() => navigate('/')}>
              HOME
            </div>
            {activeMenu === 'home' && <div className="menu-underline" />}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              className="menu-summary"
              onClick={() => {
                if (userNickname) {
                  navigate('/summary');
                } else {
                  alert('로그인이 필요한 페이지입니다');
                  navigate('/login');
                }
              }}
            >
              문서요약
            </div>
            {activeMenu === 'summary' && <div className="menu-underline" />}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              className="menu-library"
              onClick={() => {
                if (userNickname) {
                  navigate('/library');
                } else {
                  alert('로그인이 필요한 페이지입니다');
                  navigate('/login');
                }
              }}
            >
              문서보관함
            </div>
            {activeMenu === 'library' && <div className="menu-underline" />}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              className="menu-login"
              onClick={() => navigate(userNickname ? '/mypage' : '/login')}
            >
              {userNickname ? `${userNickname}님` : '로그인'}
            </div>
            {(activeMenu === 'login' || activeMenu === 'mypage') && (
              <div className="menu-underline" />
            )}
          </div>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="메뉴 열기"
        >
          ☰
        </button>

      </div>
      
      {mobileOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-item" onClick={() => { navigate('/'); setMobileOpen(false); }}>HOME</div>
          <div
            className="mobile-menu-item"
            onClick={() => { userNickname ? navigate('/summary') : navigate('/login'); setMobileOpen(false); }}
          >
            문서요약
          </div>
          <div className="mobile-menu-item" onClick={handleMobileLibraryEntry}>문서보관함</div>
          {activeMenu === 'library' && (
            <>
              <div
                className={`mobile-menu-item library-submenu-item ${activeLibraryMenu === 'recent' ? 'active' : ''}`}
                onClick={() => handleLibraryMenuSelect('recent')}
              >
                최근 문서함
              </div>
              <div
                className={`mobile-menu-item library-submenu-item ${activeLibraryMenu === 'my-drive' ? 'active' : ''}`}
                onClick={() => handleLibraryMenuSelect('my-drive')}
              >
                전체 문서함
              </div>
              <div
                className={`mobile-menu-item library-submenu-item ${activeLibraryMenu === 'trash' ? 'active' : ''}`}
                onClick={() => handleLibraryMenuSelect('trash')}
              >
                휴지통
              </div>
            </>
          )}
          <div
            className="mobile-menu-item"
            onClick={() => { navigate(userNickname ? '/mypage' : '/login'); setMobileOpen(false); }}
          >
            {userNickname ? `${userNickname}님` : '로그인'}
          </div>
        </div>
      )}

    </div>
  );
}

export default Header;