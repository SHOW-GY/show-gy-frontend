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
    console.log('Login:', { userId, password });
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">로그인</h1>
          <div className="login-underline"></div>
        </div>

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

        <button className="login-button" onClick={handleLogin}>
          로그인
        </button>

        <div className="login-footer-links">
          <span className="login-link" onClick={() => navigate('/login/signup')} style={{ cursor: 'pointer' }}>
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
}