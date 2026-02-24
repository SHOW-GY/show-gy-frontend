import axios, { AxiosInstance, AxiosError, AxiosHeaders } from 'axios';

/* FastAPI Server URL */
const BACKEND_URL = 'http://localhost:8000';

/* 로그인 페이지 이동 (HashRouter 대응) */
const redirectToLogin = () => {
  window.location.replace('/#/login');
};

/* 강제 로그아웃 */
const forceLogout = () => {
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('userLogout'));
  // redirectToLogin();
};

/* Axios 인스턴스 생성 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
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
    const isApiCall =
      url.startsWith('/api/') || url.startsWith('api/');

    const status = error.response?.status;
    if (!error.response && !originalRequest._logoutHandled) {
      originalRequest._logoutHandled = true;
      forceLogout();
      return Promise.reject(error);
    }
    // if (
    //   isApiCall &&
    //   status === 404 &&
    //   !originalRequest._logoutHandled
    // ) {
    //   originalRequest._logoutHandled = true;
    //   forceLogout();
    //   return Promise.reject(error);
    // }
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

// export const syncAuthFromMe = async () => {
//   const me = await apiClient.get('/api/v1/user/me');
//   const userInfo = me.data?.data;

//   if (!userInfo?.user_id) throw new Error('Invalid /me response');

//   localStorage.setItem('user', JSON.stringify(userInfo));
//   window.dispatchEvent(new Event('userLogin'));
//   return userInfo;
// };

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