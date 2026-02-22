import axios, { AxiosInstance, AxiosError } from 'axios';

/* FastAPI Server URL */
const BACKEND_URL = 'http://127.0.0.1:8000';

/* 로그인 페이지 이동 (HashRouter 대응) */
const redirectToLogin = () => {
  window.location.replace('/#/login');
};

/* 강제 로그아웃 */
const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  window.dispatchEvent(new Event('userLogout'));

  redirectToLogin();
};

/* Axios 인스턴스 생성 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // ✅ 쿠키 인증
});

/* 요청 인터셉터 */
apiClient.interceptors.request.use(
  (config) => {
    // 쿠키 인증이라 Authorization 헤더 안 씀
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
    const isApiCall =
      url.startsWith('/api/') || url.startsWith('api/');

    const status = error.response?.status;

    /* ================================
       ✅ 1. 백엔드 꺼짐 / 네트워크 에러
       ================================ */

    if (!error.response && !originalRequest._logoutHandled) {
      originalRequest._logoutHandled = true;
      forceLogout();
      return Promise.reject(error);
    }

    /* ================================
       ✅ 2. API 404 → 백엔드 없음 판단
       (Cloudflare 정적 404 대응)
       ================================ */

    if (
      isApiCall &&
      status === 404 &&
      !originalRequest._logoutHandled
    ) {
      originalRequest._logoutHandled = true;
      forceLogout();
      return Promise.reject(error);
    }

    /* ================================
       ✅ 3. Access Token 만료 → Refresh
       ================================ */

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
        // refresh_token 쿠키로 재발급
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

    /* ================================
       ✅ 4. 권한 없음
       ================================ */

    if (status === 403) {
      forceLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
