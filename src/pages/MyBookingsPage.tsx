import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, QrCode, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyGymBookingsApi, getMyClassBookingsApi, cancelGymBookingApi, cancelClassBookingApi } from "@/api/bookings";
import type { BookingResponse } from "@/api/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { refundCreditsLocally } from "@/api/creditPackages";
import { toast } from "sonner";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [bookingToCancel, setBookingToCancel] = useState<BookingResponse | null>(null);

  const fetchBookings = async () => {
    try {
      await Promise.resolve(); // Defer to avoid synchronous setState in effect
      setLoading(true);
      setError(null);
      const [gymRes, classRes] = await Promise.all([
        getMyGymBookingsApi(),
        getMyClassBookingsApi()
      ]).catch((err) => {
          throw err;
      });
      
      const ensureUtcString = (dateStr: string) => {
        if (!dateStr) return dateStr;
        if (!dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
          return `${dateStr}Z`;
        }
        return dateStr;
      };

      const gymBookings = (Array.isArray(gymRes) ? gymRes : (gymRes.data || [])).map((b: BookingResponse) => ({
        ...b,
        startTime: ensureUtcString(b.startTime),
        endTime: ensureUtcString(b.endTime)
      }));
      const classBookings = (Array.isArray(classRes) ? classRes : (classRes.data || [])).map((b: BookingResponse) => ({
        ...b,
        startTime: ensureUtcString(b.startTime),
        endTime: ensureUtcString(b.endTime)
      }));
      
      const all = [...gymBookings, ...classBookings];
      all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setBookings(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  
  const filteredBookings = bookings.filter(b => {
    const isCancelled = b.status?.toLowerCase() === "cancelled";
    const isPast = new Date(b.endTime) < now;
    
    if (filter === "cancelled") return isCancelled;
    if (filter === "completed") return !isCancelled && isPast;
    if (filter === "upcoming") return !isCancelled && !isPast;
    return false;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    const booking = bookingToCancel;
    setBookingToCancel(null);
    try {
      if (booking.classId) {
        await cancelClassBookingApi(booking.bookingId);
      } else {
        await cancelGymBookingApi(booking.bookingId);
      }
      if (user?.userId) {
        // Refund credits locally
        refundCreditsLocally(user.userId, booking.creditUsed || 4);
      }
      toast.success("Hủy lịch thành công!");
      fetchBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hủy lịch thất bại");
    }
  };

  const getBookingCredits = (booking: BookingResponse) => {
    if (booking.creditUsed && booking.creditUsed > 0) return booking.creditUsed;
    const name = (booking.className || booking.sessionName || "").toLowerCase();
    if (name.includes("yoga")) return 3;
    if (name.includes("hiit")) return 4;
    if (name.includes("lifting") || name.includes("gym")) return 5;
    if (name.includes("spin") || name.includes("cardio")) return 4;
    if (name.includes("pilates")) return 6;
    if (name.includes("boxing")) return 4;
    return 4; // Default fallback
  };

  const [selectedDetailBooking, setSelectedDetailBooking] = useState<BookingResponse | null>(null);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Lịch Sử Đặt Chỗ</h1>
        <p className="text-muted-foreground text-lg">Quản lý các buổi tập sắp tới và đã tham gia của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl border border-white/5 w-fit">
        <button 
          onClick={() => setFilter("upcoming")}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${filter === "upcoming" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}
        >
          Sắp tới
        </button>
        <button 
          onClick={() => setFilter("completed")}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${filter === "completed" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}
        >
          Đã hoàn thành
        </button>
        <button 
          onClick={() => setFilter("cancelled")}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${filter === "cancelled" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}
        >
          Đã hủy
        </button>
      </div>

      {loading && <p className="text-muted-foreground mt-8">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-400 mt-8">{error}</p>}

      {/* List of bookings */}
      {!loading && !error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">
            {filter === "upcoming" ? "Các buổi tập sắp tới" : (filter === "completed" ? "Buổi tập đã hoàn thành" : "Buổi tập đã hủy")}
          </h2>
          {filteredBookings.length === 0 && <p className="text-muted-foreground italic">Không có buổi tập nào trong mục này.</p>}
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.bookingId} className="bg-secondary/40 border-white/5 hover:bg-secondary/60 transition-colors">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20 shrink-0">
                      <span className="text-xs text-primary font-medium">{formatDate(booking.startTime).split(',')[0]}</span>
                      <span className="text-lg font-bold text-white">{new Date(booking.startTime).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{booking.className || booking.sessionName || "Buổi tập"}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.branchName || "FLEXFIT"}</span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10">{booking.className ? "Lớp học" : "Tập tự do"}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {filter === "upcoming" && (
                      <Button variant="outline" size="sm" onClick={() => setBookingToCancel(booking)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 flex-1 sm:flex-none">Hủy lịch</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedDetailBooking(booking)} className="flex-1 sm:flex-none border-white/10 hover:bg-white/5 text-primary border-primary/20">Chi tiết</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detail Booking Modal */}
      {selectedDetailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDetailBooking(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-secondary border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            {/* Header/Banner image or color */}
            <div className="h-32 bg-gradient-to-br from-primary/30 to-secondary relative flex items-center justify-center border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-4 left-4 bg-primary text-white border-none">
                {selectedDetailBooking.className ? "Lớp học" : "Tập Gym tự do"}
              </Badge>
              <h3 className="text-xl font-bold text-white z-10 px-4 text-center">{selectedDetailBooking.className || selectedDetailBooking.sessionName || "Buổi tập"}</h3>
            </div>

            <div className="p-6 relative">
              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Ngày</span>
                  <span className="text-white font-medium">{formatDate(selectedDetailBooking.startTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Thời gian</span>
                  <span className="text-white font-medium">{formatTime(selectedDetailBooking.startTime)} - {formatTime(selectedDetailBooking.endTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Địa điểm</span>
                  <span className="text-white font-medium">{selectedDetailBooking.branchName || "FLEXFIT Gym"}</span>
                </div>
                {selectedDetailBooking.creditUsed !== undefined && (
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-muted-foreground">Phí đặt chỗ</span>
                    <span className="text-primary font-bold">{getBookingCredits(selectedDetailBooking)} Credits</span>
                  </div>
                )}
              </div>

              {/* QR Code section */}
              {selectedDetailBooking.status?.toLowerCase() !== "cancelled" && (
                <div className="bg-black/30 p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5 mb-6">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Đưa mã QR này cho lễ tân để check-in</p>
                  <div className="bg-white p-3 rounded-xl shadow-lg">
                    <QrCode className="w-32 h-32 text-black" />
                  </div>
                  <p className="text-xs text-primary mt-3 font-mono">ID: {selectedDetailBooking.bookingCode || "BK12948"}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5" onClick={() => setSelectedDetailBooking(null)}>Đóng</Button>
                {selectedDetailBooking.status?.toLowerCase() !== "cancelled" && (
                  <Button 
                    className="flex-1 glow-btn"
                    onClick={() => {
                      const mapsQuery = selectedDetailBooking.branchName 
                        ? `${selectedDetailBooking.branchName} TP.HCM` 
                        : "FlexFit Gym TP.HCM";
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`, '_blank');
                    }}
                  >
                    Chỉ đường
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setBookingToCancel(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-secondary border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 bg-destructive/15 rounded-full flex items-center justify-center text-destructive">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Xác nhận hủy lịch</h3>
              <p className="text-sm text-muted-foreground">
                Bạn có chắc chắn muốn hủy lịch tập buổi <span className="text-white font-semibold">"{bookingToCancel.className || bookingToCancel.sessionName}"</span>?
              </p>
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                Credits phí đặt lịch sẽ được hoàn trả đầy đủ vào tài khoản của bạn.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 border-white/10 text-white hover:bg-white/5" 
                onClick={() => setBookingToCancel(null)}
              >
                Giữ lịch
              </Button>
              <Button 
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-medium"
                onClick={handleConfirmCancel}
              >
                Hủy lịch
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
