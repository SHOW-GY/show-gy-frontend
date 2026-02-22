import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  CheckUserIdRequest,
  CheckUserIdResponse,
  RequestEmailVerificationRequest,
  RequestEmailVerificationResponse,
  VerifyEmailCodeRequest,
  VerifyEmailCodeResponse,
} from './types';

// Login
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  //Transform OAuth2 form data format
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);
  
  const response = await apiClient.post('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  console.log('authApi 로그인 응답 전체:', response.data);
  
  // Save Token
  if (response.data.data?.access_token) {
    localStorage.setItem('access_token', response.data.data.access_token);
  }
  
  // Save User Info
  if (response.data.data) {
    const userInfo = {
      user_id: response.data.data.user_id,
      nickname: response.data.data.nickname,
      first_name: response.data.data.first_name,
      last_name: response.data.data.last_name,
      email: response.data.data.email,
      register_date: response.data.data.register_date
    };
    localStorage.setItem('user', JSON.stringify(userInfo));
    console.log('사용자 정보 저장됨:', userInfo);
    window.dispatchEvent(new Event('userLogin'));
  } else {
    console.warn('사용자 정보를 찾을 수 없음:', response.data);
  }
  
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch (e) {
    // 백엔드 꺼짐/네트워크 에러여도 로컬 로그아웃은 진행
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLogout')); // 있으면
  }
};

// Refresh Token
export const refreshToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }
  
  const response = await apiClient.post<RefreshTokenResponse>('/api/v1/auth/refresh');
  
  if (response.data.data?.access_token) {
    localStorage.setItem('access_token', response.data.data.access_token);
    return response.data.data.access_token;
  }
  
  throw new Error('Failed to refresh token');
};

// Request Email Verification
export const requestEmailVerification = async (
  userId: string,
  email: string
): Promise<RequestEmailVerificationResponse | void> => {
  const payload: RequestEmailVerificationRequest = {
    type: false,
    user_id: userId,
    email: email,
  };
  const response = await apiClient.post<RequestEmailVerificationResponse>('/api/v1/auth/email', payload);
  return response.data;
};

// Verify Email Code
export const verifyEmailCode = async (
  email: string,
  code: string
): Promise<VerifyEmailCodeResponse | void> => {
  const payload: VerifyEmailCodeRequest = {
    code: parseInt(code),
    email: email,
  };
  const response = await apiClient.post<VerifyEmailCodeResponse>('/api/v1/auth/email/verify', payload);
  return response.data;
};

// Check User Id Availability
export const checkUserIdAvailability = async (
  userId: string
): Promise<CheckUserIdResponse> => {
  const payload: CheckUserIdRequest = { user_id: userId };
  const response = await apiClient.post<CheckUserIdResponse>('/api/v1/auth/checking_user_id', payload);
  return response.data;
};
