import React, { useState } from 'react';
import { login, createUser, getCurrentUser, logout } from './index';

/**
 * API 테스트용 컴포넌트
 * 각 API 엔드포인트를 테스트할 수 있습니다.
 */
const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 결과 표시 헬퍼
  const showResult = (data: any, message: string = '성공') => {
    setResult(`${message}:\n${JSON.stringify(data, null, 2)}`);
  };

  const showError = (error: any) => {
    setResult(`에러 발생:\n${error.response?.data?.detail || error.message}`);
  };

  // 회원가입 테스트
  const testSignup = async () => {
    setLoading(true);
    try {
      const userData = {
        user_id: 'testuser123',
        user_pw: 'testPassword123!',
        last_name: '김',
        first_name: '테스트',
        nickname: '테스트유저',
        email: 'test@example.com',
      };
      const user = await createUser(userData);
      showResult(user, '회원가입 성공');
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 테스트
  const testLogin = async () => {
    setLoading(true);
    try {
      const loginData = {
        email: 'test@example.com',
        password: 'testPassword123!',
      };
      const response = await login(loginData);
      showResult(response, '로그인 성공');
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 조회 테스트
  const testGetUser = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      showResult(user, '사용자 정보 조회 성공');
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 테스트
  const testLogout = async () => {
    setLoading(true);
    try {
      await logout();
      showResult({}, '로그아웃 성공');
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>FastAPI 테스트</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>API 테스트 버튼</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testSignup} 
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            회원가입 테스트
          </button>
          
          <button 
            onClick={testLogin} 
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            로그인 테스트
          </button>
          
          <button 
            onClick={testGetUser} 
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            사용자 정보 조회
          </button>
          
          <button 
            onClick={testLogout} 
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            로그아웃 테스트
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        minHeight: '200px'
      }}>
        <h3>결과:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {loading ? '로딩 중...' : result || 'API 호출 결과가 여기에 표시됩니다.'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <h3>사용 방법:</h3>
        <ol>
          <li>FastAPI 서버가 <code>http://localhost:8000</code>에서 실행 중인지 확인</li>
          <li>위 버튼들을 클릭하여 각 API 테스트</li>
          <li>순서: 회원가입 → 로그인 → 사용자 정보 조회 → 로그아웃</li>
          <li>결과는 아래에 JSON 형식으로 표시됩니다</li>
        </ol>
        <p><strong>주의:</strong> 서버 주소를 변경하려면 <code>src/apis/client.ts</code> 파일의 BASE_URL을 수정하세요.</p>
      </div>
    </div>
  );
};

export default ApiTest;
