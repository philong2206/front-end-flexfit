import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Home, Search, Crown, LogIn, ShoppingCart,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PublicLayout() {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">

      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group z-50">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white transition-transform group-hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
              FF
            </div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase group-hover:text-primary transition-colors hidden sm:block">
              FLEXFIT
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {isAuthenticated && role === "member" ? (
              [
                { label: "Trang chủ", path: "/" },
                { label: "Bảng điều khiển", path: "/dashboard" },
                { label: "Khám phá", path: "/explore" },
                { label: "Lịch sử đặt", path: "/bookings" },
                { label: "Tiến độ", path: "/progress" },
                { label: "Thành viên", path: "/membership" }
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition-colors hover:text-white ${location.pathname === item.path ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <div className="flex items-center gap-6 text-muted-foreground">
                <Link to="/" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Home className="w-4 h-4" /> Trang chủ
                </Link>
                <Link to="/explore" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Search className="w-4 h-4" /> Khám phá
                </Link>
                <Link to="/membership" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Crown className="w-4 h-4" /> Thành viên
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3 md:gap-4 z-50">
            <div className="hidden sm:flex items-center gap-3 text-muted-foreground border-r border-white/10 pr-4">
              <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors">
                <Search className="w-5 h-5 group-hover:text-white transition-colors" />
              </button>
              {isAuthenticated && role === "member" && (
                <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Bell className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span className="absolute top-1.5 right-1.5 bg-primary w-2 h-2 rounded-full"></span>
                </button>
              )}
              <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                <ShoppingCart className="w-5 h-5 group-hover:text-white transition-colors" />
                <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-bold w-3 h-3 rounded-full flex items-center justify-center"></span>
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-white">45 Credits</span>
                  <span className="text-xs text-primary">Pro Member</span>
                </div>
                <Link to="/profile">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                      {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"}
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 gap-2 border border-primary/20 transition-all hover:scale-105">
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-secondary pt-16 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-sm">FF</div>
                <span className="font-bold text-xl text-white uppercase tracking-tighter">FLEXFIT</span>
              </Link>
              <p className="text-muted-foreground max-w-sm text-sm">
                Nền tảng thể thao kết nối hàng ngàn phòng gym và studio trên toàn quốc. Tập luyện mọi lúc, mọi nơi chỉ với một tài khoản.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Khám phá</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link to="/explore" className="hover:text-primary transition-colors">Phòng Gym</Link></li>
                <li><Link to="/explore" className="hover:text-primary transition-colors">Yoga Studio</Link></li>
                <li><Link to="/explore" className="hover:text-primary transition-colors">Sản phẩm</Link></li>
                <li><Link to="/membership" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
            <p>© 2026 FlexFit Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
