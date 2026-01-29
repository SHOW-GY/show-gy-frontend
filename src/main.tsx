// 개발용: 앱 시작 시 자동 로그인 상태로 만듦
localStorage.setItem('access_token', '테스트용_임의_토큰');
localStorage.setItem('refresh_token', '테스트용_임의_리프레시토큰');
localStorage.setItem('user', JSON.stringify({
  user_id: 1,
  nickname: '테스트유저',
  first_name: '테스트',
  last_name: '유저',
  email: 'test@example.com',
  register_date: '2026-01-29'
}));

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
