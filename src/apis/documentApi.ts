import apiClient from './client';
import {
  GetDocumentsResponse,
  DeleteDocumentResponse,
  GetDeletedDocumentsResponse,
  GetRecentDocumentsResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  MoveToTrashRequest,
  MoveToTrashResponse,
  EditDocumentRequest,
  EditDocumentResponse,
  RealeaseEditingRequest,
  RealeaseEditingResponse
} from './types';

{/* 문서 리스트 조회 */}
export const getDocuments = async () => {
  const res = await apiClient.post<GetDocumentsResponse>(
    `/api/v1/document/all`,
    { withCredentials: true }
  );
  return res.data;
};

{/* 문서 완전 삭제 */}
export const deleteDocument = async () => {
  const res = await apiClient.delete<DeleteDocumentResponse>(
    `/api/v1/document/trash`,
    { withCredentials: true }
  );
  return res.data;
}

{/* 휴지통 문서 리스트 조회 */}
export const getDeletedDocuments = async () => {
  const res = await apiClient.get<GetDeletedDocumentsResponse>(
    `/api/v1/document/trash`,
    { withCredentials: true }
  );
  return res.data;
};

{/* 최근 문서 리스트 조회 */}
export const getRecentDocuments = async () => {
  const res = await apiClient.post<GetRecentDocumentsResponse>(
    `/api/v1/document/recent`,
    { withCredentials: true }
  );
  return res.data;
};

{/* 문서 업로드 */}
export const uploadDocument = async ({ team_name, file }: UploadDocumentRequest) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<UploadDocumentResponse>(
    `/api/v1/document/upload`,
    formData,
    {
      params: { team_name },
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );

  return res.data;
};

{/* 문서 휴지통으로 이동 */}
export const moveToTrash = async ({ document_id }: MoveToTrashRequest) => {
  const res = await apiClient.patch<MoveToTrashResponse>(
    `/api/v1/document/${document_id}/trash`,
    { document_id },
    { withCredentials: true }
  );
  return res.data;
};

{/* 문서 편집 상태 변경 */}
export const editDocument = async ({ document_id }: EditDocumentRequest) => {
  const res = await apiClient.patch<EditDocumentResponse>(
    `/api/v1/document/${document_id}/start-editing`,
    { document_id },
    { withCredentials: true }
  );
  return res.data;
};

{/* 문서 편집 해제 */}
export const releaseEditing = async ({ document_id }: RealeaseEditingRequest) => {
  const res = await apiClient.patch<RealeaseEditingResponse>(
    `/api/v1/document/${document_id}/status`,
    { document_id },
    { withCredentials: true }
  );
  return res.data;
};