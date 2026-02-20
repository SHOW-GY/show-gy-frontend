import Header from '../components/Layout';
import '../styles/design.css';
import '../styles/login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../apis';
import Layout from '../components/Layout';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!userId || !password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await login({
        username: userId,
        password: password,
      });
      
      alert('로그인 성공!');
      navigate('/');
    } catch (error: any) {
      
      if (error.response?.status === 404) {
        alert('로그인에 실패하였습니다');
      } else {
        const errorMessage = error.response?.data?.detail 
          ? (typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail))
          : error.message || '로그인에 실패했습니다.';
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout activeMenu="login">
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

        <button className="login-button" onClick={handleLogin} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="login-footer-links">
          <span className="login-link" onClick={() => navigate('/login/signup')} style={{ cursor: 'pointer' }}>
            회원가입
          </span>
        </div>
      </div>
    </Layout>
  );
}