import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { notLoginGenerateEmail, findUserIdByEmail } from '../apis/authApi';
import { getErrorMessage } from '../apis/client';
import '../styles/design.css';
import '../styles/login.css';

/**
 * 아이디 찾기 — 이메일 인증으로 user_id 조회.
 * 1) 이메일 입력 → /api/v1/auth/generate_first_email 코드 발송
 * 2) 코드 입력 → /api/v1/auth/email/verify 응답에서 user_id 추출
 */
export default function FindId() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [foundId, setFoundId] = useState<string | null>(null);
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
      const res = await findUserIdByEmail(email, code);
      const userId = res?.data?.user_id;
      if (!userId) {
        alert('해당 이메일로 가입된 계정이 없습니다.');
        return;
      }
      setFoundId(userId);
      setStep(3);
    } catch (e: any) {
      alert(getErrorMessage(e, '코드 확인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout activeMenu="login">
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">아이디 찾기</h1>
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
                {loading ? '확인 중...' : '아이디 찾기'}
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

          {step === 3 && foundId && (
            <>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(236, 72, 153, 0.35)',
                  borderRadius: 8,
                  padding: '16px 18px',
                  margin: '12px 0',
                  textAlign: 'center',
                  color: '#1f1f29',
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
                  회원님의 아이디
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>
                  {foundId}
                </div>
              </div>
              <button className="login-button" onClick={() => navigate('/login')}>
                로그인 하러 가기
              </button>
              <div className="login-footer-links">
                <span
                  className="login-link"
                  onClick={() => navigate('/login/reset-password')}
                  style={{ cursor: 'pointer' }}
                >
                  비밀번호도 잊으셨나요?
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
