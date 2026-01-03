import { useNavigate } from 'react-router-dom';
import '../styles/design.css';

interface HeaderProps {
  activeMenu?: 'home' | 'summary' | 'library' | 'login';
}

export default function Header({ activeMenu = 'home' }: HeaderProps) {
  const navigate = useNavigate();

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
          <div className="menu-login" onClick={() => navigate('/login')}>로그인</div>
          {activeMenu === 'login' && <div className="menu-underline" />}
        </div>
      </div>
    </div>
  );
}
