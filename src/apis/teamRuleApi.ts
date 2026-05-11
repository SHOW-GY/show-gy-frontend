import apiClient from './client';

export type ParagraphStructure = 'front_loaded' | 'back_loaded' | 'wrapped' | 'mixed';
export type ResponseFormat = 'narrative' | 'bullet' | 'numbered';
export type FormalityLevel = 'formal' | 'semi_formal' | 'casual';
export type SentenceLength = 'short' | 'medium' | 'long';

export type TeamRule = {
  paragraph_structure: ParagraphStructure | null;
  response_format: ResponseFormat | null;
  formality_level: FormalityLevel | null;
  sentence_length: SentenceLength | null;
};

export type TeamRuleResponse = {
  team_id: string;
  is_leader: boolean;
  leader_id: string | null;
  rule: TeamRule;
  ban_words: string[];
  ban_contexts: string[];
};

export type TeamRuleUpdateRequest = {
  team_id: string;
  rule: TeamRule;
  ban_words: string[];
  ban_contexts: string[];
};

export const getTeamRule = async (teamId: string): Promise<TeamRuleResponse> => {
  const res = await apiClient.get<TeamRuleResponse>(
    `/api/v1/team/rule`,
    { params: { team_id: teamId }, withCredentials: true },
  );
  return res.data;
};

export const updateTeamRule = async (
  payload: TeamRuleUpdateRequest,
): Promise<{ status: string; team_id: string }> => {
  const res = await apiClient.put<{ status: string; team_id: string }>(
    `/api/v1/team/rule`,
    payload,
    { withCredentials: true },
  );
  return res.data;
};
