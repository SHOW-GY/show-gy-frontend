import axios, { AxiosInstance, AxiosError } from 'axios';

{/*FastAPI Server URL*/}
const BACKEND_URL = 'http://127.0.0.1:8000';

{/*Axios 인스턴스 생성*/}
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {    
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
  withCredentials: true,
});

{/*인터셉터 설정 - 요청마다 토큰 자동 첨부 + 401 에러 시 토큰 갱신 시도*/}
apiClient.interceptors.request.use(
  (config) => {
    // ✅ 쿠키 기반 인증: Authorization 헤더를 JS가 만들지 않음
    return config;
  },
  (error) => Promise.reject(error)
);

{/*로그인 API 함수*/}
let isRefreshing = false;
let failedQueue: any[] = [];

{/*토큰 갱신 후 대기 중인 요청 처리 함수*/}
const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

{/*강제 로그아웃 함수 (중복 제거)*/}
const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

{/* 강제 로그아웃 기능*/}
apiClient.interceptors.response.use(
  (response) => { 
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config ?? {};
    if (!error.response) {
      forceLogout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ refresh_token 쿠키로 재발급 요청
        await apiClient.post('/api/v1/auth/refresh'); // withCredentials는 apiClient에 이미 true

        // ✅ access_token도 쿠키로 갱신됐을 테니, 원래 요청을 그냥 재시도
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

    if (error.response?.status === 403) {
      forceLogout();
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;