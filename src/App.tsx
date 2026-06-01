import { Routes, Route, useLocation } from "react-router-dom";
import {useEffect} from "react";
import { syncAuthFromMe } from "./apis/client";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./login/Signup";
import FindId from "./login/FindId";
import ResetPassword from "./login/ResetPassword";
import Summary from "./pages/Summary";
import Library from "./pages/Library";
import Center from "./summary/Center";
import Mypage from "./pages/Mypage/index";
import Showgy from "./pages/Showgy";
import TeamRulePreview from "./pages/TeamRulePreview";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const location = useLocation();

  {/* 앱이 처음 로드될 때, 로그인 상태를 확인하기 위해 /me API를 호출.
      Public(비로그인 접근 가능) 페이지에선 호출 X — 비로그인 사용자가 강제 로그아웃 + /login redirect 되는 것 방지. */}
  useEffect(() => {
    const isPublicPage =
      location.pathname === "/" ||                     // Home (랜딩)
      location.pathname === "/login" ||
      location.pathname === "/login/signup" ||
      location.pathname === "/login/find-id" ||        // 아이디 찾기 (비로그인)
      location.pathname === "/login/reset-password" || // 비밀번호 재설정 (비로그인)
      location.pathname === "/showgy";                 // SHOW-GY 팀 소개
    if (isPublicPage) return;
    syncAuthFromMe().catch(() => {});
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/signup" element={<Signup />} />
      <Route path="/login/find-id" element={<FindId />} />
      <Route path="/login/reset-password" element={<ResetPassword />} />
      <Route path="/preview/team-rule" element={<TeamRulePreview />} />

      {/* 보호 라우트들 */}
      <Route
        path="/summary"
        element={
          <ProtectedRoute>
            <Summary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary/center"
        element={
          <ProtectedRoute>
            <Center />
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary/center/:documentId"
        element={
          <ProtectedRoute>
            <Center />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mypage"
        element={
          <ProtectedRoute>
            <Mypage />
          </ProtectedRoute>
        }
      />

      {/* showgy도 보호해야 하면 아래처럼 감싸 */}
      <Route path="/showgy" element={<Showgy />} />
    </Routes>
  );
}