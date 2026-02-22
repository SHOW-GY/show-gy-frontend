import axios, { AxiosInstance, AxiosError } from 'axios';

// FastAPI Server URL
const BACKEND_URL = 'http://127.0.0.1:8000';

// ✅ HashRouter(#/...) 기준 로그인 이동
const redirectToLogin = () => {
  window.location.replace('/#/login');
};

// ✅ 서버 응답이 어떻든 로컬은 무조건 로그아웃
const hardLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('userLogout'));
  redirectToLogin();
};

// Axios Instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // ✅ 백엔드 꺼짐/연결 실패(= error.response 없음) 또는 API 404를 서비스 불가로 처리
    // - 배포에서 /api/* 가 정적(Cloudflare)에서 404 떨어지는 케이스까지 커버
    const url = (originalRequest?.url ?? '') as string;
    const isApiCall = url.startsWith('/api/') || url.startsWith('api/');
    const status = error.response?.status;

    const isNetworkDown = !error.response; // 백엔드 꺼짐/CORS/네트워크
    const isApi404 = isApiCall && status === 404;

    if ((isNetworkDown || isApi404) && !originalRequest?._logoutHandled) {
      originalRequest._logoutHandled = true;
      hardLogout();
      return Promise.reject(error);
    }

    // ✅ 401 처리 + refresh 재시도
    if (status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        hardLogout();
        return Promise.reject(error);
      }

      try {
        // refresh token으로 새 access token 요청
        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/refresh`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const newAccessToken = response.data?.data?.access_token;
        if (!newAccessToken) {
          throw new Error('No access_token in refresh response');
        }

        localStorage.setItem('access_token', newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        hardLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
