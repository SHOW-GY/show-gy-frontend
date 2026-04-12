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

{/* 문서 휴지통 복구 */}
export const restoreDocument = async (documentId: number) => {
  const res = await apiClient.patch(
    `/api/v1/document/${documentId}/restore`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

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

{/* 단건 문서 조회 */}
export const getDocumentById = async (documentId: number) => {
  const res = await apiClient.get<{
    status: string;
    data: {
      id: number;
      title: string;
      file_path: string;
      extension: string;
      status: string;
      extracted_data: {
        text: string;
        summary: string;
        total_pages: number;
        common_fonts: string[];
        structure: any[];
      } | null;
      register_date: string | null;
      source_document_id: number | null;
    };
  }>(`/api/v1/document/${documentId}`, { withCredentials: true });
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

{/* 문서 내용 저장 (Delta) */}
export const saveDocumentContent = async (documentId: number, deltaDocument: any) => {
  const res = await apiClient.patch(
    `/api/v1/document/${documentId}/content`,
    { delta_document: deltaDocument },
    { withCredentials: true }
  );
  return res.data;
};

{/* 승인된 문서 목록 조회 (레퍼런스 선택용) */}
export const getApprovedDocuments = async (documentId: number) => {
  const res = await apiClient.get<{
    status: string;
    data: Array<{
      id: number;
      title: string;
      approver_id: string;
      register_date: string | null;
    }>;
    default_ref_id: number | null;
  }>(`/api/v1/document/${documentId}/approved-list`, { withCredentials: true });
  return res.data;
};

{/* 문서 평가 요청 */}
export const evaluateDocument = async (documentId: number, refDocumentId?: number) => {
  const res = await apiClient.post(
    `/api/v1/document/${documentId}/evaluate`,
    { ref_document_id: refDocumentId },
    { withCredentials: true }
  );
  return res.data;
};

{/* 팀장(승인자) 누적 스타일 조회 — PDF/Quill에 즉시 적용 가능한 형태 */}
export type LeaderStyleResponse = {
  status: string;
  has_data: boolean;
  approver_id?: string;
  data: {
    margins: { top: number; bottom: number; left: number; right: number } | null;
    fontFamily: string | null;     // Quill 폰트 키 (예: "NanumGothic")
    pageSize: { width: number; height: number } | null;
    approvedDocumentCount: number;
    textStyleSummary: {
      dominantTone: string | null;
      politenessLevel: string | null;
      preferredDateFormat: string | null;
      preferredListFormat: string | null;
    };
  } | null;
  message?: string;
};

export const getLeaderStyle = async (documentId: number): Promise<LeaderStyleResponse> => {
  const res = await apiClient.get<LeaderStyleResponse>(
    `/api/v1/document/${documentId}/leader-style`,
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

{/* 문서 편집 해제 — status는 'pending' 또는 'approved' */}
export const releaseEditing = async (
  { document_id, status = 'pending' }: RealeaseEditingRequest & { status?: 'pending' | 'approved' }
) => {
  const res = await apiClient.patch<RealeaseEditingResponse>(
    `/api/v1/document/${document_id}/status`,
    { status },
    { withCredentials: true }
  );
  return res.data;
};