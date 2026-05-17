import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Layouts
import { MemberLayout } from "@/components/layout/MemberLayout";
import { PartnerLayout } from "@/components/layout/PartnerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import PageTransition from "@/components/layout/PageTransition";

// Shared Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";

// Member Pages
import DashboardPage from "@/pages/DashboardPage";
import ExplorePage from "@/pages/ExplorePage";
import MembershipPage from "@/pages/MembershipPage";
import ClassBookingPage from "@/pages/ClassBookingPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import SchedulePage from "@/pages/SchedulePage";
import ProgressPage from "@/pages/ProgressPage";
import ProfilePage from "@/pages/ProfilePage";

// Partner Pages
import PartnerDashboard from "@/pages/partner/PartnerDashboard";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { role, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const currentRole = role?.toLowerCase() === "user" ? "member" : (role?.toLowerCase() || "");
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
  
  if (!normalizedAllowed.includes(currentRole)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes with Shared Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
          <Route path="/membership" element={<PageTransition><MembershipPage /></PageTransition>} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />

        {/* Member Routes */}
        <Route element={<ProtectedRoute allowedRoles={["member"]}><MemberLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/classes" element={<ClassBookingPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Partner Routes */}
        <Route element={<ProtectedRoute allowedRoles={["partner"]}><PartnerLayout /></ProtectedRoute>}>
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/gyms" element={<PartnerDashboard />} />
          <Route path="/partner/classes" element={<PartnerDashboard />} />
          <Route path="/partner/customers" element={<PartnerDashboard />} />
          <Route path="/partner/analytics" element={<PartnerDashboard />} />
          <Route path="/partner/promotions" element={<PartnerDashboard />} />
          <Route path="/partner/reviews" element={<PartnerDashboard />} />
          <Route path="/partner/settings" element={<PartnerDashboard />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
          <Route path="/admin/partners" element={<AdminDashboard />} />
          <Route path="/admin/revenue" element={<AdminDashboard />} />
          <Route path="/admin/approvals" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminDashboard />} />
          <Route path="/admin/support" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
