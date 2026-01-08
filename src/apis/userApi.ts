import apiClient from './client';
import {
  CreateUserRequest,
  UpdateUserRequest,
  RePasswordRequest,
  User,
} from './types';

/**
 * 사용자 관련 API 함수들
 */

// 사용자 생성 (회원가입)
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<User>('/api/v1/user', data);
  return response.data;
};

// 사용자 정보 수정
export const updateUser = async (data: UpdateUserRequest): Promise<User> => {
  const response = await apiClient.patch<User>('/api/v1/user/me', data);
  return response.data;
};

// 사용자 삭제
export const deleteUser = async (): Promise<void> => {
  await apiClient.delete('/api/v1/user/me');
};

// 비밀번호 변경
export const changePassword = async (data: RePasswordRequest): Promise<void> => {
  await apiClient.post('/api/v1/user/re-password', data);
};

// 현재 사용자 정보 조회 (추가 기능)
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/api/v1/user/me');
  return response.data;
};

// 아이디 중복 확인
export const checkUserIdDuplicate = async (userId: string): Promise<{ is_available: boolean; message: string }> => {
  
  const response = await apiClient.get(`/api/v1/user/check-duplicate?user_id=${userId}`);
  return response.data;
};
