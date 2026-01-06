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
  const navigate = useNavigate();

  const handleSignup = () => {
    // 회원가입 로직
    console.log('Signup:', { userId, password, confirmPassword, name, phone, email: `${emailPrefix}@${emailDomain}` });
    navigate('/login/signup1');
  };

  const handleIdCheck = () => {
    // 아이디 중복 확인 로직
    console.log('ID Check:', userId);
  };

  return (
    <div className="home-container">
      <Header activeMenu="signup" />
      
      
      <div className="login-container">
        <div className="signup-title-inner">
          <div className="signup-title-text">회원가입</div>
          <div className="signup-title-underline"></div>
        </div>
        <div className="signup-confirm-button" onClick={handleSignup}>
          <div className="signup-confirm-text">확인</div>
        </div>
      
        <div className="signup-label-id">아이디</div>
      
        <div className="signup-label-password">비밀번호</div>
      
        <div className="signup-label-confirm-password">비밀번호 확인</div>
      
        <div className="signup-label-name">이름</div>
      
        <div className="signup-label-phone">전화번호</div>
      
        <div className="signup-label-email">이메일 주소</div>
      
        <div className="signup-input-id-wrapper">
          <input
            type="text"
            placeholder="아이디 입력(6~20자)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            maxLength={20}
            className="signup-input-id"
         />
        </div>
        
        <div className="signup-id-check-button" onClick={handleIdCheck}>
          <div className="signup-id-check-text">중복확인</div>
        </div>
        
        <div className="signup-input-password-wrapper">
          <input
            type="password"
            placeholder="비밀번호 입력(문자, 숫자, 특수문자 포함 8~20자)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={20}
            className="signup-input-password"
          />
        </div>
        
        <div className="signup-input-confirm-password-wrapper">
          <input
            type="password"
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            maxLength={20}
            className="signup-input-confirm-password"
          />
        </div>
        
        <div className="signup-input-name-wrapper">
          <input
            type="text"
            placeholder="이름을 입력해주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="signup-input-name"
          />
        </div>
        
        <div className="signup-input-phone-wrapper">
          <input
            type="text"
            placeholder="휴대폰 번호 입력(‘-’ 제외 11자리 입력)."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={11}
            className="signup-input-phone"
          />
        </div>
        
        <div className="signup-input-email-prefix-wrapper">
          <input
            type="text"
            placeholder="이메일 주소"
            value={emailPrefix}
            onChange={(e) => setEmailPrefix(e.target.value)}
            className="signup-input-email-prefix"
          />
        </div>
        
        <div className="signup-input-email-domain-wrapper">
          <input
            type="text"
            placeholder="선택"
            value={emailDomain}
            onChange={(e) => setEmailDomain(e.target.value)}
            className="signup-input-email-domain"
          />
        </div>
        
        <div className="signup-email-at">@</div>
      </div>
    </div>
  );
}