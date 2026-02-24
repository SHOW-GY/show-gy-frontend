import { Routes, Route, useLocation } from "react-router-dom";
import {useEffect} from "react";
import { syncAuthFromMe } from "./apis/client";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./login/Signup";
import Summary from "./pages/Summary";
import Library from "./pages/Library";
import Center from "./summary/Center";
import Mypage from "./pages/Mypage/index";
import Showgy from "./pages/Showgy";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const location = useLocation();

  {/* 앱이 처음 로드될 때, 로그인 상태를 확인하기 위해 /me API를 호출 */}
  useEffect(() => {
    const isAuthPage =
      location.pathname === "/login" ||
      location.pathname === "/login/signup";
    if (isAuthPage) return;
    syncAuthFromMe().catch(() => {});
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/signup" element={<Signup />} />

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