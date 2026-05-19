import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Filter, Calendar, Clock, X, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { bookGymSessionApi, getMyGymBookingsApi, getMyClassBookingsApi } from "@/api/bookings";
import { deductCreditsLocally } from "@/api/creditPackages";
import { getAllBranchesApi } from "@/api/branches";
import { toast } from "sonner";

interface ExploreSession {
  id: string;
  name: string;
  gym: string;
  branchId: string;
  location: string;
  rating: number;
  time: string;
  duration: string;
  credits: number;
  type: string;
  image: string;
}

const SESSION_TEMPLATES = [
  { name: "HIIT Performance", type: "HIIT", duration: "45 phút", credits: 4, timeOffset: 0, timeHour: "18:00", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop", rating: 4.9 },
  { name: "Vinyasa Flow Yoga", type: "Yoga", duration: "60 phút", credits: 3, timeOffset: 0, timeHour: "19:30", image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1470&auto=format&fit=crop", rating: 4.8 },
  { name: "Heavy Lifting", type: "Gym", duration: "60 phút", credits: 5, timeOffset: 1, timeHour: "17:00", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop", rating: 4.7 },
  { name: "Spin City", type: "Cardio", duration: "45 phút", credits: 4, timeOffset: 1, timeHour: "07:00", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop", rating: 4.9 },
  { name: "Pilates Reformer", type: "Pilates", duration: "50 phút", credits: 6, timeOffset: 2, timeHour: "08:00", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop", rating: 4.9 },
  { name: "Boxing Basics", type: "Boxing", duration: "60 phút", credits: 4, timeOffset: 2, timeHour: "18:30", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1470&auto=format&fit=crop", rating: 4.6 }
];

const CATEGORIES = ["Tất cả", "HIIT", "Yoga", "Gym", "Cardio", "Pilates", "Boxing"];

export default function ExplorePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingModal, setBookingModal] = useState<{isOpen: boolean, classData: ExploreSession | null}>({isOpen: false, classData: null});
  const [isBooked, setIsBooked] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [sessions, setSessions] = useState<ExploreSession[]>([]);

  useEffect(() => {
    const loadBranchesAndSessions = async () => {
      try {
        const branchList = await getAllBranchesApi();
        
        const generated: ExploreSession[] = [];
        branchList.forEach((branch) => {
          SESSION_TEMPLATES.forEach((template, index) => {
            const timeStr = template.timeOffset === 0 
              ? `Hôm nay, ${template.timeHour}`
              : template.timeOffset === 1 
              ? `Ngày mai, ${template.timeHour}`
              : `Thứ 6, ${template.timeHour}`;
            
            generated.push({
              id: `${branch.branchId}-${index}`,
              name: template.name,
              gym: branch.branchName,
              branchId: branch.branchId,
              location: `${branch.address}, ${branch.district}, ${branch.city}`,
              rating: template.rating,
              time: timeStr,
              duration: template.duration,
              credits: template.credits,
              type: template.type,
              image: template.image
            });
          });
        });
        setSessions(generated);

        const state = location.state as { autoSelectName?: string; autoSelectGym?: string } | null;
        if (state?.autoSelectName) {
          const matched = generated.find(s => s.name === state.autoSelectName && (!state.autoSelectGym || s.gym === state.autoSelectGym));
          if (matched) {
            setBookingModal({ isOpen: true, classData: matched });
          }
        }
      } catch (err) {
        console.error("Failed to load branches and sessions", err);
      }
    };
    loadBranchesAndSessions();
  }, [location.state]);

  const parseMockTime = (timeStr: string, durationStr: string) => {
    const now = new Date();
    const targetDate = new Date(now);
    
    if (timeStr.includes("Hôm nay")) {
      // Keep today
    } else if (timeStr.includes("Ngày mai")) {
      targetDate.setDate(now.getDate() + 1);
    } else {
      targetDate.setDate(now.getDate() + 1);
    }
    
    const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      targetDate.setHours(hours, minutes, 0, 0);
    } else {
      targetDate.setHours(18, 0, 0, 0);
    }
    
    let durationMinutes = 60;
    const durationMatch = durationStr.match(/(\d+)/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }
    
    const startTimeStr = targetDate.toISOString();
    const endTimeStr = new Date(targetDate.getTime() + durationMinutes * 60 * 1000).toISOString();
    
    return { startTimeStr, endTimeStr };
  };

  const filteredClasses = sessions.filter(c => {
    const matchesCategory = activeCategory === "Tất cả" || c.type === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.gym.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBook = async () => {
    if (!user?.userId) {
      toast.error("Vui lòng đăng nhập với tài khoản Hội viên để thực hiện đặt chỗ.");
      return;
    }
    if (!bookingModal.classData) return;

    try {
      setIsBookingLoading(true);
      
      const { startTimeStr, endTimeStr } = parseMockTime(
        bookingModal.classData.time,
        bookingModal.classData.duration
      );

      // Overlap Validation
      const [gymRes, classRes] = await Promise.all([
        getMyGymBookingsApi().catch(() => []),
        getMyClassBookingsApi().catch(() => [])
      ]);
      
      const gymBookings = Array.isArray(gymRes) ? gymRes : (gymRes.data || []);
      const classBookings = Array.isArray(classRes) ? classRes : (classRes.data || []);
      const activeBookings = [...gymBookings, ...classBookings].filter(b => b.status?.toLowerCase() !== "cancelled");

      const newStart = new Date(startTimeStr);
      const newEnd = new Date(endTimeStr);

      const ensureUtcString = (dateStr: string) => {
        if (!dateStr) return dateStr;
        if (!dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
          return `${dateStr}Z`;
        }
        return dateStr;
      };

      const hasOverlap = activeBookings.some(booking => {
        const existStart = new Date(ensureUtcString(booking.startTime));
        const existEnd = new Date(ensureUtcString(booking.endTime));
        return newStart < existEnd && existStart < newEnd;
      });

      if (hasOverlap) {
        toast.error("Bạn đã có một lịch đặt chỗ khác trùng ngày, trùng giờ với buổi tập này. Vui lòng chọn khung giờ hoặc buổi tập khác!");
        return;
      }

      await bookGymSessionApi({
        branchId: bookingModal.classData.branchId,
        sessionName: bookingModal.classData.name,
        startTime: startTimeStr,
        endTime: endTimeStr
      });

      // Deduct credit locally
      deductCreditsLocally(user.userId, bookingModal.classData.credits);

      setIsBooked(true);
      setTimeout(() => {
        setBookingModal({isOpen: false, classData: null});
        setIsBooked(false);
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đặt lịch thất bại");
    } finally {
      setIsBookingLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Khám phá lớp học</h1>
        <p className="text-muted-foreground text-lg">Tìm và đặt chỗ lớp học từ các đối tác cao cấp của chúng tôi.</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm lớp học, phòng gym, địa điểm..." 
            className="w-full bg-secondary border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-auto py-3.5 px-6 gap-2 border-white/10 glass w-full md:w-auto rounded-2xl">
          <Filter className="h-4 w-4" /> Bộ lọc
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 text-sm font-medium ${
              activeCategory === category 
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
              : "bg-secondary text-muted-foreground hover:bg-white/10 border border-white/5"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Class Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredClasses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="col-span-full py-20 text-center text-muted-foreground"
            >
              Không tìm thấy lớp học nào phù hợp.
            </motion.div>
          ) : (
            filteredClasses.map((cls, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={cls.id}
              >
                <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-secondary flex flex-col h-full shadow-lg">
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={cls.image} 
                      alt={cls.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                      <span className="text-xs font-bold text-white">{cls.rating}</span>
                    </div>
                    
                    <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-full text-xs shadow-lg">
                      {cls.credits} Credit
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md text-white font-medium px-3 py-1.5 rounded-full text-xs border border-white/10">
                      {cls.type}
                    </div>
                  </div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                      <p className="text-muted-foreground font-medium text-sm">{cls.gym}</p>
                    </div>
                    
                    <div className="space-y-3 mb-6 mt-auto">
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="h-4 w-4 mr-3 text-muted-foreground" /> {cls.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="h-4 w-4 mr-3 text-muted-foreground" /> {cls.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="h-4 w-4 mr-3 text-muted-foreground" /> {cls.duration}
                      </div>
                    </div>

                    <Button 
                      className="w-full glow-btn rounded-xl h-11"
                      onClick={() => setBookingModal({isOpen: true, classData: cls})}
                    >
                      Đặt chỗ ngay
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Booking Modal Overlay */}
      <AnimatePresence>
        {bookingModal.isOpen && bookingModal.classData && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => !isBooked && setBookingModal({isOpen: false, classData: null})}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-secondary border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
              >
                {!isBooked ? (
                  <>
                    <button 
                      className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors p-1"
                      onClick={() => setBookingModal({isOpen: false, classData: null})}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">Xác nhận đặt chỗ</h2>
                      <p className="text-muted-foreground">Vui lòng kiểm tra lại thông tin lớp học.</p>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 mb-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Lớp học</span>
                        <span className="text-white font-medium">{bookingModal.classData.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Địa điểm</span>
                        <span className="text-white font-medium">{bookingModal.classData.gym}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Thời gian</span>
                        <span className="text-white font-medium">{bookingModal.classData.time}</span>
                      </div>
                      <div className="h-px bg-white/5 my-2 w-full" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Chi phí</span>
                        <span className="text-primary font-bold">{bookingModal.classData.credits} Credit</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="ghost" 
                        className="flex-1 border border-white/10 hover:bg-white/5" 
                        onClick={() => setBookingModal({isOpen: false, classData: null})}
                        disabled={isBookingLoading}
                      >
                        Hủy
                      </Button>
                      <Button 
                        className="flex-1 glow-btn" 
                        onClick={handleBook}
                        disabled={isBookingLoading}
                      >
                        {isBookingLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang đặt...
                          </>
                        ) : (
                          "Xác nhận đặt"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                      className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Đặt chỗ thành công!</h2>
                    <p className="text-muted-foreground">Bạn đã đăng ký thành công lớp {bookingModal.classData.name}.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
