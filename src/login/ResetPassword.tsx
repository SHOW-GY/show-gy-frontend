import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { notLoginGenerateEmail, verifyFirstEmail, resetPassword } from '../apis/authApi';
import { getErrorMessage } from '../apis/client';
import '../styles/design.css';
import '../styles/login.css';

/**
 * 비밀번호 재설정 흐름:
 * 1) 이메일 입력 → /api/v1/auth/generate_first_email 코드 발송
 * 2) 코드 확인 → /api/v1/auth/first_email → reset_token 받음
 * 3) 새 비밀번호 입력 → /api/v1/user/re-password (reset_token + user_pw)
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await notLoginGenerateEmail(email);
      alert('인증 코드를 이메일로 발송했어요. 메일함을 확인해주세요.');
      setStep(2);
    } catch (e: any) {
      alert(getErrorMessage(e, '코드 발송에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      alert('인증 코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyFirstEmail(email, code);
      if (!res?.reset_token) {
        alert('인증에 실패했습니다.');
        return;
      }
      setResetToken(res.reset_token);
      setStep(3);
    } catch (e: any) {
      alert(getErrorMessage(e, '코드 확인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPw || !newPw2) {
      alert('새 비밀번호와 확인을 입력해주세요.');
      return;
    }
    if (newPw !== newPw2) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPw.length < 8 || newPw.length > 20) {
      alert('비밀번호는 8~20자여야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPw);
      setStep(4);
    } catch (e: any) {
      alert(getErrorMessage(e, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout activeMenu="login">
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">비밀번호 재설정</h1>
            <div className="login-underline"></div>
          </div>

          {step === 1 && (
            <>
              <div className="login-form-group">
                <label className="login-label">가입한 이메일</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={50}
                />
              </div>
              <button className="login-button" onClick={handleSendCode} disabled={loading}>
                {loading ? '발송 중...' : '인증 코드 받기'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="login-form-group">
                <label className="login-label">이메일</label>
                <input type="email" className="login-input" value={email} disabled />
              </div>
              <div className="login-form-group">
                <label className="login-label">인증 코드</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="이메일로 받은 6자리 숫자"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                />
              </div>
              <button className="login-button" onClick={handleVerify} disabled={loading}>
                {loading ? '확인 중...' : '코드 확인'}
              </button>
              <div className="login-footer-links">
                <span
                  className="login-link"
                  onClick={() => setStep(1)}
                  style={{ cursor: 'pointer' }}
                >
                  이메일 다시 입력
                </span>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="login-form-group">
                <label className="login-label">새 비밀번호</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="문자, 숫자, 특수문자 포함 8~20자"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">새 비밀번호 확인</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="다시 한 번 입력"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  maxLength={20}
                />
              </div>
              <button className="login-button" onClick={handleReset} disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 8,
                  padding: '16px 18px',
                  margin: '12px 0',
                  textAlign: 'center',
                  color: '#1f1f29',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  비밀번호가 변경되었습니다.
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                  새 비밀번호로 로그인해주세요.
                </div>
              </div>
              <button className="login-button" onClick={() => navigate('/login')}>
                로그인 하러 가기
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
