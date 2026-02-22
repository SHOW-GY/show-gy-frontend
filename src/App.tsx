import { Routes, Route } from "react-router-dom";
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