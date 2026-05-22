import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, Lock, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { forgotPasswordApi, resetPasswordApi } from "@/api/auth";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Định dạng email không hợp lệ");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await forgotPasswordApi({ email });
      
      toast.success("Mã OTP đã được gửi đến email của bạn!", {
        description: "Vui lòng kiểm tra hộp thư đến hoặc thư rác.",
        duration: 8000,
      });
      
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi OTP thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    if (otpCode.length !== 6) {
      setError("Mã OTP phải gồm 6 chữ số");
      return;
    }

    // Standard length is valid, we proceed to enter new password step and submit both
    setStep("reset");
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setError("");
      await forgotPasswordApi({ email });
      toast.success("Mã OTP mới đã được gửi thành công!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi lại OTP thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải dài tối thiểu 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await resetPasswordApi({
        email,
        otpCode,
        newPassword: password
      });

      toast.success("Đổi mật khẩu thành công!");
      setStep("success");

      // Auto redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/30">
      {/* Ambient background glowing blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card rounded-[32px] border border-white/10 p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 bg-background/60 backdrop-blur-xl"
      >
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform">
              FF
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white uppercase">
              FLEX<span className="text-primary">FIT</span>
            </span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email-step"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Quên mật khẩu?</h2>
                <p className="text-muted-foreground text-sm">Nhập địa chỉ email đăng ký để chúng tôi gửi mã OTP đặt lại mật khẩu</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-2xl text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Địa chỉ Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com" 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold glow-btn rounded-2xl mt-2 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <span className="flex items-center justify-center gap-2"> Gửi mã OTP <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </Link>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp-step"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Xác thực OTP</h2>
                <p className="text-muted-foreground text-sm">Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến <br /><strong className="text-gray-200">{email}</strong></p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-2xl text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Nhập mã OTP</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••" 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-center tracking-[0.5em] font-mono font-bold placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg"
                      required
                    />
                  </div>
                  <p className="text-xs text-orange-400/80 text-center">Vui lòng kiểm tra email của bạn để lấy mã OTP</p>
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold glow-btn rounded-2xl mt-2 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <span className="flex items-center justify-center gap-2"> Xác nhận OTP <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  )}
                </Button>
              </form>

              <div className="flex justify-between items-center text-sm pt-2">
                <button 
                  onClick={() => setStep("email")}
                  className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Thay đổi Email
                </button>
                <button 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-primary hover:underline font-semibold disabled:opacity-55"
                >
                  Gửi lại mã
                </button>
              </div>
            </motion.div>
          )}

          {step === "reset" && (

            <motion.div
              key="reset-step"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Mật khẩu mới</h2>
                <p className="text-muted-foreground text-sm">Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-2xl text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Mật khẩu mới</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold glow-btn rounded-2xl mt-4 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <span className="flex items-center justify-center gap-2"> Đổi mật khẩu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success-step"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center justify-center text-center space-y-6 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 120, delay: 0.1 }}
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Thành công!</h2>
                <p className="text-muted-foreground text-sm">
                  Mật khẩu của bạn đã được đặt lại thành công.
                </p>
                <p className="text-xs text-gray-400 animate-pulse">
                  Đang tự động chuyển hướng về trang Đăng nhập...
                </p>
              </div>

              <Button 
                onClick={() => navigate("/login")}
                className="w-full h-12 text-base font-semibold glow-btn rounded-2xl mt-4"
              >
                Đăng nhập ngay
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
