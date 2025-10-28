// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import GoogleIcon from "@/components/icons/GoogleIcon";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loginMode, setLoginMode] = useState<"magic" | "password">("magic");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerWithPassword, setRegisterWithPassword] = useState(false);
  const { signIn, signOut, role, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsEmailValid(isValid);
  }, [email]);

  const handleRegisterWithEmail = async () => {
    if (!isEmailValid) return;

    setIsLoading(true);
    try {
      const { data, error: checkError } = await supabase.rpc(
        "check_email_exists",
        {
          target_email: email,
        }
      );

      if (checkError) {
        toast.error("Gagal memeriksa email. Silakan coba lagi.");
        return;
      }

      if (data === true) {
        toast.error("Email ini sudah digunakan. Silakan gunakan email lain.");
        return;
      }

      const tempPassword = "TempPass123!";
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (signUpData?.user) {
        await supabase
          .from("app_users")
          .upsert(
            { id: signUpData.user.id, email: signUpData.user.email },
            { onConflict: "id" }
          );
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: signUpData.user.id, role: "applicant" },
            { onConflict: "user_id" }
          );
      }

      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      setStep("verify");
      toast.success("Link login telah dikirim ke email Anda.");
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWithEmailAndPassword = async () => {
    if (!isEmailValid || !password) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: checkError } = await supabase.rpc(
        "check_email_exists",
        {
          target_email: email,
        }
      );

      if (checkError) {
        toast.error("Gagal memeriksa email. Silakan coba lagi.");
        return;
      }

      if (data === true) {
        toast.error("Email ini sudah digunakan. Silakan gunakan email lain.");
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (signUpData?.user) {
        await supabase
          .from("app_users")
          .upsert(
            { id: signUpData.user.id, email: signUpData.user.email },
            { onConflict: "id" }
          );
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: signUpData.user.id, role: "applicant" },
            { onConflict: "user_id" }
          );
      }

      toast.success("Akun berhasil dibuat! Silakan masuk.");
      setTimeout(() => {
        setIsRegisterMode(false);
        setRegisterWithPassword(false);
        setEmail("");
        setPassword("");
      }, 1500);
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!isEmailValid) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        if (
          error.message.includes("User not found") ||
          error.message.includes("Unable to validate email")
        ) {
          toast.info("Akun belum terdaftar. Silakan daftar terlebih dahulu.");
          setIsRegisterMode(true);
        } else {
          toast.error(error.message);
        }
      } else {
        setStep("verify");
        toast.success("Link login telah dikirim ke email Anda.");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPassword = async () => {
    if (!isEmailValid || !password) return;
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Masuk berhasil!");
        setTimeout(() => {
          const destination = role === "admin" ? "/admin/jobs" : "/jobs";
          navigate(destination);
        }, 100);
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth("google");
      if (error) {
        toast.error(error.message);
      } else {
        setTimeout(async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from("app_users").upsert(
              {
                id: session.user.id,
                email: session.user.email,
              },
              { onConflict: "id" }
            );

            const { data: existingRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();

            if (!existingRole) {
              await supabase.from("user_roles").insert({
                user_id: session.user.id,
                role: "applicant",
              });
            }
          }
        }, 800);
      }
    } catch (err: any) {
      toast.error("Gagal login dengan Google.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Card className="w-full max-w-md mx-4 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isRegisterMode ? "Periksa Email Anda" : "Periksa Email Anda"}
            </CardTitle>
            <CardDescription>
              Kami sudah mengirimkan{" "}
              {isRegisterMode ? "link verifikasi" : "link login"} ke{" "}
              <strong>{email}</strong> yang berlaku dalam{" "}
              <strong>30 menit</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="my-6">
              <img
                src="/images/Email.png"
                alt="Check your email"
                className="mx-auto h-40 w-auto"
              />
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setStep("email")}
            >
              Ganti Email
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Belum menerima email? Cek folder spam atau{" "}
              <button
                onClick={
                  isRegisterMode ? handleRegisterWithEmail : handleSendMagicLink
                }
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                kirim ulang
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img
              src="/images/Logo_Rakamin.png"
              alt="Rakamin Logo"
              className="h-8 w-auto"
            />
          </div>
          <CardTitle className="text-xl text-center">
            {isRegisterMode ? "Buat Akun Rakamin" : "Masuk ke Rakamin"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegisterMode ? (
              <>
                Sudah punya akun?{" "}
                <button
                  onClick={() => {
                    setIsRegisterMode(false);
                    setLoginMode("magic");
                  }}
                  className="text-primary hover:underline"
                >
                  Masuk
                </button>
              </>
            ) : (
              <>
                Belum punya akun?{" "}
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="text-primary hover:underline"
                >
                  Daftar menggunakan email
                </button>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRegisterMode ? (
            <>
              {registerWithPassword ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegisterWithEmailAndPassword();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={isEmailValid ? "border-green-500" : ""}
                    />
                    {isEmailValid && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Alamat email valid
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Kata sandi</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          toast.info("Password minimal 6 karakter.");
                        }}
                      >
                        Persyaratan kata sandi
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={!isEmailValid || !password || isLoading}
                  >
                    {isLoading
                      ? "Memproses..."
                      : "Daftar dengan email & kata sandi"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setRegisterWithPassword(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12c0 1.2-1.6 2-2.6 2-1.5 0-2.6-1.2-2.6-2s1.1-2 2.6-2c1 0 2.6.8 2.6 2z" />
                      <path d="M18 12h3" />
                      <path d="M18 8h3" />
                      <path d="M18 16h3" />
                      <path d="M3 12h3" />
                      <path d="M3 8h3" />
                      <path d="M3 16h3" />
                    </svg>
                    Daftar dengan email saja
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                  >
                    <GoogleIcon /> Daftar dengan Google
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan
                    Kebijakan Privasi kami.
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegisterWithEmail();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={isEmailValid ? "border-green-500" : ""}
                    />
                    {isEmailValid && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Alamat email valid
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={!isEmailValid || isLoading}
                  >
                    {isLoading ? "Memproses..." : "Daftar dengan email"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setRegisterWithPassword(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15.5 15.5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />
                      <path d="M12 17v2m-2-2h4" />
                    </svg>
                    Daftar dengan email & kata sandi
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                  >
                    <GoogleIcon /> Daftar dengan Google
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan
                    Kebijakan Privasi kami.
                  </p>
                </form>
              )}
            </>
          ) : (
            <>
              {loginMode === "magic" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMagicLink();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={isEmailValid ? "border-green-500" : ""}
                    />
                    {isEmailValid && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Alamat email valid
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={!isEmailValid || isLoading}
                  >
                    {isLoading ? "Memproses..." : "Kirim link"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setLoginMode("password")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15.5 15.5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />
                      <path d="M12 17v2m-2-2h4" />
                    </svg>
                    Masuk dengan kata sandi
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                  >
                    <GoogleIcon /> Masuk dengan Google
                  </Button>
                </form>
              )}

              {loginMode === "password" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignInWithPassword();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={isEmailValid ? "border-green-500" : ""}
                    />
                    {isEmailValid && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Alamat email valid
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Kata sandi</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          toast.info(
                            "Fitur lupa kata sandi akan segera hadir."
                          );
                        }}
                      >
                        Lupa kata sandi?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={!isEmailValid || !password || isLoading}
                  >
                    {isLoading ? "Memproses..." : "Masuk"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setLoginMode("magic")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12c0 1.2-1.6 2-2.6 2-1.5 0-2.6-1.2-2.6-2s1.1-2 2.6-2c1 0 2.6.8 2.6 2z" />
                      <path d="M18 12h3" />
                      <path d="M18 8h3" />
                      <path d="M18 16h3" />
                      <path d="M3 12h3" />
                      <path d="M3 8h3" />
                      <path d="M3 16h3" />
                    </svg>
                    Kirim link login melalui email
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                  >
                    <GoogleIcon /> Masuk dengan Google
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
