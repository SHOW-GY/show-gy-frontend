import Header from '../components/Header';
import '../styles/design.css';
import '../styles/login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../apis';

export default function Signup() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getFullEmail = () => {
    const finalDomain = emailDomain === 'custom' ? customDomain : emailDomain;
    return `${emailPrefix}@${finalDomain}`;
  };

  // 아이디 중복확인 (백엔드 엔드포인트 필요)
  const handleIdCheck = () => {
    if (!userId) {
      alert('아이디를 입력해주세요.');
      return;
    }
    if (userId.length < 6 || userId.length > 20) {
      alert('아이디는 6~20자로 입력해주세요.');
      return;
    }
    setIsIdChecked(true);
    alert('사용 가능한 아이디입니다.');
  };

  // 회원가입
  const handleSignup = async () => {
    if (!userId || !password || !confirmPassword || !firstName || !lastName || !nickname || !emailPrefix || !emailDomain) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!isIdChecked) {
      alert('아이디 중복확인을 해주세요.');
      return;
    }

    if (userId.length < 6 || userId.length > 20) {
      alert('아이디는 6~20자로 입력해주세요.');
      return;
    }

    if (password.length < 8 || password.length > 20) {
      alert('비밀번호는 8~20자로 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const email = getFullEmail();
      await createUser({
        user_id: userId,
        user_pw: password,
        last_name: lastName,
        first_name: firstName,
        nickname: nickname,
        email: email,
      });
      
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      const errorMessage = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail))
        : error.message || '회원가입에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
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
            <div className="name-input-group">
              <input
                type="text"
                className="form-input name-first"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                className="form-input name-last"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">닉네임</label>
            <input
              type="text"
              className="form-input"
              placeholder="닉네임을 입력해주세요."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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

        <button 
          className="signup-submit-btn" 
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? '처리 중...' : '확인'}
        </button>
      </div>
    </div>
  );
}