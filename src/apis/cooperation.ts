import apiClient from './client';
import {
	GenerateTeamRequest,
	GenerateTeamResponse,
	TeamparticipationRequest,
	TeamparticipationResponse,
} from './types';

export const generateTeam = async (payload: GenerateTeamRequest) => {
	const response = await apiClient.post<GenerateTeamResponse>('/api/v1/auth/team', payload);
	return response.data;
};

export const participateTeam = async (payload: TeamparticipationRequest) => {
	const response = await apiClient.post<TeamparticipationResponse>('/api/v1/auth/team/participation', payload);
	return response.data;
};