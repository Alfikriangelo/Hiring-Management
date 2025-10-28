// src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      if (!hash) {
        console.error("No hash found in URL");
        navigate("/auth");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        console.error("Access token not found in hash");
        navigate("/auth");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get("refresh_token") || "",
            });

          if (sessionError) throw sessionError;
        }

        const destination = "/jobs";
        navigate(destination);
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Mengalihkan...</p>
      </div>
    );
  }

  return null;
}
