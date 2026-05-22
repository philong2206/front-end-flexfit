import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full glass-card rounded-[32px] border border-white/10 p-12 text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">Truy cập bị từ chối</h1>
        <p className="text-muted-foreground text-lg mb-2">
          Bạn không có quyền truy cập trang này
        </p>
        
        {user && (
          <p className="text-sm text-muted-foreground mb-8">
            Tài khoản hiện tại: <span className="text-primary font-semibold">{user.email}</span> ({user.role})
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full sm:w-auto rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full glow-btn rounded-2xl">
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </Link>

          <Button
            onClick={logout}
            variant="ghost"
            className="w-full sm:w-auto rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Đăng xuất
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
