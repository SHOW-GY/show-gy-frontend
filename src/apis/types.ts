// API 요청/응답 타입 정의

// 사용자 관련 타입
export interface CreateUserRequest {
  type: boolean;
  user_id: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface RePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export interface EmailRequest {
  type: boolean;
  user_id: string;
  code: number;
  email: string;
}

export interface EmailVerifyRequest {
  code: string;
  email: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
