import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Activity, Mail, KeyRound, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { verifyEmailApi } from "@/api/auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode) {
      setStatus("error");
      setMessage("Vui lòng nhập đầy đủ email và mã OTP.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      const response = await verifyEmailApi({ email, otpCode });
      
      setStatus("success");
      setMessage(response.message || "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error: unknown) {
      setStatus("error");
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Xác thực email thất bại.");
      }
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
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold tracking-tighter text-white">
                FLEX<span className="text-primary">FIT</span>
              </span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Xác thực Email</h2>
          <p className="text-muted-foreground text-center mb-8">
            Nhập mã OTP đã được gửi đến email của bạn
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center space-y-4 py-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-xl font-semibold text-white">Thành công</h2>
              <p className="text-green-400">{message}</p>
              <div className="mt-4 w-full">
                <Button onClick={() => navigate("/login")} className="w-full glow-btn">Đến trang Đăng nhập</Button>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleVerify}>
              {status === "error" && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-4 text-sm text-center">
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Địa chỉ Email" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    readOnly={!!searchParams.get("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Mã OTP (VD: 123456)" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors text-center tracking-widest font-mono text-lg"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  type="submit" 
                  disabled={status === "loading"} 
                  className="w-full h-12 text-lg glow-btn"
                >
                  {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác thực tài khoản"}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-muted-foreground hover:text-white text-sm">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
