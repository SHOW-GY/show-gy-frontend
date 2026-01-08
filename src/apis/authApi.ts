import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  EmailRequest,
  EmailVerifyRequest,
} from './types';


// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // OAuth2 폼 데이터 형식으로 변환
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);
  
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  console.log('authApi 로그인 응답 전체:', response.data);  // 디버그용
  
  // 토큰 저장
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
  }
  
  // 사용자 정보 저장 - 다양한 응답 구조 처리
  let userToSave = null;
  
  // 케이스 1: response.data에 직접 nickname이 있는 경우
  if (response.data.nickname) {
    userToSave = response.data;
  }
  // 케이스 2: response.data.data에 사용자 정보가 있는 경우
  else if (response.data.data && response.data.data.nickname) {
    userToSave = response.data.data;
  }
  // 케이스 3: response.data.user에 사용자 정보가 있는 경우
  else if (response.data.user) {
    userToSave = response.data.user;
  }
  
  if (userToSave) {
    localStorage.setItem('user', JSON.stringify(userToSave));
    console.log('사용자 정보 저장됨:', userToSave);
    // Header가 업데이트되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('userLogin'));
  } else {
    console.warn('사용자 정보를 찾을 수 없음:', response.data);
  }
  
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/v1/auth/logout');
  
  // 토큰 제거
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// 토큰 갱신
export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });
  
  // 새로운 액세스 토큰 저장
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  
  return response.data;
};

// 이메일 인증 요청
export const requestEmailVerification = async (data: EmailRequest): Promise<void> => {
  await apiClient.post('/api/v1/auth/email', data);
};

// 이메일 인증 확인
export const verifyEmail = async (data: EmailVerifyRequest): Promise<void> => {
  await apiClient.post('/api/v1/auth/email/verify', data);
};
