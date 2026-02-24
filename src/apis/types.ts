{/* Sign up */}
export interface CreateUserRequest {
  user_id: string;
  user_pw: string;
  last_name: string;
  first_name: string;
  nickname: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  created_at: string;
}

{/* 로그인 */}
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status : string;
  data : {
    user_id : string;
    nickname : string;
    last_name : string;
    first_name : string;
    email : string;
    register_date : string;
  }
}

{/* Refresh Token */}
export interface RefreshTokenResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
  };
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

{/* 중복 확인 */}
export interface CheckUserIdRequest {
  user_id: string;
}

export interface CheckUserIdResponse {
  message: string;
}

{/* 이메일 인증 */}
export interface RequestEmailVerificationRequest {
  type: boolean;
  user_id: string;
  email: string;
}

export interface RequestEmailVerificationResponse {
  message?: string;
  success?: boolean;
}

export interface VerifyEmailCodeRequest {
  code: number;
  email: string;
}

export interface VerifyEmailCodeResponse {
  message?: string;
  success?: boolean;
}

{/* 팀 생성 */}
export interface GenerateTeamRequest{
  team_name: string;
}

export interface GenerateTeamResponse {
  status: string;
  message: string;
  data: {
    team_name: string;
    team_code: string;
    user_id: string;
    team_owner: boolean;
  };
}

export interface TeamparticipationRequest{
  team_code: string;
}

export interface TeamparticipationResponse{
  status: string;
  message: string;
  data: {
    team_name: string;
    user_id: string;
    team_owner: boolean;
  };
}

export interface TeamInfoRequest {}

export interface TeamInfoResponse {
  status : string;
  message : string;
  data : {
    team_name : string;
    team_id : string;
    team_code : string;
    team_owner : boolean;
  }
}

{/* 문서 관련 */}

{/* 모든 문서를 가져옴 */}
export interface GetDocumentsResponse {
  status: string;
  data :{
    title: string;
    file_path: string;
    team_id: string;
    team_leader: string;
    access_at : string;
  }
}

{/* 문서를 완전히 삭제 */}
export interface DeleteDocumentResponse {
  status: string;
}

{/* 휴지통 문서 리스트 */}
export interface GetDeletedDocumentsResponse {
  status: string;
  data: {
    title: string;
    file_path: string;
    team_id: string;
    team_leader: string;
    access_at : string;
  }
}

{/* 최근 문서 리스트 */}
export interface GetRecentDocumentsResponse {
  status: string;
  data: {
    title: string;
    file_path: string;
    team_id: string;
    team_leader: string;
    access_at : string;
  }
}

{/* 문서 업로드 */}
export interface UploadDocumentRequest {
  team_name: string;
  file: File;
}

export interface ExtractedData {
  text: string;
  summary: string;
  total_pages: number;
  common_fonts: string[];
  structure: PageStructure[];
  has_text: boolean;
}

export interface PageStructure {
  page_number: number;
  width: number;
  height: number;
  margins: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  fonts: string[];
}

export interface UploadDocumentResponse {
  id: number;
  extension: string;
  status: string;
  is_delete: boolean;
  title: string;
  file_path: string;
  extracted_data: ExtractedData;
  register_date: string;
}

{/* 문서 휴지통으로 이동 */}
export interface MoveToTrashRequest {
  document_id: string;
}

export interface MoveToTrashResponse {
  status: string;
  document_id: string;
}

{/* 문서 편집 상태*/}
export interface EditDocumentRequest {
  document_id: string;
}

export interface EditDocumentResponse {
  status: string;
}

export interface RealeaseEditingRequest {
  document_id: string;
}

export interface RealeaseEditingResponse {
  status: string;
}