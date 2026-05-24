import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import apiClient from "../apis/client";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkServer = async () => {
      try {
        await apiClient.get("/api/v1/user/team"); 
        if (mounted) setAllowed(true);
      } catch (e) {
        // access/refresh 토큰은 httpOnly 쿠키라 JS로 못 지움 → user 캐시만 정리.
        // 실제 인증 실패 시 client.ts 의 forceLogout 이 이미 user 제거 + redirect 처리함.
        localStorage.removeItem("user");

        if (mounted) setAllowed(false);
      }
    };

    checkServer();

    return () => {
      mounted = false;
    };
  }, []);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}