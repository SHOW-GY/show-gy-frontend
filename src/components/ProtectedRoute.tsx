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

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
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