import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, Settings, LogOut, Menu, X, LayoutGrid, ScanLine, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Tổng quan", path: "/staff" },
  { icon: ScanLine, label: "Check-in khách hàng", path: "/staff/checkin" },
  { icon: Calendar, label: "Lịch học & lớp học", path: "/staff/schedule" },
  { icon: Users, label: "Khách hàng", path: "/staff/customers" },
  { icon: Ticket, label: "Hỗ trợ khách hàng", path: "/staff/support" },
];

export function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#0F172A] border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">FS</div>
          <span className="font-bold text-white tracking-tighter uppercase">STAFF</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white p-2">
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar navigation */}
      <AnimatePresence>
        {(isMobileOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed md:sticky top-0 left-0 h-screen w-[280px] bg-[#0F172A] border-r border-white/10 p-6 flex flex-col z-40 transition-transform",
              isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <div className="hidden md:flex items-center justify-between mb-12 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg">FS</div>
                <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">STAFF</h1>
              </div>
              <NotificationBell placement="right-start" />
            </div>

            <nav className="flex flex-col gap-2 flex-1 mt-8 md:mt-0 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/staff' && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)}>
                    <div
                      className={cn(
                        "flex h-12 items-center gap-3 px-4 rounded-xl transition-all duration-300",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                          : "text-muted-foreground hover:bg-white/10 hover:translate-x-1 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-white/10 shrink-0">
              <Link to="/staff/settings" onClick={() => setIsMobileOpen(false)}>
                <div
                  className={cn(
                    "flex h-12 items-center gap-3 px-4 rounded-xl transition-all",
                    location.pathname === "/staff/settings"
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      : "text-muted-foreground hover:bg-white/10 hover:translate-x-1 hover:text-white"
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Cài đặt</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="w-full">
                <div className="flex h-12 items-center gap-3 px-4 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 hover:translate-x-1 transition-all duration-300">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Đăng xuất</span>
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}
    </div>
  );
}

