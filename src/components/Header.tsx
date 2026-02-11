import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/design.css';
import logo from '../assets/image/logo.png';

interface HeaderProps {
  activeMenu?: 'home' | 'summary' | 'library' | 'login' | 'mypage' | 'showgy';
}

function Header({ activeMenu = 'home' }: HeaderProps) {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      console.log('localStorage user:', userStr); // 디버그용
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('파싱된 사용자 정보:', user); // 디버그용
          setUserNickname(user.nickname || user.name || '사용자');
        } catch (e) {
          console.error('사용자 정보 파싱 실패:', e);
        }
      }
    };

    loadUser();

    // storage 이벤트 리스너 추가 (다른 탭/창에서 변경 감지)
    window.addEventListener('storage', loadUser);
    // 커스텀 이벤트 리스너 추가 (같은 페이지에서 로그인 시)
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
          <div onClick={() => { navigate('/'); setMobileOpen(false); }}>HOME</div>
          <div onClick={() => { userNickname ? navigate('/summary') : navigate('/login'); setMobileOpen(false); }}>문서요약</div>
          <div onClick={() => { userNickname ? navigate('/library') : navigate('/login'); setMobileOpen(false); }}>문서보관함</div>
          <div onClick={() => { navigate(userNickname ? '/mypage' : '/login'); setMobileOpen(false); }}>
            {userNickname ? `${userNickname}님` : '로그인'}
          </div>
        </div>
      )}

    </div>
  );
}

export default Header;