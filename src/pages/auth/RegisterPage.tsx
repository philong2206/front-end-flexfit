import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, User, Loader2, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { registerApi, googleLoginApi } from "@/api/auth";
import { getUserByIdApi, type UserDto } from "@/api/users";
import { parseJwt, determineUserRole } from "@/lib/utils";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phoneNumber) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const payload = { fullName: name, email, password, phoneNumber };
      console.log("REGISTER PAYLOAD:", payload);
      
      await registerApi(payload);

      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng ký thất bại";
      setError(message);
      toast.error(message);
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
      
      const payload = parseJwt(response.token);
      const userId = payload?.sub;
      let userProfile: Partial<UserDto> = {};
      
      if (userId) {
        try {
          userProfile = await getUserByIdApi(userId);
          if (userProfile && userProfile.isActive === false) {
            localStorage.removeItem("access_token");
            setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Không thể lấy thông tin user", e);
        }
      }
      
      const userEmail = userProfile?.email || payload?.email || response.email || "";
      const role = determineUserRole(userEmail, payload);
      const user = {
        userId: userId || response.userId || response.user?.id || response.id,
        fullName: userProfile?.fullName || response.fullName || response.user?.name || "Người dùng Google",
        email: userEmail,
        role: role,
        phoneNumber: userProfile?.phoneNumber || response.phoneNumber || response.user?.phoneNumber || "",
        avatar: userProfile?.avatarUrl || response.avatarUrl || response.user?.avatar || ""
      };
      
      login(user);
      
      if (role === "admin") navigate("/admin");
      else if (role === "partner") navigate("/partner");
      else if (role === "staff") navigate("/staff");
      else navigate("/dashboard");
      
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/30">
      {/* Ambient background glowing blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl glass-card rounded-[32px] border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10"
      >
        {/* Left Banner Column (Visual Excellence) */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-black/90 via-black/60 to-primary/20 border-r border-white/10">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop" 
              alt="Register Banner" 
              className="w-full h-full object-cover opacity-40 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000 scale-105 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform">
                FF
              </div>
              <span className="text-2xl font-bold tracking-tighter text-white uppercase">
                FLEX<span className="text-primary">FIT</span>
              </span>
            </Link>
          </div>

          <div className="relative z-10 space-y-6 max-w-md">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-4 inline-block">
                ✨ Bắt đầu hành trình mới
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                Mở khóa tiềm năng, <br />thay đổi vóc dáng.
              </h1>
              <p className="text-muted-foreground text-base mt-3 leading-relaxed">
                Tham gia mạng lưới fitness cao cấp hàng đầu Việt Nam. Tập luyện mọi lúc, mọi nơi chỉ với một tài khoản duy nhất.
              </p>
            </motion.div>

            {/* Floating feature badges */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:border-primary/30 transition-colors">
                <div className="text-lg font-bold text-primary mb-1 flex items-center gap-1.5">🎯 AI Gợi ý thông minh</div>
                <div className="text-xs text-gray-300 leading-relaxed">Đề xuất lộ trình và lớp học phù hợp nhất với mục tiêu cá nhân.</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:border-primary/30 transition-colors">
                <div className="text-lg font-bold text-orange-400 mb-1 flex items-center gap-1.5">🤝 Cộng đồng sôi động</div>
                <div className="text-xs text-gray-300 leading-relaxed">Kết nối và tập luyện cùng những người bạn có chung đam mê.</div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Đăng ký miễn phí</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Bảo mật tuyệt đối</span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-background/60 backdrop-blur-xl">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="flex justify-center lg:hidden mb-2">
              <Link to="/" className="flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold tracking-tighter text-white">
                  FLEX<span className="text-primary">FIT</span>
                </span>
              </Link>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Tạo tài khoản mới</h2>
              <p className="text-muted-foreground text-sm">Tham gia mạng lưới fitness hàng đầu Việt Nam</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-500 p-3.5 rounded-2xl text-sm text-center font-medium">
                {error}
              </motion.div>
            )}

            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Họ và tên</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A" 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Địa chỉ Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com" 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Số điện thoại</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678" 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-12 text-base font-semibold glow-btn rounded-2xl mt-4 group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center justify-center gap-2"> Đăng ký tài khoản <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                <span className="bg-background/80 px-4 text-muted-foreground backdrop-blur-sm rounded-full py-1 border border-white/5">Hoặc đăng ký bằng</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
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

            <p className="text-center text-muted-foreground text-sm pt-4">
              Đã có tài khoản? <Link to="/login" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
