import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';

export default function Mypage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);
      } catch (e) {
        console.error('사용자 정보 파싱 실패:', e);
      }
    } else {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="home-container">
      <Header activeMenu="mypage" />
    </div>
  );
}
