import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';

export default function Findid() {
  const navigate = useNavigate();
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleConfirm = () => {
    console.log('Find ID:', { emailPrefix, emailDomain, verificationCode });
    // 아이디 찾기 로직
    navigate('/login/findid1');
  };

  const handleVerify = () => {
    console.log('Verify code');
    // 인증번호 확인 로직
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
      <div className="findid-wrapper">
        
          {/* 헤더 */}
          <div className="findid-header">
            <h1 className="findid-title">아이디 찾기</h1>
            <div className="findid-underline"></div>
          </div>

          {/* 설명 텍스트 */}
          <div className="findid-description">
            가입된 이메일로 아이디를 찾습니다
          </div>

          {/* 이메일 입력 */}
          <div className="findid-form-group">
            <label className="findid-label">이메일 주소</label>
            <div className="findid-email-container">
              <input
                type="text"
                className="findid-email-input"
                placeholder="이메일 주소"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
              />
              <div className="findid-at-symbol">@</div>
              <select
                className="findid-domain-select"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
              >
                <option value="">선택</option>
                <option value="gmail.com">gmail.com</option>
                <option value="naver.com">naver.com</option>
                <option value="daum.net">daum.net</option>
              </select>
            </div>
          </div>

          {/* 인증번호 입력 */}
          <div className="findid-form-group">
            <label className="findid-label">인증번호</label>
            <div className="findid-verify-container">
              <input
                type="text"
                className="findid-verify-input"
                placeholder="인증번호를 입력해주세요"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button className="findid-verify-button" onClick={handleVerify}>
                인증번호 확인
              </button>
            </div>
          </div>

          {/* 확인 버튼 */}
          <button className="findid-confirm-button" onClick={handleConfirm}>
            확인
          </button>
      </div>
    </div>
  );
}
