import apiClient from './client';

export interface UploadDocumentResponse {
  status: string;
  data?: any;
  message?: string;
}

export interface UploadDocumentParams {
  team_id?: string;
  approver_id?: string;
  creator_id?: string;
}

export const uploadDocument = async (
  file: File,
  params?: UploadDocumentParams
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadDocumentResponse>(
    '/api/v1/document/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // team_id, approver_id, creator_id 등이 필요한 경우 쿼리스트링으로 전달
      params,
    }
  );

  return response.data;
};
