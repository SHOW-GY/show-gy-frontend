import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';

export default function Findid1() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleFindPassword = () => {
    navigate('/login/findpw');
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
      <div className="findid1-wrapper">
        <div className="findid1-container">
          {/* 헤더 */}
          <div className="findid1-header">
            <h1 className="findid1-title">아이디 찾기</h1>
            <div className="findid1-underline"></div>
          </div>

          {/* 결과 메시지 */}
          <div className="findid1-message">
            해당 이메일로<br />
            가입된 아이디입니다
          </div>

          {/* 아이디 표시 */}
          <div className="findid1-id-box">
            <span className="findid1-id-text">user_id_example</span>
          </div>

          {/* 버튼 그룹 */}
          <div className="findid1-button-group">
            <button
              className="findid1-button findid1-password-btn"
              onClick={handleFindPassword}
            >
              비밀번호 찾기
            </button>
            <button
              className="findid1-button findid1-login-btn"
              onClick={handleLoginRedirect}
            >
              로그인 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
