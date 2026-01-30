import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

// 개발용: 앱 시작 시 자동 로그인 상태로 만듦
function seedDevAuth() {
  localStorage.setItem("access_token", "테스트용_임의_토큰");
  localStorage.setItem("refresh_token", "테스트용_임의_리프레시토큰");
  localStorage.setItem(
    "user",
    JSON.stringify({
      user_id: 1,
      nickname: "테스트유저",
      first_name: "테스트",
      last_name: "유저",
      email: "test@example.com",
      register_date: "2026-01-29",
    })
  );
}

// ✅ 개발환경에서만 실행되게 (중요)
if (import.meta.env.DEV) {
  seedDevAuth();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
