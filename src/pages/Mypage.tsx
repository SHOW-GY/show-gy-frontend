import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import cameraIcon from '../assets/icons/camera.png';
import { deleteUser } from '../apis/userApi';
import { logout } from '../apis/authApi';
import '../styles/design.css';
import '../styles/mypage.css';

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

  const handleLogout = async () => {
    try {
      await logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteUser();
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert('회원탈퇴가 완료되었습니다.');
        navigate('/login');
      } catch (error) {
        console.error('회원탈퇴 실패:', error);
        alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="summary-container">
      <Header activeMenu="mypage" />
      <div className="mypage-left-panel">
        <div className="mypage-avatar">
          <div className="mypage-avatar-camera">
            <img src={cameraIcon} alt="camera" />
          </div>
        </div>
        <div className="mypage-nickname">{userInfo?.nickname || '닉네임'}</div>
        <div className="mypage-label">이름</div>
        <div className="mypage-subtext">{userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : '이름 정보 없음'}</div>
        <div className="mypage-label">아이디</div>
        <div className="mypage-subtext">{userInfo?.user_id || '아이디 정보 없음'}</div>
        <div className="mypage-label">이메일</div>
        <div className="mypage-subtext">{userInfo?.email || '이메일 정보 없음'}</div>

        <button className="mypage-action-btn" onClick={() => alert('개인정보 수정은 추후 연결 예정입니다.')}>개인정보 수정하기</button>
        <button className="mypage-action-btn" onClick={handleLogout}>로그아웃</button>

        <button className="mypage-withdraw" onClick={handleDeleteUser}>회원탈퇴</button>
      </div>

      <div className="mypage-right-panel">
      </div>
    </div>
  );
}
