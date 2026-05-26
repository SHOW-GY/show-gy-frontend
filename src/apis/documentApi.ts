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

// 단건 문서 응답 모듈 캐시 — 뒤로가기/재진입 시 네트워크 0번으로 즉시 표시.
// mutation 직후 invalidateDocumentCache로 무효화한다.
type DocumentCacheEntry = { data: any; ts: number };
const documentCache = new Map<number, DocumentCacheEntry>();

export const invalidateDocumentCache = (documentId?: number) => {
  if (documentId == null) documentCache.clear();
  else documentCache.delete(documentId);
};

{/* 문서 리스트 조회 */}
export const getDocuments = async () => {
  const res = await apiClient.post<GetDocumentsResponse>(
    `/api/v1/document/all`,
    { withCredentials: true }
  );
  return res.data;
};

{/* 문서 완전 삭제 — 휴지통의 문서 영구 제거 */}
export const deleteDocument = async (documentIds: Array<string | number>) => {
  const ids = documentIds.map(id => String(id));
  const res = await apiClient.delete<DeleteDocumentResponse>(
    `/api/v1/document/trash`,
    { data: ids, withCredentials: true }
  );
  documentIds.forEach(id => invalidateDocumentCache(Number(id)));
  return res.data;
}

{/* 문서 휴지통 복구 */}
export const restoreDocument = async (documentId: number) => {
  const res = await apiClient.patch(
    `/api/v1/document/${documentId}/restore`,
    {},
    { withCredentials: true }
  );
  invalidateDocumentCache(documentId);
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

{/* 멀티 파일 + 사용자 질의 → 요약 Document 생성. 응답의 document_id 로 /summary/center/{id} 이동. */}
export interface SummarizeDocumentsResponse {
  status: string;
  data: {
    document_id: number;
    title: string;
  };
}

export const summarizeDocuments = async ({
  team_name,
  query,
  files,
  doc_types,
}: {
  team_name: string;
  query: string;
  files: File[];
  doc_types?: string[];
}) => {
  const formData = new FormData();
  formData.append("team_name", team_name);
  formData.append("query", query);
  for (const f of files) {
    formData.append("files", f);
  }
  // doc_types는 files와 같은 순서로 보내야 함. 비어있으면 백엔드가 전부 'general' 처리.
  if (doc_types && doc_types.length > 0) {
    for (const t of doc_types) {
      formData.append("doc_types", t);
    }
  }

  const res = await apiClient.post<SummarizeDocumentsResponse>(
    `/api/v1/document/summarize`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
      // Claude 호출 + 텍스트 추출 합쳐 30~90초 걸릴 수 있음
      timeout: 120_000,
    }
  );

  return res.data;
};

{/* 단건 문서 조회 — staleMs > 0 이고 캐시가 신선하면 네트워크 없이 반환 */}
export const getDocumentById = async (
  documentId: number,
  options?: { staleMs?: number; force?: boolean },
) => {
  const staleMs = options?.staleMs ?? 0;
  const force = options?.force ?? false;

  if (!force && staleMs > 0) {
    const cached = documentCache.get(documentId);
    if (cached && Date.now() - cached.ts < staleMs) {
      return cached.data;
    }
  }

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
  documentCache.set(documentId, { data: res.data, ts: Date.now() });
  return res.data;
};

{/* 문서 휴지통으로 이동 */}
export const moveToTrash = async ({ document_id }: MoveToTrashRequest) => {
  const res = await apiClient.patch<MoveToTrashResponse>(
    `/api/v1/document/${document_id}/trash`,
    { document_id },
    { withCredentials: true }
  );
  invalidateDocumentCache(Number(document_id));
  return res.data;
};

{/* 문서 내용 저장 (Delta + 선택적 제목) */}
export const saveDocumentContent = async (
  documentId: number,
  deltaDocument: any,
  title?: string,
) => {
  const body: Record<string, any> = { delta_document: deltaDocument };
  if (typeof title === 'string') body.title = title;
  const res = await apiClient.patch(
    `/api/v1/document/${documentId}/content`,
    body,
    { withCredentials: true }
  );
  invalidateDocumentCache(documentId);
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
  invalidateDocumentCache(documentId);
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
  invalidateDocumentCache(Number(document_id));
  const copyId = res.data?.data?.copy_document_id;
  if (copyId != null) invalidateDocumentCache(Number(copyId));
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
  invalidateDocumentCache(Number(document_id));
  return res.data;
};

{/* 작업본을 팀장 검토 대기 상태로 제출 */}
export const submitDocument = async (documentId: number) => {
  const res = await apiClient.post<{ status: string; message: string; approver_id: string }>(
    `/api/v1/document/${documentId}/submit`,
    {},
    { withCredentials: true }
  );
  invalidateDocumentCache(documentId);
  return res.data;
};

{/* 팀장이 제출된 작업본을 반려 (재제출 가능) */}
export const rejectDocument = async (documentId: number, reason?: string) => {
  const res = await apiClient.post<{ status: string; message: string }>(
    `/api/v1/document/${documentId}/reject`,
    { reason: reason ?? '' },
    { withCredentials: true }
  );
  invalidateDocumentCache(documentId);
  return res.data;
};

{/* 팀장이 승인 */}
export const approveDocument = async (documentId: number) => {
  const res = await apiClient.post<{ status: string; message: string; archived_previous?: number }>(
    `/api/v1/document/approve/${documentId}`,
    {},
    { withCredentials: true }
  );
  invalidateDocumentCache(documentId);
  return res.data;
};

export type ReviewQueueItem = {
  document_id: number;
  title: string;
  creator_id: string;
  source_document_id: number | null;
  register_date: string | null;
};

{/* 팀장 검토 대기 큐 (해당 팀의 submitted) */}
export const getReviewQueue = async (teamCode: string) => {
  const res = await apiClient.get<{ status: string; data: ReviewQueueItem[] }>(
    `/api/v1/document/team/${encodeURIComponent(teamCode)}/review-queue`,
    { withCredentials: true }
  );
  return res.data.data;
};

export const getReviewQueueCount = async (teamCode: string) => {
  const res = await apiClient.get<{ status: string; data: { count: number } }>(
    `/api/v1/document/team/${encodeURIComponent(teamCode)}/review-queue-count`,
    { withCredentials: true }
  );
  return res.data.data.count;
};