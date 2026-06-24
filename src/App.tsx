import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

// Layouts
import { MemberLayout } from "@/components/layout/MemberLayout";
import { PartnerLayout } from "@/components/layout/PartnerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { StaffLayout } from "@/components/layout/StaffLayout";
import PageTransition from "@/components/layout/PageTransition";

// Shared Pages
import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import UnauthorizedPage from "@/pages/auth/UnauthorizedPage";

// Member Pages
import DashboardPage from "@/pages/customer/DashboardPage";
import ExplorePage from "@/pages/public/ExplorePage";
import MembershipPage from "@/pages/public/MembershipPage";
import PaymentSuccessPage from "@/pages/customer/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/customer/PaymentCancelPage";
import ClassBookingPage from "@/pages/customer/ClassBookingPage";
import MyBookingsPage from "@/pages/customer/MyBookingsPage";
import SchedulePage from "@/pages/customer/SchedulePage";
import ProgressPage from "@/pages/customer/ProgressPage";
import ProfilePage from "@/pages/customer/ProfilePage";

// Partner Pages
import PartnerDashboard from "@/pages/partner/PartnerDashboard";


import PartnerGymsPage from "@/pages/partner/PartnerGymsPage";
import PartnerClassesPage from "@/pages/partner/PartnerClassesPage";
import PartnerCustomersPage from "@/pages/partner/PartnerCustomersPage";
import PartnerStaffPage from "@/pages/partner/PartnerStaffPage";
import PartnerPromotionsPage from "@/pages/partner/PartnerPromotionsPage";
import PartnerReviewsPage from "@/pages/partner/PartnerReviewsPage";
import PartnerSettingsPage from "@/pages/partner/PartnerSettingsPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminApprovalsPage from "@/pages/admin/AdminApprovalsPage";
import AdminPartnersPage from "@/pages/admin/AdminPartnersPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminAmenitiesPage from "@/pages/admin/AdminAmenitiesPage";


// Staff Pages
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffCheckInPage from "@/pages/staff/StaffCheckInPage";
import StaffSchedulePage from "@/pages/staff/StaffSchedulePage";
import StaffCustomersPage from "@/pages/staff/StaffCustomersPage";
import StaffSupportPage from "@/pages/staff/StaffSupportPage";
import StaffSettingsPage from "@/pages/staff/StaffSettingsPage";

const AdminRevenuePage = lazy(() => import("@/pages/admin/AdminRevenuePage"));
const PartnerRevenuePage = lazy(() => import("@/pages/partner/PartnerRevenuePage"));
const AiCoachGlobal = lazy(() =>
  import("@/components/ai/AiCoachGlobal").then((module) => ({ default: module.AiCoachGlobal }))
);

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}

function LazyAiCoachGlobal() {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || role !== "member") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AiCoachGlobal />
    </Suspense>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { role, isAuthenticated, logout } = useAuth();
  const hasToken = typeof localStorage !== "undefined" && !!localStorage.getItem("access_token");

  // Not authenticated or no token -> redirect to login
  if (!isAuthenticated || !hasToken) {
    if (isAuthenticated && !hasToken) logout();
    return <Navigate to="/login" replace />;
  }

  // Normalize roles for comparison
  const currentRole = role?.toLowerCase() || "";
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
  
  // Wrong role -> redirect to unauthorized
  if (!normalizedAllowed.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
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
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/unauthorized" element={<PageTransition><UnauthorizedPage /></PageTransition>} />
        <Route path="/payment/success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
        <Route path="/payment/cancel" element={<PageTransition><PaymentCancelPage /></PageTransition>} />

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
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/partner/gyms" element={<PartnerGymsPage />} />
          <Route path="/partner/classes" element={<PartnerClassesPage />} />
          <Route path="/partner/customers" element={<PartnerCustomersPage />} />
          <Route path="/partner/staff" element={<PartnerStaffPage />} />
          <Route path="/partner/revenue" element={<LazyPage><PartnerRevenuePage /></LazyPage>} />
          <Route path="/partner/analytics" element={<LazyPage><PartnerRevenuePage /></LazyPage>} />
          <Route path="/partner/promotions" element={<PartnerPromotionsPage />} />
          <Route path="/partner/reviews" element={<PartnerReviewsPage />} />
          <Route path="/partner/settings" element={<PartnerSettingsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/partners" element={<AdminPartnersPage />} />
          <Route path="/admin/amenities" element={<AdminAmenitiesPage />} />
          <Route path="/admin/revenue" element={<LazyPage><AdminRevenuePage /></LazyPage>} />
          <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Staff Routes */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]}><StaffLayout /></ProtectedRoute>}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/checkin" element={<StaffCheckInPage />} />
          <Route path="/staff/schedule" element={<StaffSchedulePage />} />
          <Route path="/staff/customers" element={<StaffCustomersPage />} />
          <Route path="/staff/support" element={<StaffSupportPage />} />
          <Route path="/staff/settings" element={<StaffSettingsPage />} />
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
        <LazyAiCoachGlobal />
      </Router>
      <Toaster position="top-right" richColors theme="dark" />
    </AuthProvider>
  );
}

export default App;
