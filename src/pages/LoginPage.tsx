import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

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

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Chào mừng trở lại</h2>
          <p className="text-muted-foreground text-center mb-8">Nhập thông tin của bạn để truy cập tài khoản</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="email" 
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
                  placeholder="Mật khẩu" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm mb-6">
              <label className="flex items-center text-muted-foreground cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-white/20 bg-black/40 text-primary focus:ring-primary" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="text-primary hover:underline">Quên mật khẩu?</a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Button 
                className="w-full h-11 text-sm glow-btn"
                onClick={() => { login("member"); navigate("/"); }}
              >
                Member
              </Button>
              <Button 
                variant="outline"
                className="w-full h-11 text-sm border-white/20 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                onClick={() => { login("partner"); navigate("/partner"); }}
              >
                Partner
              </Button>
              <Button 
                variant="outline"
                className="w-full h-11 text-sm border-white/20 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => { login("admin"); navigate("/admin"); }}
              >
                Admin
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-2 mb-6">
              * Click to simulate login as different roles
            </p>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/60 px-2 text-muted-foreground">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button variant="glass" className="border-white/10 text-white">Google</Button>
            <Button variant="glass" className="border-white/10 text-white">Apple</Button>
          </div>

          <p className="mt-8 text-center text-muted-foreground text-sm">
            Chưa có tài khoản? <Link to="/register" className="text-primary font-medium hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
