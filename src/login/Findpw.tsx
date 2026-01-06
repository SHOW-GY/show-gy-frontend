import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';

export default function Findpw() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleNext = () => {
    console.log('Find Password:', { userId, emailPrefix, emailDomain, verificationCode });
    // 비밀번호 찾기 로직
    navigate('/login/findpw1');
  };

  const handleVerify = () => {
    console.log('Verify code');
    // 인증번호 확인 로직
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />
      <div className="findpw-wrapper">
        <div className="findpw-container">
          {/* 헤더 */}
          <div className="findpw-header">
            <h1 className="findpw-title">비밀번호 찾기</h1>
            <div className="findpw-underline"></div>
          </div>

          {/* 설명 텍스트 */}
          <div className="findpw-description">
            가입된 이메일로 비밀번호를 찾습니다
          </div>

          {/* 아이디 입력 */}
          <div className="findpw-form-group">
            <label className="findpw-label">아이디</label>
            <input
              type="text"
              className="findpw-input"
              placeholder="아이디 입력(8~20자)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 이메일 입력 */}
          <div className="findpw-form-group">
            <label className="findpw-label">이메일 주소</label>
            <div className="findpw-email-container">
              <input
                type="text"
                className="findpw-email-input"
                placeholder="이메일 주소"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
              />
              <div className="findpw-at-symbol">@</div>
              <select
                className="findpw-domain-select"
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
          <div className="findpw-form-group">
            <label className="findpw-label">인증번호</label>
            <div className="findpw-verify-container">
              <input
                type="text"
                className="findpw-verify-input"
                placeholder="인증번호를 입력해주세요"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button className="findpw-verify-button" onClick={handleVerify}>
                인증번호 확인
              </button>
            </div>
          </div>

          {/* 다음 버튼 */}
          <button className="findpw-next-button" onClick={handleNext}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
