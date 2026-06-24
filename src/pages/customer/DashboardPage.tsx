import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getMyClassBookingsApi, getMyGymBookingsApi, type BookingResponse } from "@/api/bookings";
import { getUserCreditWalletApi } from "@/api/creditPackages";
import {
  AI_UNAVAILABLE_MESSAGE,
  getClassSuggestionApi,
  getWorkoutSuggestionApi,
  type AISuggestionResponse,
} from "@/api/ai";
import { buildBriefSuggestion, cleanAiText } from "@/lib/aiUtils";
import { ChevronRight, CalendarDays, Dumbbell, ExternalLink } from "lucide-react";

interface AiRecommendation {
  id: "workout" | "classes";
  title: string;
  content: string;
  suggestedAt?: string;
}

function ensureUtcString(dateStr: string) {
  if (!dateStr) return dateStr;
  if (!dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return `${dateStr}Z`;
  }
  return dateStr;
}

function readSuggestion(data: AISuggestionResponse): string {
  return typeof data?.suggestion === "string" ? data.suggestion.trim() : "";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nameParts = user?.fullName?.split(" ") || [];
  const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "bạn";

  const [upcomingBookings, setUpcomingBookings] = useState<BookingResponse[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [loadingAiRecommendations, setLoadingAiRecommendations] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.userId) {
        setLoadingBalance(false);
        return;
      }

      try {
        setLoadingBalance(true);
        setBalanceError(null);
        const wallet = await getUserCreditWalletApi(user.userId);
        setBalance(wallet.balance);
      } catch (error) {
        console.error("Failed to fetch balance", error);
        setBalance(null);
        setBalanceError("Không thể tải số credit");
      } finally {
        setLoadingBalance(false);
      }
    };

    void fetchBalance();
    window.addEventListener("wallet-update", fetchBalance);
    return () => window.removeEventListener("wallet-update", fetchBalance);
  }, [user?.userId]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const [gymRes, classRes] = await Promise.all([
          getMyGymBookingsApi().catch(() => ({ data: [] })),
          getMyClassBookingsApi().catch(() => ({ data: [] })),
        ]);

        const gymBookings = (Array.isArray(gymRes) ? gymRes : gymRes?.data || []).map((booking: BookingResponse) => ({
          ...booking,
          startTime: ensureUtcString(booking.startTime),
          endTime: ensureUtcString(booking.endTime),
        }));

        const classBookings = (Array.isArray(classRes) ? classRes : classRes?.data || []).map(
          (booking: BookingResponse) => ({
            ...booking,
            startTime: ensureUtcString(booking.startTime),
            endTime: ensureUtcString(booking.endTime),
          })
        );

        const now = new Date();
        const validBookings = [...gymBookings, ...classBookings].filter(
          (booking) => booking.status?.toLowerCase() !== "cancelled"
        );

        setCompletedCount(validBookings.length);

        const upcoming = validBookings
          .filter((booking) => new Date(booking.endTime) >= now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setUpcomingBookings(upcoming.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    void fetchBookings();
  }, []);

  useEffect(() => {
    const fetchAiRecommendations = async () => {
      try {
        setLoadingAiRecommendations(true);
        setAiError(null);

        const [workoutResult, classResult] = await Promise.allSettled([
          getWorkoutSuggestionApi(),
          getClassSuggestionApi(),
        ]);

        const nextRecommendations: AiRecommendation[] = [];

        if (workoutResult.status === "fulfilled") {
          const content = readSuggestion(workoutResult.value);
          if (content) {
            nextRecommendations.push({
              id: "workout",
              title: "Gợi ý lịch tập",
              content,
              suggestedAt: workoutResult.value.suggestedAt,
            });
          }
        }

        if (classResult.status === "fulfilled") {
          const content = readSuggestion(classResult.value);
          if (content) {
            nextRecommendations.push({
              id: "classes",
              title: "Gợi ý lớp học",
              content,
              suggestedAt: classResult.value.suggestedAt,
            });
          }
        }

        setAiRecommendations(nextRecommendations);
        if (nextRecommendations.length === 0) {
          setAiError(AI_UNAVAILABLE_MESSAGE);
        }
      } catch (error) {
        console.error("Failed to fetch AI recommendations", error);
        setAiRecommendations([]);
        setAiError(AI_UNAVAILABLE_MESSAGE);
      } finally {
        setLoadingAiRecommendations(false);
      }
    };

    void fetchAiRecommendations();
  }, []);

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}, ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const openAiCoach = () => {
    window.dispatchEvent(new Event("flexfit:open-ai-chat"));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Bảng điều khiển</h1>
          <p className="text-lg text-muted-foreground">Chào mừng trở lại, {firstName}. Sẵn sàng tập luyện chưa?</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="glass" className="gap-2 rounded-md" onClick={openAiCoach}>
            <Sparkles className="h-4 w-4" />
            AI Coach
          </Button>
          <Link to="/explore">
            <Button className="rounded-md">Đặt lịch ngay</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative h-full overflow-hidden border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-primary/20 blur-[40px]" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-primary">Credit hiện có</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-white">
                {loadingBalance ? "..." : balanceError ? "--" : balance !== null ? balance : "--"}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-medium text-primary">{balanceError || "Gia hạn trong 12 ngày tới"}</p>
                <Link to="/membership" className="text-xs text-white underline decoration-white/30 hover:decoration-white">
                  Nạp thêm
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-white/5 bg-secondary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-300">Lớp đã tham gia</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{loadingBookings ? "..." : completedCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">Tổng số buổi đã đăng ký</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="flex flex-col border-white/5 bg-secondary">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Lịch trình sắp tới</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            <div className="space-y-6">
              {loadingBookings ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Đang tải...</p>
              ) : upcomingBookings.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Không có lịch trình sắp tới</p>
              ) : (
                upcomingBookings.map((item, index) => {
                  const isNext = index === 0;
                  return (
                    <div key={item.bookingId} className="relative border-l border-white/10 pb-1 pl-6 last:border-transparent">
                      <div
                        className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${
                          isNext ? "bg-primary shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-white/20"
                        }`}
                      />
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className={`font-semibold ${isNext ? "text-white" : "text-gray-300"}`}>
                          {item.className || item.sessionName || "Buổi tập"}
                        </span>
                        <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                          {item.className ? "Lớp học" : "Gym"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateShort(item.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.branchName || "FLEXFIT"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button
              onClick={() => navigate("/bookings")}
              variant="ghost"
              className="mt-6 w-full text-primary hover:bg-primary/10 hover:text-primary"
            >
              Xem toàn bộ lịch
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Gợi ý cho bạn
          </h2>
          <Button type="button" variant="ghost" className="gap-2 text-primary hover:bg-primary/10" onClick={openAiCoach}>
            <MessageIcon />
            AI Coach
          </Button>
        </div>

        {loadingAiRecommendations ? (
          <Card className="border-white/5 bg-black/40">
            <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI đang tải gợi ý...
            </CardContent>
          </Card>
        ) : aiError ? (
          <Card className="border-red-500/20 bg-red-500/10">
            <CardContent className="flex items-start gap-2 p-5 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{aiError}</span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            {aiRecommendations.map((recommendation) => (
              <DashboardAiCard 
                key={recommendation.id} 
                recommendation={recommendation} 
                onOpenCoach={openAiCoach} 
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function MessageIcon() {
  return <Sparkles className="h-4 w-4" />;
}

function DashboardAiCard({ recommendation, onOpenCoach }: { recommendation: AiRecommendation, onOpenCoach: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const brief = buildBriefSuggestion(recommendation.content, []); // empty suggestions for now on dashboard
  const lines = cleanAiText(recommendation.content).split('\n').filter(l => l.trim().length > 0);
  const Icon = brief.kind === "classes" ? CalendarDays : brief.kind === "workout" ? Dumbbell : Sparkles;
  
  return (
    <Card className="border-white/10 bg-[#18181b] overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:border-white/20">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{brief.title}</h4>
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary">AI Gợi ý</span>
            </div>
          </div>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
            Hôm nay
          </span>
        </div>
        
        <p className="mb-4 text-xs leading-relaxed text-zinc-400 line-clamp-2 min-h-[36px]">
          {brief.summary}
        </p>
        
        <ul className="mb-5 space-y-2.5 flex-1">
          {brief.bullets.slice(0, 3).map((bullet, idx) => (
            <li key={idx} className="flex gap-2 text-xs leading-relaxed text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="line-clamp-2">{bullet}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex flex-col gap-2 sm:flex-row mt-auto">
          <Button
            type="button"
            className="h-9 flex-1 rounded-xl bg-primary text-xs font-bold text-black hover:bg-orange-400"
            onClick={() => brief.kind === 'classes' ? navigate('/explore') : onOpenCoach()}
          >
            {brief.ctaLabel}
            {brief.kind === 'classes' ? <ExternalLink className="ml-1 h-3.5 w-3.5" /> : <ChevronRight className="ml-1 h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl border border-white/10 px-3 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Thu gọn" : "Xem chi tiết"}
          </Button>
        </div>
      </CardContent>
      
      {/* Expanded content area */}
      {expanded && lines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/10 bg-black/40 px-5 py-4 max-h-[220px] overflow-y-auto"
        >
          <div className="space-y-2">
             {lines.map((line, i) => (
                <p key={i} className="text-xs leading-relaxed text-zinc-400">{line}</p>
             ))}
          </div>
        </motion.div>
      )}
    </Card>
  );
}
