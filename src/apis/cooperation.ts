import apiClient from './client';
import { GenerateTeamRequest, GenerateTeamResponse } from './types';

export const generateTeam = async (payload: GenerateTeamRequest) => {
	const response = await apiClient.post<GenerateTeamResponse>('/api/v1/auth/team', payload);
	return response.data;
};
