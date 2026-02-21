import apiClient from "./client"; // 네 axios instance 경로에 맞춰
// BACKEND_URL을 apiClient가 baseURL로 쓰고 있으면 아래 buildImageUrl만 조정하면 됨.

export type SaveProfileImageResponse = {
  status: string;
  profile_path: string;
};

export type GetProfileImageResponse = {
  status: string;
  profile_path: string;
};

{/*프로필 이미지 업로드함수인데 경로 수정중이여서 보류함*/}
export function buildProfileImageUrl(profilePath: string) {
  // 1) "show-gy-backend/" 제거
  const normalized = profilePath.replace(/^show-gy-backend\//, "");
  // 2) 앞에 / 없으면 붙이기
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  // 3) apiClient.baseURL이 예: http://127.0.0.1:8000 이라면 아래처럼
  const base = (apiClient.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}${withSlash}`;
}

export async function uploadProfileImage(params: {
  file: File;
  file_name: string;
  before_file_path?: string; // 없으면 ""
}) {
  const { file, file_name, before_file_path } = params;

  const form = new FormData();
  // swagger에 file_content 라고 되어있음
  form.append("file_content", file);

  const res = await apiClient.post<SaveProfileImageResponse>(
    `/api/v1/user/profile_image`,
    form,
    {
      params: {
        file_name,
        before_file_path: before_file_path ?? "",
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

// swagger상 path param이 필요하니까 아무 값이나 넣어서 호출.
// Copilot 말대로 실제로는 user_id 기반으로 DB에서 가져오는 구조일 확률 높음.
export async function getProfileImagePath() {
  const dummy = "me"; // 아무거나
  const res = await apiClient.get<GetProfileImageResponse>(
    `/api/v1/user/profile_image/${encodeURIComponent(dummy)}`
  );
  return res.data;
}