// Sign up
export interface CreateUserRequest {
  user_id: string;
  user_pw: string;
  last_name: string;
  first_name: string;
  nickname: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  created_at: string;
}

// Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Refresh Token
export interface RefreshTokenResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
  };
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Check User Id (중복 확인)
export interface CheckUserIdRequest {
  user_id: string;
}

export interface CheckUserIdResponse {
  message: string; // 예: "새로운 ID 입니다."
}

// Email Verification
export interface RequestEmailVerificationRequest {
  type: boolean;
  user_id: string;
  email: string;
}

export interface RequestEmailVerificationResponse {
  message?: string;
  success?: boolean;
}

export interface VerifyEmailCodeRequest {
  code: number;
  email: string;
}

export interface VerifyEmailCodeResponse {
  message?: string;
  success?: boolean;
}

// Generate Team
export interface GenerateTeamRequest{
  team_name: string;
}

export interface GenerateTeamResponse {
  status: string;
  message: string;
  data: {
    team_name: string;
    team_code: string;
    user_id: string;
    team_owner: boolean;
  };
}

export interface TeamparticipationRequest{
  team_code: string;
}

export interface TeamparticipationResponse{
  status: string;
  message: string;
  data: {
    team_name: string;
    user_id: string;
    team_owner: boolean;
  };
}