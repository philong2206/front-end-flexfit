import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Calendar, Sparkles, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMyGymBookingsApi, getMyClassBookingsApi } from "@/api/bookings";
import type { BookingResponse } from "@/api/bookings";
import { getUserCreditWalletApi } from "@/api/creditPackages";
import { getAllBranchesApi } from "@/api/branches";
import type { BranchDto } from "@/api/branches";

interface AiRecommendation {
  name: string;
  gym: string;
  time: string;
  credits: number;
  branchId: string;
  type: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nameParts = user?.fullName?.split(' ') || [];
  const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "bạn";

  const [upcomingBookings, setUpcomingBookings] = useState<BookingResponse[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.userId) return;
      try {
        await Promise.resolve();
        setLoadingBalance(true);
        const wallet = await getUserCreditWalletApi(user.userId);
        setBalance(wallet.balance);
      } catch (error) {
        console.error("Failed to fetch balance", error);
      } finally {
        setLoadingBalance(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBalance();
    }, 0);

    return () => clearTimeout(timer);
  }, [user?.userId]);

  useEffect(() => {
    const fetchBookingsAndBranches = async () => {
      try {
        await Promise.resolve();
        setLoadingBookings(true);
        const [gymRes, classRes, branchList] = await Promise.all([
          getMyGymBookingsApi().catch(() => ({ data: [] })),
          getMyClassBookingsApi().catch(() => ({ data: [] })),
          getAllBranchesApi().catch(() => [] as BranchDto[])
        ]);

        const ensureUtcString = (dateStr: string) => {
          if (!dateStr) return dateStr;
          if (!dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
            return `${dateStr}Z`;
          }
          return dateStr;
        };

        const gymBookings = (Array.isArray(gymRes) ? gymRes : (gymRes?.data || [])).map((b: BookingResponse) => ({
          ...b,
          startTime: ensureUtcString(b.startTime),
          endTime: ensureUtcString(b.endTime)
        }));
        const classBookings = (Array.isArray(classRes) ? classRes : (classRes?.data || [])).map((b: BookingResponse) => ({
          ...b,
          startTime: ensureUtcString(b.startTime),
          endTime: ensureUtcString(b.endTime)
        }));

        const all = [...gymBookings, ...classBookings];
        const now = new Date();

        const validBookings = all.filter(b => b.status?.toLowerCase() !== "cancelled");
        setCompletedCount(validBookings.length);

        const upcoming = validBookings.filter(b => new Date(b.endTime) >= now);
        upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setUpcomingBookings(upcoming.slice(0, 3));

        if (branchList.length > 0) {
          const recs: AiRecommendation[] = [
            {
              name: "Vinyasa Flow Yoga",
              gym: branchList[0].branchName,
              time: "Hôm nay, 19:30",
              credits: 3,
              branchId: branchList[0].branchId,
              type: "Yoga"
            },
            {
              name: "HIIT Performance",
              gym: branchList[Math.min(1, branchList.length - 1)].branchName,
              time: "Ngày mai, 18:00",
              credits: 4,
              branchId: branchList[Math.min(1, branchList.length - 1)].branchId,
              type: "HIIT"
            },
            {
              name: "Spin City",
              gym: branchList[Math.min(2, branchList.length - 1)].branchName,
              time: "Ngày mai, 07:00",
              credits: 4,
              branchId: branchList[Math.min(2, branchList.length - 1)].branchId,
              type: "Cardio"
            },
          ];
          setAiRecommendations(recs);
        }
      } catch (error) {
        console.error("Failed to fetch bookings and branches", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBookingsAndBranches();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bảng điều khiển</h1>
          <p className="text-muted-foreground text-lg">Chào mừng trở lại, {firstName}. Sẵn sàng tập luyện chưa?</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explore">
            <Button className="glow-btn rounded-xl">Đặt lịch ngay</Button>
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden h-full">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-lg font-medium text-primary">Credit hiện có</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-white">{loadingBalance ? "..." : balance !== null ? balance : 0}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-primary font-medium">Gia hạn trong 12 ngày tới</p>
                <Link to="/membership" className="text-xs text-white underline decoration-white/30 hover:decoration-white">Nạp thêm</Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-300">Lớp đã tham gia</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{loadingBookings ? "..." : completedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Tổng số buổi đã đăng ký</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-secondary border-white/5 flex flex-col">
          <CardHeader className="pb-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle>Lịch trình sắp tới</CardTitle>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-6">
              {loadingBookings ? (
                <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>
              ) : upcomingBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Không có lịch trình sắp tới</p>
              ) : (
                upcomingBookings.map((item, i) => {
                  const isNext = i === 0;
                  return (
                    <div key={item.bookingId} className="relative pl-6 border-l border-white/10 last:border-transparent pb-1">
                      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${isNext ? 'bg-primary shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-white/20'}`} />
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`font-semibold ${isNext ? 'text-white' : 'text-gray-300'}`}>{item.className || item.sessionName || "Buổi tập"}</span>
                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground">{item.className ? "Lớp học" : "Gym"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateShort(item.startTime)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.branchName || "FLEXFIT"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button onClick={() => navigate("/bookings")} variant="ghost" className="w-full mt-6 text-primary hover:text-primary hover:bg-primary/10">
              Xem toàn bộ lịch
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Gợi ý cho bạn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiRecommendations.map((rec, i) => (
            <Card
              key={i}
              onClick={() => navigate("/explore", { state: { autoSelectName: rec.name, autoSelectGym: rec.gym } })}
              className="bg-black/40 border-white/5 hover:border-primary/30 transition-colors group cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{rec.name}</h4>
                  <span className="text-xs font-medium bg-primary/20 text-primary px-2.5 py-1 rounded-full">{rec.credits} cr</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {rec.gym}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {rec.time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
