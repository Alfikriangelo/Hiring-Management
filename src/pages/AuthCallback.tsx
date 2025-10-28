// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      const destination = role === "admin" ? "/admin/jobs" : "/jobs";
      navigate(destination);
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, role]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Mengalihkan...</p>
    </div>
  );
}
