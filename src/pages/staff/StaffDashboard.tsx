import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  QrCode, 
  CheckCircle, 
  Clock, 
  Search, 
  CheckSquare, 
  AlertCircle,
  PlayCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  getStaffDashboardStats,
  searchBookingByCode,
  confirmCheckIn,
  getRecentCheckIns,
  getTodayClasses,
  type StaffDashboardStats,
  type BookingSearchResult,
  type CheckInFeedItem,
  type TodayClass
} from "@/services/staffApi";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeBooking, setActiveBooking] = useState<BookingSearchResult | null>(null);

  const [stats, setStats] = useState<StaffDashboardStats | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInFeedItem[]>([]);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Run API calls in parallel
      const [statsData, checkinsData, classesData] = await Promise.all([
        getStaffDashboardStats().catch(err => { console.warn(err); return null; }),
        getRecentCheckIns().catch(err => { console.warn(err); return []; }),
        getTodayClasses().catch(err => { console.warn(err); return []; })
      ]);
      
      // If the main stats call fails, we can assume the endpoints don't exist yet
      if (!statsData) {
        throw new Error("API thống kê nhân viên hiện chưa được triển khai trên Backend (Missing endpoint).");
      }
      
      setStats(statsData);
      setRecentCheckIns(checkinsData);
      setTodayClasses(classesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error("Vui lòng nhập mã đặt chỗ / check-in");
      return;
    }

    setIsSearching(true);
    setActiveBooking(null);

    try {
      const match = await searchBookingByCode(searchCode.trim());
      if (match.checkedIn) {
        toast.info("Mã đặt chỗ này đã được check-in trước đó!");
      }
      setActiveBooking(match);
      toast.success("Đã tìm thấy thông tin đặt chỗ!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tìm thấy thông tin đặt chỗ");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmCheckin = async (code: string) => {
    setIsCheckingIn(true);
    try {
      await confirmCheckIn(code);
      toast.success(`Check-in thành công!`);
      setActiveBooking(null);
      setSearchCode("");
      // Refetch data
      fetchDashboardData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in thất bại");
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        title="Tính năng đang phát triển"
        message={error}
        onRetry={fetchDashboardData}
        retryLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {greeting}, <span className="text-primary">{user?.fullName || "Nhân viên"}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Kênh điều hành & kiểm soát hoạt động tại câu lạc bộ.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary border border-white/5 px-4 py-2 rounded-2xl">
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-white">Ca làm việc: Hiện tại</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Lượt Check-in hôm nay</span>
                <CheckSquare className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.todayCheckIns ?? 0} lượt</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Hội viên trong phòng</span>
                <Users className="h-5 w-5 text-sky-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.membersInGym ?? 0} người</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Lớp học tối nay</span>
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.classesTonight ?? 0} lớp</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Yêu cầu hỗ trợ</span>
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.supportRequests ?? 0} yêu cầu</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Grid: Check-in scanner tool & Today's classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Check-in scanner tool */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> Check-in hội viên nhanh
              </CardTitle>
              <CardDescription>Nhập mã đặt lịch (Ví dụ: FF-4829, FF-8371, FF-1122) để xác minh hội viên tại quầy lễ tân.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Mã đặt chỗ: FF-XXXX"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm uppercase tracking-wider font-semibold"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSearching} 
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-6 rounded-xl font-medium shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kiểm tra"}
                </Button>
              </form>

              {/* Active search result panel */}
              <AnimatePresence mode="wait">
                {activeBooking && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        {activeBooking.avatar ? (
                          <img 
                            src={activeBooking.avatar} 
                            alt={activeBooking.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold text-xl">
                            {activeBooking.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-base">{activeBooking.name}</h4>
                          <p className="text-xs text-muted-foreground">{activeBooking.email} | {activeBooking.phone}</p>
                          <span className="inline-block mt-1 text-[10px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                            {activeBooking.level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Mã code</span>
                        <span className="text-lg font-mono font-extrabold text-primary tracking-widest block">{activeBooking.code}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm bg-white/5 p-4 rounded-xl">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Loại dịch vụ</span>
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {activeBooking.type === "Gym" ? "Tập Tự Do" : "Lớp Học GroupX"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Thời gian đặt</span>
                        <span className="font-semibold text-white">{activeBooking.time}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block mb-1">Tên buổi tập / lớp</span>
                        <span className="font-bold text-emerald-400 text-sm">{activeBooking.targetName}</span>
                        {activeBooking.instructor && (
                          <span className="block text-xs text-muted-foreground mt-0.5">Huấn luyện viên: {activeBooking.instructor}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setActiveBooking(null)}
                        className="text-muted-foreground hover:text-white rounded-xl hover:bg-white/5"
                        disabled={isCheckingIn}
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        onClick={() => handleConfirmCheckin(activeBooking.code)}
                        disabled={activeBooking.checkedIn || isCheckingIn}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {activeBooking.checkedIn ? "Đã Check-in" : "Xác nhận Check-in"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Today's schedule card */}
          <Card className="bg-secondary border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Lịch học hôm nay</CardTitle>
                <CardDescription>Các lớp học diễn ra tại phòng tập hôm nay.</CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <EmptyState 
                  icon={Calendar} 
                  title="Không có lớp học" 
                  description="Hiện tại không có lớp học nào được lên lịch cho hôm nay." 
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg font-medium">Giờ học</th>
                        <th className="px-4 py-3 font-medium">Tên lớp</th>
                        <th className="px-4 py-3 font-medium">HLV</th>
                        <th className="px-4 py-3 font-medium">Hội viên</th>
                        <th className="px-4 py-3 rounded-r-lg font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayClasses.map((cls, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-semibold text-white">{cls.time || (cls.startTime ? new Date(cls.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}</td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-white block">{cls.className}</span>
                            <span className="text-xs text-muted-foreground">{cls.room || "Studio"}</span>
                          </td>
                          <td className="px-4 py-4">{cls.coachName || cls.instructorName || "Chưa xếp"}</td>
                          <td className="px-4 py-4">{cls.bookedCount ?? cls.enrolled ?? 0} / {cls.capacity || 0}</td>
                          <td className="px-4 py-4 text-right">
                            <Button size="sm" variant="outline" className="h-8 border-white/10 text-white text-xs hover:bg-emerald-500/10 hover:text-emerald-400">Điểm danh</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Recent Check-in Feed */}
        <div className="space-y-6">
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Dòng Check-in trực tiếp</CardTitle>
              <CardDescription>Các lượt check-in gần nhất tại câu lạc bộ.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCheckIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có lượt check-in nào.</p>
                ) : (
                  recentCheckIns.map((checkin, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3.5 bg-black/20 rounded-xl hover:bg-black/30 transition-all">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/10">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-white leading-none mb-1">{checkin.name}</h5>
                          <p className="text-xs text-muted-foreground">{checkin.type}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">{checkin.code}</span>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {checkin.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick links & support box */}
          <Card className="bg-secondary border-white/5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[20px] -mr-6 -mb-6" />
            <CardContent className="pt-6 space-y-4 relative z-10">
              <h4 className="font-bold text-white text-base">Hỗ trợ khẩn cấp</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khi có sự cố kỹ thuật hoặc tranh chấp thẻ/gói tập của hội viên, liên hệ ngay với Quản lý Câu lạc bộ hoặc Hotline kỹ thuật.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4" /> Báo cáo sự cố
                </Button>
                <Button size="sm" variant="outline" className="border-white/10 text-white text-xs hover:bg-white/5 rounded-xl">
                  Danh bạ nội bộ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
