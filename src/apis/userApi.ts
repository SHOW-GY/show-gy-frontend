import apiClient from './client';
import {
  CreateUserRequest,
  User,
} from './types';

// Sign up
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  // 끝 슬래시 필수: 백엔드 회원가입 라우트가 /user/ 라서, /user 로 보내면 307 redirect →
  // Cloudflare(https) 뒤에서 http 로 리다이렉트되며 브라우저가 차단 → 회원가입 실패.
  const response = await apiClient.post<User>('/api/v1/user/', data);
  return response.data;
};

// Delete user
export const deleteUser = async (): Promise<void> => {
  const response = await apiClient.delete('/api/v1/user/me');
  return response.data;
};