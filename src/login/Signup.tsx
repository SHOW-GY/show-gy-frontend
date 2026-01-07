import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const navigate = useNavigate();

  const handleSignup = () => {
    const finalDomain = emailDomain === 'custom' ? customDomain : emailDomain;
    console.log('Signup:', { userId, password, confirmPassword, name, phone, email: `${emailPrefix}@${finalDomain}` });
    navigate('/login');
  };

  const handleIdCheck = () => {
    console.log('ID Check:', userId);
  };

  return (
    <div className="home-container">
      <Header activeMenu="login" />

      <div className="signup-container">
        <div className="signup-header">
          <div className="signup-title">회원가입</div>
          <div className="signup-title-underline"></div>
        </div>

        <div className="signup-form">
          <div className="form-group">
            <label className="form-label">아이디</label>
            <div className="input-with-button">
              <input
                type="text"
                className="form-input"
                placeholder="아이디 입력(6~20자)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <button className="duplicate-check-btn" onClick={handleIdCheck}>
                중복확인
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호 입력(문자, 숫자, 특수문자 포함 8~20자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호 재입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              type="text"
              className="form-input"
              placeholder="이름을 입력해주세요."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">전화번호</label>
            <input
              type="tel"
              className="form-input"
              placeholder="휴대폰 번호 입력('-' 제외 11자리 입력)."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">이메일 주소</label>
            <div className="email-input-group">
              <input
                type="text"
                className="form-input email-prefix"
                placeholder="이메일 주소"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
              />
              <span className="email-at">@</span>
              <select
                className="form-input email-domain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
              >
                <option value="">선택</option>
                <option value="naver.com">naver.com</option>
                <option value="gmail.com">gmail.com</option>
                <option value="daum.net">daum.net</option>
                <option value="kakao.com">kakao.com</option>
                <option value="hanmail.net">hanmail.net</option>
                <option value="outlook.com">outlook.com</option>
                <option value="nate.com">nate.com</option>
                <option value="custom">직접입력</option>
              </select>
            </div>
            {emailDomain === 'custom' && (
              <input
                type="text"
                className="form-input"
                placeholder="도메인 입력 (예: example.com)"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                style={{ marginTop: '10px' }}
              />
            )}
          </div>
        </div>

        <button className="signup-submit-btn" onClick={handleSignup}>
          확인
        </button>
      </div>
    </div>
  );
}