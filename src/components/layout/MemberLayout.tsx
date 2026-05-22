import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CreditCard, User, LogOut, Menu, X,
  LayoutGrid, CalendarDays, Bell, Search,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useMemberWalletSnapshot } from "@/hooks/useMemberWalletSnapshot";
import { useResolvedUserId } from "@/hooks/useResolvedUserId";

const NAV_ITEMS = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Bảng điều khiển", path: "/dashboard", icon: LayoutGrid },
  { label: "Khám phá", path: "/explore", icon: Search },
  { label: "Lịch sử đặt", path: "/bookings", icon: CalendarDays },
  { label: "Thành viên", path: "/membership", icon: CreditCard },
];

export function MemberLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const resolvedUserId = useResolvedUserId(user);
  const { balance, tier: membershipTier } = useMemberWalletSnapshot(resolvedUserId, "en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "transition-colors hover:text-white",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4 z-50">
            <div className="hidden sm:flex items-center gap-3 text-muted-foreground border-r border-white/10 pr-4">
              <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors">
                <Search className="w-5 h-5 group-hover:text-white transition-colors" />
              </button>
              <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors">
                <Bell className="w-5 h-5 group-hover:text-white transition-colors" />
                <span className="absolute top-1.5 right-1.5 bg-primary w-2 h-2 rounded-full"></span>
              </button>
              <button className="relative group p-2 hover:bg-white/5 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-white">
                  {balance !== null ? `${balance} Credits` : "... Credits"}
                </span>
                <span className="text-xs text-primary">{membershipTier}</span>
              </div>
              <Link to="/profile">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"
                    )}
                  </div>
                </div>
              </Link>
              <button
                className="lg:hidden p-2 text-white ml-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden absolute top-16 left-0 w-full bg-secondary/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                        isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="h-px bg-white/10 my-2" />
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white"
                >
                  <User className="w-5 h-5" /> Hồ sơ cá nhân
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-[1400px]">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-secondary pt-12 pb-8 mt-auto">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
              <h4 className="text-white font-bold mb-4 text-sm">Liên kết nhanh</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link to="/explore" className="hover:text-primary transition-colors">Khám phá</Link></li>
                <li><Link to="/classes" className="hover:text-primary transition-colors">Lớp học</Link></li>
                <li><Link to="/membership" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Hỗ trợ</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-xs">
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
