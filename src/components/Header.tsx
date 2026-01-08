import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/design.css';

interface HeaderProps {
  activeMenu?: 'home' | 'summary' | 'library' | 'login';
}

export default function Header({ activeMenu = 'home' }: HeaderProps) {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      console.log('localStorage user:', userStr);  // 디버그용
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('파싱된 사용자 정보:', user);  // 디버그용
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
    window.addEventListener('userLogin', loadUser);
    
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('userLogin', loadUser);
    };
  }, []);

  return (
    <div className="header">
        <div className="brand">SHOW-GY</div>

      <div className="menu">
        <div style={{ position: 'relative' }}>
          <div className="menu-home" onClick={() => navigate('/')}>HOME</div>
          {activeMenu === 'home' && <div className="menu-underline" />}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="menu-summary" onClick={() => navigate('/summary')}>문서요약</div>
          {activeMenu === 'summary' && <div className="menu-underline" />}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="menu-library" onClick={() => navigate('/library')}>문서보관함</div>
          {activeMenu === 'library' && <div className="menu-underline" />}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="menu-login" onClick={() => navigate('/login')}>
            {userNickname ? `${userNickname}님` : '로그인'}
          </div>
          {activeMenu === 'login' && <div className="menu-underline" />}
        </div>
      </div>
    </div>
  );
}
