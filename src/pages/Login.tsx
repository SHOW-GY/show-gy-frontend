import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // 로그인 로직
    console.log('Login:', { userId, password });
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
    {/* <div className="login-wrapper"> */}
      <div className="login-container">
        {/* 헤더 */}
        <div className="login-header">
          <h1 className="login-title">로그인</h1>
          <div className="login-underline"></div>
        </div>

        {/* 아이디 입력 */}
        <div className="login-form-group">
          <label className="login-label">아이디</label>
          <input
            type="text"
            className="login-input"
            placeholder="아이디 입력(6~20자)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="login-form-group">
          <label className="login-label">비밀번호</label>
          <input
            type="password"
            className="login-input"
            placeholder="비밀번호 입력(문자, 숫자, 특수문자 포함 8~20자)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* 로그인 버튼 */}
        <button className="login-button" onClick={handleLogin}>
          로그인
        </button>

        {/* 하단 링크 */}
        <div className="login-footer-links">
          <span className="login-link" onClick={() => navigate('/login/signup')} style={{ cursor: 'pointer' }}>
            회원가입
          </span>
          <span className="login-link" onClick={() => navigate('/login/findid')} style={{ cursor: 'pointer' }}>
            아이디 찾기
          </span>
          <span className="login-link" onClick={() => navigate('/login/findpw')} style={{ cursor: 'pointer' }}>
            비밀번호 찾기
          </span>
        </div>
      </div>
    </div>
    // </div>
  );
}