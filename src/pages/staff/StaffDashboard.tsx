import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  QrCode,
  CheckSquare,
  Loader2,
  Clock,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

// Real APIs
import { getLogsForManagerApi, type CheckInLogDto } from "@/api/checkInLog";
import { getClassesForStaffApi, type ClassDto } from "@/api/classes";
import { getStaffCheckInBookingsApi, type BookingResponse } from "@/api/bookings";

const getDateKey = (value: string | undefined | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCheckInTime = (checkin: CheckInLogDto) => {
  return checkin.checkInTime || checkin.checkInAt || checkin.scannedAt || null;
};

const hasRealCheckIn = (checkin: CheckInLogDto) => {
  const time = getCheckInTime(checkin);
  return Boolean(time && !isNaN(new Date(time).getTime()));
};

const formatTime = (timeString: string | undefined | null) => {
  if (!timeString) return "Chưa có thời gian";
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return "Chưa có thời gian";
  return date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (timeString: string | undefined | null) => {
  if (!timeString) return "";
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getBookingTypeLabel = (checkin: CheckInLogDto) => {
  const rawType = (checkin.bookingType || checkin.type || "").toLowerCase();
  if (rawType.includes("class") || checkin.className) return "Lớp học";
  if (rawType.includes("gym")) return "Tập tự do";
  return checkin.bookingType || checkin.type || "Check-in";
};

const getMemberName = (checkin: CheckInLogDto) => {
  return checkin.userFullName || checkin.customerName || checkin.userName || checkin.name || "";
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // States for aggregated data
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    membersInGym: 0,
    classesTonight: 0,
    totalMembers: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInLogDto[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ── 3 APIs run in parallel (removed getAllUsersApi – too heavy) ──
      const [logsData, classesData, bookingsData] = await Promise.all([
        getLogsForManagerApi().catch(() => [] as CheckInLogDto[]),
        getClassesForStaffApi().catch(() => [] as ClassDto[]),
        getStaffCheckInBookingsApi().catch(() => [] as BookingResponse[]),
      ]);

      // Identify unique user IDs who have interacted with this branch
      // (derived from logs + bookings — no need to load all system users)
      const branchUserIds = new Set<string>();
      logsData.forEach(log => { if (log.userId) branchUserIds.add(log.userId); });
      bookingsData.forEach(booking => {
        const b = booking as Record<string, unknown>;
        if (typeof b.userId === 'string' && b.userId) branchUserIds.add(b.userId);
      });

      const today = getDateKey(new Date().toISOString());
      const realLogs = logsData
        .filter(hasRealCheckIn)
        .sort((a, b) => new Date(getCheckInTime(b) || 0).getTime() - new Date(getCheckInTime(a) || 0).getTime());

      // Calculate today checkins
      const todayLogs = realLogs.filter(log => getDateKey(getCheckInTime(log)) === today);

      // Calculate classes tonight
      const todayCls = classesData
        .filter(c => getDateKey(c.startTime) === today)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setStats({
        todayCheckIns: todayLogs.length,
        membersInGym: todayLogs.filter(l => l.status === "Success").length,
        classesTonight: todayCls.length,
        totalMembers: branchUserIds.size,
      });

      setRecentCheckIns(realLogs.slice(0, 5));
      setTodayClasses(todayCls.slice(0, 5));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleRealtimeRefresh = () => {
      fetchDashboardData();
    };

    window.addEventListener("staff-dashboard:refresh", handleRealtimeRefresh);
    return () => window.removeEventListener("staff-dashboard:refresh", handleRealtimeRefresh);
  }, [fetchDashboardData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error("Vui lòng nhập mã đặt chỗ / check-in");
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast.info("Vui lòng check-in trực tiếp qua thẻ Hội viên hoặc quét mã QR ở trang Check-in chuyên dụng.");
    }, 800);
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-end">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-secondary border-white/5 h-32 rounded-2xl">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi tải dữ liệu"
        message={error}
        onRetry={fetchDashboardData}
        retryLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-8 pb-10 overflow-visible pl-1 sm:pl-0">
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
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Lượt Check-in hôm nay</span>
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.todayCheckIns} lượt</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Tổng Hội viên</span>
                <Users className="h-5 w-5 text-sky-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalMembers} người</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Lớp học hôm nay</span>
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.classesTonight} lớp</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="bg-secondary border-white/5 h-full hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Hội viên trong phòng</span>
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.membersInGym} người</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Grid: Check-in scanner tool & Today's classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0 overflow-visible">

        {/* Left Side: Check-in scanner tool */}
        <div className="lg:col-span-2 space-y-6 min-w-0 overflow-visible">
          <Card className="bg-secondary border-white/5 overflow-visible rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> Công cụ nhanh
              </CardTitle>
              <CardDescription>Tìm kiếm mã đặt lịch hội viên nhanh chóng</CardDescription>
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm uppercase tracking-wider font-semibold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-6 rounded-xl font-medium shrink-0 h-12"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm kiếm"}
                </Button>
              </form>
              <div className="flex gap-4">
                <Button asChild variant="outline" className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10">
                  <Link to="/staff/checkin">Đi đến trang Check-in chuyên dụng</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's schedule card */}
          <Card className="bg-secondary border-white/5 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Lớp học hôm nay</CardTitle>
                <CardDescription>Các lớp học diễn ra tại phòng tập hôm nay.</CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20">
                Live
              </span>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={Calendar}
                    title="Chưa có lớp học hôm nay"
                    description="Hiện tại không có lớp học nào được lên lịch cho hôm nay."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg font-medium">Lớp</th>
                        <th className="px-4 py-3 font-medium">Bắt đầu</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayClasses.map((cls, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">{cls.className}</td>
                          <td className="px-4 py-4">{formatTime(cls.startTime)}</td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">{cls.status}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button asChild size="sm" variant="ghost" className="h-8 hover:bg-white/10 text-primary">
                              <Link to="/staff/schedule">Xem</Link>
                            </Button>
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
        <div className="space-y-6 min-w-0 overflow-visible">
          <Card className="bg-secondary border-white/5 rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Check-in gần nhất</CardTitle>
              <CardDescription>Các lượt vào phòng gần đây nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCheckIns.length === 0 ? (
                  <div className="py-8">
                    <EmptyState icon={Users} title="Chưa có lượt check-in gần đây" description="Các lượt check-in thật sẽ hiển thị tại đây sau khi hội viên vào phòng hoặc lớp học." />
                  </div>
                ) : (
                  recentCheckIns.map((checkin, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3.5 bg-black/20 rounded-xl hover:bg-black/30 transition-all">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h5 className="text-sm font-semibold text-white leading-none">{getBookingTypeLabel(checkin)}</h5>
                          {getMemberName(checkin) && (
                            <p className="text-xs text-muted-foreground truncate">{getMemberName(checkin)}</p>
                          )}
                          {checkin.bookingCode && (
                            <p className="text-xs text-muted-foreground truncate">Mã booking: {checkin.bookingCode}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0 text-right">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(getCheckInTime(checkin))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick links & support box */}
          <Card className="bg-secondary border-white/5 relative overflow-visible rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[20px] -mr-6 -mb-6" />
            <CardContent className="pt-6 space-y-4 relative z-10">
              <h4 className="font-bold text-white text-base">Hỗ trợ khẩn cấp</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khi có sự cố kỹ thuật hoặc tranh chấp thẻ/gói tập của hội viên, liên hệ ngay với Quản lý Câu lạc bộ hoặc Hotline kỹ thuật.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
