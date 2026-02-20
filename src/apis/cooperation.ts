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