import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  CheckUserIdRequest,
  CheckUserIdResponse,
  RequestEmailVerificationRequest,
  RequestEmailVerificationResponse,
  VerifyEmailCodeRequest,
  VerifyEmailCodeResponse,
} from './types';

{/* 로그인 */}
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);
  const response = await apiClient.post('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const me = await apiClient.get('/api/v1/user/me');
  if (me.data?.data) {
    localStorage.setItem('user', JSON.stringify(me.data.data));
    window.dispatchEvent(new Event('userLogin'));
  } else {
  }
  return response.data;
};

{/* 로그아웃 */}
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch (e) {
  } finally {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLogout'));
  }
};

{/* Refresh Token: 자동 갱신은 client.ts response interceptor 가 401 받았을 때 처리.
    별도 함수는 필요 없음 — backend 가 httpOnly 쿠키로 access/refresh 다 관리. */}

{/* Request Email Verification */}
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

{/* Verify Email Code */}
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

{/* Check User Id Availability */}
export const checkUserIdAvailability = async (
  userId: string
): Promise<CheckUserIdResponse> => {
  const payload: CheckUserIdRequest = { user_id: userId };
  const response = await apiClient.post<CheckUserIdResponse>('/api/v1/auth/checking_user_id', payload);
  return response.data;
};
