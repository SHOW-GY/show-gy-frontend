import apiClient from './client';
import {
	GenerateTeamRequest,
	GenerateTeamResponse,
	TeamparticipationRequest,
	TeamparticipationResponse,
	TeamInfoRequest,
	TeamInfoResponse,
} from './types';

export const generateTeam = async (payload: GenerateTeamRequest) => {
	const response = await apiClient.post<GenerateTeamResponse>('/api/v1/auth/team', payload);
	return response.data;
};

export const participateTeam = async (payload: TeamparticipationRequest) => {
	const response = await apiClient.post<TeamparticipationResponse>('/api/v1/auth/team/participation', payload);
	return response.data;
};

export const getTeamInfo = async (): Promise<TeamInfoResponse> => {
  const res = await apiClient.get<TeamInfoResponse>("/api/v1/user/team");
  return res.data;
};

// ── 팀 멤버 / 가입 신청 ──

export type TeamMember = {
  user_id: string;
  leader: boolean;
  nickname: string | null;
  last_name: string | null;
  first_name: string | null;
  email: string | null;
};

export type JoinRequest = {
  user_id: string;
  requested_at: string;
  nickname: string | null;
  last_name: string | null;
  first_name: string | null;
  email: string | null;
};

export const getTeamMembers = async (teamCode: string) => {
  const res = await apiClient.get<{ status: string; data: TeamMember[] }>(
    `/api/v1/auth/team/${encodeURIComponent(teamCode)}/members`
  );
  return res.data.data;
};

export const getJoinRequests = async (teamCode: string) => {
  const res = await apiClient.get<{ status: string; data: JoinRequest[] }>(
    `/api/v1/auth/team/${encodeURIComponent(teamCode)}/join-requests`
  );
  return res.data.data;
};

// {teamCode: count} 맵. 리더가 아닌 팀은 키가 없음.
export const getMyLeaderPendingCounts = async (): Promise<Record<string, number>> => {
  const res = await apiClient.get<{ status: string; data: Record<string, number> }>(
    "/api/v1/auth/team/join-requests/pending-counts"
  );
  return res.data.data;
};

export const approveJoinRequest = async (teamCode: string, userId: string) => {
  const res = await apiClient.patch(
    `/api/v1/auth/team/${encodeURIComponent(teamCode)}/join-requests/${encodeURIComponent(userId)}/approve`
  );
  return res.data;
};

export const rejectJoinRequest = async (teamCode: string, userId: string) => {
  const res = await apiClient.delete(
    `/api/v1/auth/team/${encodeURIComponent(teamCode)}/join-requests/${encodeURIComponent(userId)}`
  );
  return res.data;
};