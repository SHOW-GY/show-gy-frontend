import axios, { AxiosInstance, AxiosError } from 'axios';

// FastAPI Server URL
const BACKEND_URL = 'http://127.0.0.1:8000';

{/*Axios 인스턴스 생성*/}
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {    
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

{/*인터셉터 설정 - 요청마다 토큰 자동 첨부 + 401 에러 시 토큰 갱신 시도*/}
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

{/*로그인 API 함수*/}
let isRefreshing = false;
let failedQueue: any[] = [];

{/*토큰 갱신 후 대기 중인 요청 처리 함수*/}
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

{/* 토큰이 없으면 강제 로그아웃 기능(401에러)*/}
apiClient.interceptors.response.use(
  (response) => {   
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/refresh`);
        const newAccessToken = response.data.data.access_token;
        
        localStorage.setItem('access_token', newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;