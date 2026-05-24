import axios, { AxiosInstance, AxiosError, AxiosHeaders } from 'axios';

/* FastAPI Server URL — 환경변수 또는 같은 호스트(nginx 프록시) */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/* 로그인 페이지 이동 */
const redirectToLogin = () => {
  window.location.replace('/#/login');
};

/* 강제 로그아웃: 인증 실패 확정 시. 이미 로그인 페이지면 redirect 스킵해 루프 방지. */
const forceLogout = () => {
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('userLogout'));
  const hash = window.location.hash || '';
  if (!hash.startsWith('#/login')) {
    redirectToLogin();
  }
};

/* Axios 인스턴스 생성 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 300000,  // QA: 챗봇 LLM 다단계 처리 시간 보장. 운영 시 재검토.
  withCredentials: true,
});

/* 요청 인터셉터 */
apiClient.interceptors.request.use(
  (config) => {
    const method = (config.method ?? '').toLowerCase();
    if (
      method === 'post' || method === 'put' || method === 'patch'
    ) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      config.headers = headers;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* refresh 동시 요청 방지 */
let isRefreshing = false;
let failedQueue: any[] = [];

/* refresh 대기열 처리 */
const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

/* Response 인터셉터 */
apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest: any = error.config ?? {};

    const url = (originalRequest?.url ?? '') as string;
    // refresh 요청 자체가 401이면 이 인터셉터가 또 refresh 시도하면서 deadlock 발생 → 스킵해야 함
    const isRefreshCall = url.includes('/api/v1/auth/refresh');

    const status = error.response?.status;
    if (!error.response && !originalRequest._logoutHandled) {
      originalRequest._logoutHandled = true;
      forceLogout();
      return Promise.reject(error);
    }
    // refresh 호출이 401이면 refresh 자체가 만료된 것 → 바로 reject (outer catch에서 forceLogout)
    if (status === 401 && isRefreshCall) {
      return Promise.reject(error);
    }
    if (status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/v1/auth/refresh');

        processQueue(null);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;

        forceLogout();
        return Promise.reject(refreshError);
      }
    }
    if (status === 403) {
      forceLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

/* 에러 메시지 표준 추출 — 백엔드 통합 포맷 {error_code, message, path} 우선,
   외부/구 포맷 호환 위해 detail 도 fallback. */
export function getErrorMessage(error: any, fallback = '요청에 실패했습니다.'): string {
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.detail === 'string' && data.detail) return data.detail;
  if (data?.detail) return JSON.stringify(data.detail);
  return error?.message || fallback;
}

export const syncAuthFromMe = async () => {
  try {
    const me = await apiClient.get('/api/v1/user/me');
    const userInfo = me.data?.data;

    if (!userInfo?.user_id) throw new Error('Invalid /me response');

    localStorage.setItem('user', JSON.stringify(userInfo));
    window.dispatchEvent(new Event('userLogin'));
    return userInfo;
  } catch (e) {
    forceLogout();
    throw e;
  }
};

export default apiClient;