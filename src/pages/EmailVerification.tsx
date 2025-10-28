// src/pages/EmailVerification.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EmailVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isLogin = false } = location.state || {};
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResend = () => {
    toast.info("Link verifikasi dikirim ulang.");
    setCountdown(30);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4 p-6 text-center">
        <CardHeader>
          <CardTitle className="text-xl">Periksa Email Anda</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Kami sudah mengirimkan link {isLogin ? "masuk" : "verifikasi"} ke{" "}
            <strong>{email}</strong> yang berlaku dalam{" "}
            <strong>{countdown} detik</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mt-6">
            <div className="w-48 h-36 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold mx-auto mb-4">
              📧
            </div>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-blue-600 hover:text-blue-700"
            >
              Kirim ulang link {countdown > 0 ? `(Tunggu ${countdown}s)` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
