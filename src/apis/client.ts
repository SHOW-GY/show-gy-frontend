import axios, { AxiosInstance, AxiosError } from 'axios';

// FastAPI 서버 주소 - 환경에 맞게 수정하세요
const BASE_URL = 'http://127.0.0.1:8000';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {    
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 액세스 토큰 가져오기
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

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {   
    return response;
  },
  async (error: AxiosError) => {
    // 401 에러 처리 (토큰 만료)
    if (error.response?.status === 401) {
      // 토큰 제거 및 로그인 페이지로 리다이렉트 등의 처리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
