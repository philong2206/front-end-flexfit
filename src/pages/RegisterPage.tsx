import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerApi, googleLoginApi } from "@/api/auth";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await registerApi({ fullName: name, email, password });
      
      // Navigate to OTP verification page, passing the email in the URL query string
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await googleLoginApi(credential);
      
      if (response.token) {
        localStorage.setItem("access_token", response.token);
      }
      
      setSuccess(true);
      // You could log the user in here and navigate to dashboard
      // login(role); navigate("/dashboard");
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký bằng Google thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10 rounded-3xl border border-white/10 relative z-10">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold tracking-tighter text-white">
                FLEX<span className="text-primary">FIT</span>
              </span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Tạo tài khoản mới</h2>
          <p className="text-muted-foreground text-center mb-8">Tham gia mạng lưới fitness hàng đầu Việt Nam</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ và tên" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ Email" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg glow-btn">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng ký tài khoản"}
              </Button>
            </div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/60 px-2 text-muted-foreground">Hoặc đăng ký bằng</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center w-full">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleSuccess(credentialResponse.credential);
                }
              }}
              onError={() => setError("Đăng ký bằng Google thất bại")}
              theme="filled_black"
              shape="pill"
            />
          </div>

          <p className="mt-8 text-center text-muted-foreground text-sm">
            Đã có tài khoản? <Link to="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
