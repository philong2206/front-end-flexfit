import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, CreditCard, User, LogOut, Menu, X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/layout/PageTransition";

const NAV_ITEMS = [
  { icon: Home, label: "Trang chủ", path: "/" },
  { icon: LayoutGrid, label: "Dashboard", path: "/dashboard" },
  { icon: Compass, label: "Khám phá", path: "/explore" },
  { icon: CreditCard, label: "Gói thành viên", path: "/membership" },
];

export function AppLayout() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Mobile Topbar */}
      <div className="md:hidden glass border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-sm">FF</div>
          <span className="font-bold text-white tracking-tighter uppercase">FLEXFIT</span>
        </Link>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white p-2">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed md:sticky top-0 left-0 h-screen w-72 glass border-r border-white/5 p-6 flex flex-col z-40 transition-transform",
              isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <div className="hidden md:flex items-center gap-3 mb-12 mt-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">FF</div>
              <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">FLEXFIT</h1>
            </div>

            <nav className="flex flex-col gap-2 flex-1 mt-8 md:mt-0">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_4px_15px_rgba(249,115,22,0.05)]"
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-white/10">
              <Link to="/profile" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Hồ sơ cá nhân</span>
                </div>
              </Link>
              <Link to="/">
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Đăng xuất</span>
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 md:px-10 max-w-7xl">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
