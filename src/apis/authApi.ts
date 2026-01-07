import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  EmailRequest,
  EmailVerifyRequest,
} from './types';

/**
 * 인증 관련 API 함수들
 */

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
  
  // 토큰 저장
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
  }
  
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/v1/auth/logout');
  
  // 토큰 제거
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
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
