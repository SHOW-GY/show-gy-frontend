import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';

export default function Findpw1() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleConfirm = () => {
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    console.log('Reset Password:', { newPassword });
    // 비밀번호 재설정 로직
    alert('비밀번호가 성공적으로 변경되었습니다.');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
      <div className="findpw1-wrapper">
        <div className="findpw1-container">
          {/* 헤더 */}
          <div className="findpw1-header">
            <h1 className="findpw1-title">비밀번호 재설정</h1>
            <div className="findpw1-underline"></div>
          </div>

          {/* 설명 텍스트 */}
          <div className="findpw1-description">
            가입된 이메일로 비밀번호를 찾습니다
          </div>

          {/* 새로운 비밀번호 입력 */}
          <div className="findpw1-form-group">
            <label className="findpw1-label">새로운 비밀번호</label>
            <input
              type="password"
              className="findpw1-input"
              placeholder="비밀번호 변경 (문자, 숫자, 특수문자 포함 8~20자)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="findpw1-form-group">
            <label className="findpw1-label">비밀번호 확인</label>
            <input
              type="password"
              className="findpw1-input"
              placeholder="비밀번호 재입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 확인 버튼 */}
          <button className="findpw1-confirm-button" onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
