import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Filter, Calendar, Clock, X, CheckCircle, Loader2, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { bookClassApi, bookGymSessionApi, getMyGymBookingsApi, getMyClassBookingsApi } from "@/api/bookings";
import { getAllBranchesApi } from "@/api/branches";
import { getAllClassesApi } from "@/api/classes";
import { toast } from "sonner";
import { normalizeApiError, isInsufficientCreditsError } from "@/lib/normalizeApiError";
import {
  buildNext7DateTabs,
  buildSlotDateTime,
  formatOpenHours,
  generateHourSlots,
  getSlotRemaining,
  isSlotInPast,
  recordSlotBooking,
  slotLabelForDate,
  type DateTab,
} from "@/lib/gymTimeSlots";

interface ExploreSession {
  id: string;
  classId?: string;
  name: string;
  gym: string;
  branchId: string;
  location: string;
  rating?: number;
  openHours?: string;
  openTime?: string;
  closeTime?: string;
  duration: string;
  durationMinutes: number;
  credits: number;
  type: string;
  image?: string;
  isOpenGym: boolean; // NEW: phân biệt Gym vs Class cố định
  startTime?: string;
  endTime?: string;
  categoryName?: string;
  branchName?: string;
  address?: string;
  district?: string;
  city?: string;
  sessionType?: string;
  availableSlots?: number;
  coachName?: string;
}

const isOpenGym = (item: ExploreSession) => item.isOpenGym;

const formatTime = (value?: string) => {
  if (!value) return "--:--";

  // TIME format: "05:00:00"
  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  // DATETIME format: "2026-05-21T17:30:00"
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return value;
};

type BookingStep = "pick-time" | "confirm";

interface SelectedSlot {
  dateStr: string;
  timeHm: string;
  label: string;
}

const ALL_CATEGORY = "Tất cả";
const CLASS_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop";

export default function ExplorePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; classData: ExploreSession | null }>({
    isOpen: false,
    classData: null,
  });
  const [bookingStep, setBookingStep] = useState<BookingStep>("pick-time");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [pickerDateStr, setPickerDateStr] = useState("");
  const [slotTick, setSlotTick] = useState(0);
  const [isBooked, setIsBooked] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [sessions, setSessions] = useState<ExploreSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null); // NEW: track booking error

  const dateTabs = useMemo(() => buildNext7DateTabs(), []);
  const categories = useMemo(
    () => [ALL_CATEGORY, ...Array.from(new Set(sessions.map((session) => session.type).filter(Boolean)))],
    [sessions]
  );

  const openBookingPicker = useCallback(
    (cls: ExploreSession) => {
      setBookingStep("pick-time");
      setSelectedSlot(null);
      setPickerDateStr(dateTabs[0]?.dateStr ?? "");
      setBookingModal({ isOpen: true, classData: cls });
    },
    [dateTabs]
  );

  const closeBookingModal = useCallback(() => {
    setBookingModal({ isOpen: false, classData: null });
    setBookingStep("pick-time");
    setSelectedSlot(null);
    setIsBooked(false);
    setBookingError(null); // NEW: clear error
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const loadBranchesAndSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const [branchList, classList] = await Promise.all([
          getAllBranchesApi(),
          getAllClassesApi(),
        ]);
        if (ac.signal.aborted) return;
        
        const branchById = new Map(branchList.map((branch) => [branch.branchId, branch]));
        const generated: ExploreSession[] = [];
        branchList.forEach((branch) => {
          const openHours = formatOpenHours(branch.openTime, branch.closeTime);
          generated.push({
            id: `open-gym-${branch.branchId}`,
            name: `Open Gym - ${branch.branchName}`,
            gym: branch.branchName,
            branchId: branch.branchId,
            location: [branch.address, branch.district, branch.city].filter(Boolean).join(", "),
            openHours,
            openTime: branch.openTime,
            closeTime: branch.closeTime,
            duration: "60 phút", // Open gym mặc định chia slot 60 phút
            durationMinutes: 60,
            credits: branch.creditCost,
            type: "Gym",
            image: branch.thumbnailUrl || CLASS_FALLBACK_IMAGE,
            isOpenGym: true,
            
            startTime: undefined,
            endTime: undefined,
            categoryName: "Gym",
            branchName: branch.branchName,
            address: branch.address,
            district: branch.district,
            city: branch.city,
            sessionType: "OPEN_GYM",
            availableSlots: 15,
          });
        });
        const realClasses: ExploreSession[] = classList.map((cls) => {
          const branch = branchById.get(cls.branchId);
          const start = new Date(cls.startTime);
          const end = new Date(cls.endTime);
          const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

          return {
            id: cls.classId,
            classId: cls.classId,
            name: cls.className,
            gym: cls.branchName,
            branchId: cls.branchId,
            location: [branch?.address, branch?.district, branch?.city].filter(Boolean).join(", ") || cls.branchName,
            duration: `${durationMinutes} phút`,
            durationMinutes,
            credits: cls.creditCost,
            type: cls.categoryName,
            image: cls.thumbnailUrl || CLASS_FALLBACK_IMAGE,
            isOpenGym: false,
            startTime: cls.startTime,
            endTime: cls.endTime,
            categoryName: cls.categoryName,
            branchName: cls.branchName,
            address: branch?.address,
            district: branch?.district,
            city: branch?.city,
            coachName: cls.coachName,
          };
        });

        const allSessions = [...generated, ...realClasses];
        setSessions(allSessions);

        const state = location.state as { autoSelectName?: string; autoSelectGym?: string } | null;
        if (state?.autoSelectName) {
          const matched = allSessions.find(s => s.name === state.autoSelectName && (!state.autoSelectGym || s.gym === state.autoSelectGym));
          if (matched) {
            openBookingPicker(matched);
          }
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error("Failed to load branches and sessions", err);
      } finally {
        if (!ac.signal.aborted) setIsLoadingSessions(false);
      }
    };
    loadBranchesAndSessions();
    return () => ac.abort();
  }, [location.state, openBookingPicker]);

  const hourSlotsForPicker = useMemo(() => {
    const cls = bookingModal.classData;
    if (!cls) return [];
    // Chỉ generate slots cho Open Gym, class cố định không cần
    if (!isOpenGym(cls)) return [];
    if (!cls.openTime || !cls.closeTime) return [];
    return generateHourSlots(cls.openTime, cls.closeTime, cls.durationMinutes);
  }, [bookingModal.classData]);

  useEffect(() => {
    if (selectedSlot && isSlotInPast(selectedSlot.dateStr, selectedSlot.timeHm)) {
      setSelectedSlot(null);
    }
  }, [pickerDateStr, selectedSlot]);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sessions.filter((c) => {
      const matchesCategory = activeCategory === ALL_CATEGORY || c.type === activeCategory;
      const matchesSearch =
        c.name.toLowerCase().includes(q) || c.gym.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [sessions, activeCategory, searchQuery]);

  const handleBook = async () => {
    if (!user?.userId) {
      toast.error("Vui lòng đăng nhập với tài khoản Hội viên để thực hiện đặt chỗ.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!bookingModal.classData) {
      toast.error("Vui lòng chọn lớp học.");
      return;
    }

    // Clear previous error
    setBookingError(null);

    // Với class cố định, dùng startTime/endTime từ backend
    let startTimeStr: string;
    let endTimeStr: string;

    if (isOpenGym(bookingModal.classData)) {
      // Open Gym: cần selectedSlot
      if (!selectedSlot) {
        toast.error("Vui lòng chọn ngày và giờ tập.");
        return;
      }
      if (isSlotInPast(selectedSlot.dateStr, selectedSlot.timeHm)) {
        toast.error("Khung giờ này đã qua. Vui lòng chọn giờ sắp tới.");
        setBookingStep("pick-time");
        return;
      }
      const slotDateTime = buildSlotDateTime(
        selectedSlot.dateStr,
        selectedSlot.timeHm,
        bookingModal.classData.durationMinutes
      );
      startTimeStr = slotDateTime.startTimeStr;
      endTimeStr = slotDateTime.endTimeStr;
    } else {
      // Class cố định: dùng startTime/endTime
      const startTime = bookingModal.classData.startTime;
      const endTime = bookingModal.classData.endTime;
      if (!startTime || !endTime) {
        toast.error("Lớp học chưa có lịch cố định.");
        return;
      }
      startTimeStr = startTime;
      endTimeStr = endTime;
    }

    try {
      setIsBookingLoading(true);

      // Overlap Validation
      const [gymRes, classRes] = await Promise.all([
        getMyGymBookingsApi().catch(() => []),
        getMyClassBookingsApi().catch(() => [])
      ]);
      
      const gymBookings = Array.isArray(gymRes) ? gymRes : (gymRes.data || []);
      const classBookings = Array.isArray(classRes) ? classRes : (classRes.data || []);
      const activeBookings = [...gymBookings, ...classBookings].filter(b => b.status?.toLowerCase() !== "cancelled");

      const getDatePart = (dateTime: string) => dateTime.slice(0, 10);
      const getMinutes = (dateTime: string) => {
        const time = dateTime.slice(11, 16);
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      const isOverlap = (newStart: number, newEnd: number, oldStart: number, oldEnd: number) => {
        return newStart < oldEnd && newEnd > oldStart;
      };

      const hasOverlap = activeBookings.some((booking) => {
        if (!booking.startTime || !booking.endTime) return false;
        
        const sameDate = getDatePart(booking.startTime) === getDatePart(startTimeStr);
        const activeStatus = !["cancelled", "completed"].includes(
          booking.status?.toLowerCase() || ""
        );

        if (!sameDate || !activeStatus) return false;

        return isOverlap(
          getMinutes(startTimeStr),
          getMinutes(endTimeStr),
          getMinutes(booking.startTime),
          getMinutes(booking.endTime)
        );
      });

      if (hasOverlap) {
        const errorMsg = "Bạn đã có lịch đặt trong khung giờ này";
        setBookingError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (isOpenGym(bookingModal.classData)) {
        // Enforce exact explicit payload
        const payload = {
          branchId: bookingModal.classData.branchId,
          sessionName: bookingModal.classData.name,
          startTime: startTimeStr,
          endTime: endTimeStr
        };
        console.log("Booking Payload:", JSON.stringify(payload, null, 2));
        await bookGymSessionApi(payload);
      } else if (bookingModal.classData.classId) {
        await bookClassApi({ classId: bookingModal.classData.classId });
      } else {
        throw new Error("Lớp học thiếu mã lớp từ backend");
      }

      if (isOpenGym(bookingModal.classData) && selectedSlot) {
        recordSlotBooking(
          bookingModal.classData.id,
          selectedSlot.dateStr,
          selectedSlot.timeHm
        );
        setSlotTick((t) => t + 1);
      }

      window.dispatchEvent(new Event("wallet-update"));
      toast.success("Đặt chỗ thành công!");
      setIsBooked(true);
      setTimeout(() => {
        closeBookingModal();
      }, 2000);
    } catch (err) {
      const errorMessage = normalizeApiError(err);
      setBookingError(errorMessage);
      
      // Show appropriate toast based on error type
      if (isInsufficientCreditsError(err)) {
        toast.warning(errorMessage, {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
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
        {categories.map(category => (
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
      {isLoadingSessions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-secondary/40 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
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
            filteredClasses.map((cls, i) => {
              const gym = isOpenGym(cls);
              const timeLabel = gym ? "Mở cửa" : "Giờ học";
              const timeValue = gym
                ? `${formatTime(cls.openTime)} - ${formatTime(cls.closeTime)}`
                : `${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}`;
              
              const isPastClass = !gym && cls.startTime ? new Date(cls.startTime) < new Date() : false;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={cls.id}
                >
                  <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-secondary flex flex-col h-full shadow-lg relative">
                    {/* PAST CLASS OVERLAY */}
                    {!gym && isPastClass && (
                      <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-destructive/90 text-destructive-foreground font-bold px-4 py-2 rounded-xl text-lg rotate-[-10deg] border-2 border-destructive shadow-2xl">
                          Đã hết hạn
                        </div>
                      </div>
                    )}

                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={cls.image || CLASS_FALLBACK_IMAGE} 
                        alt={cls.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-transparent to-transparent" />
                      
                      {cls.rating !== undefined && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                          <span className="text-xs font-bold text-white">{cls.rating}</span>
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                        <div className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-full text-xs shadow-lg w-fit">
                          {cls.credits !== undefined ? `${cls.credits} Credit` : <span className="text-red-200">Thiếu giá</span>}
                        </div>
                        {!gym && cls.coachName && (
                           <div className="bg-black/60 text-white font-medium px-3 py-1.5 rounded-full text-xs border border-white/10 w-fit backdrop-blur-md">
                             Coach: {cls.coachName}
                           </div>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md text-white font-medium px-3 py-1.5 rounded-full text-xs border border-white/10">
                        {cls.categoryName || cls.type}
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                        <p className="text-muted-foreground font-medium text-sm">{cls.branchName || cls.gym}</p>
                      </div>
                      
                      <div className="space-y-3 mb-6 mt-auto">
                        <div className="flex flex-col gap-1 text-sm text-gray-300">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground shrink-0" /> 
                            <span className="line-clamp-2">{cls.location}</span>
                          </div>
                        </div>
                        {!gym && cls.startTime && (
                          <div className="flex items-center text-sm text-gray-300">
                             <Calendar className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
                             <span>
                               {new Date(cls.startTime).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                             </span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-300">
                          <Clock className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
                          <span>{timeLabel}: <span className="text-white">{timeValue}</span></span>
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <Clock className="h-4 w-4 mr-3 text-muted-foreground shrink-0 opacity-0" />
                          <span className="text-muted-foreground">Thời lượng: <span className="text-gray-300">{cls.duration}</span></span>
                        </div>
                      </div>

                      <Button
                        className="w-full glow-btn rounded-xl h-11"
                        disabled={!gym && isPastClass}
                        onClick={() => openBookingPicker(cls)}
                      >
                        {!gym && isPastClass ? "Đã hết hạn" : "Đặt chỗ ngay"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
      )}

      {/* Booking Modal Overlay */}
      <AnimatePresence>
        {bookingModal.isOpen && bookingModal.classData && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => !isBooked && !isBookingLoading && closeBookingModal()}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-secondary border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto shadow-2xl relative overscroll-contain"
              >
                {!isBooked ? (
                  <>
                    <button 
                      type="button"
                      className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors p-1 z-10"
                      onClick={closeBookingModal}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {bookingStep === "pick-time" ? (
                      <>
                        <div className="mb-5 pr-8">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-primary" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {isOpenGym(bookingModal.classData) ? "Chọn giờ tập" : "Lịch lớp học"}
                          </h2>
                          <p className="text-muted-foreground text-sm">
                            {bookingModal.classData.name} · {bookingModal.classData.gym}
                          </p>
                          {isOpenGym(bookingModal.classData) && (
                            <p className="text-primary text-sm mt-2 font-medium">
                              Giờ mở cửa: {bookingModal.classData.openHours}
                            </p>
                          )}
                        </div>

                        {isOpenGym(bookingModal.classData) ? (
                          <>
                            {/* Open Gym: Chọn ngày và giờ linh hoạt */}
                            <p className="text-xs text-muted-foreground mb-2">Chọn ngày</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                              {dateTabs.map((tab: DateTab) => (
                                <button
                                  key={tab.dateStr}
                                  type="button"
                                  onClick={() => {
                                    setPickerDateStr(tab.dateStr);
                                    setSelectedSlot(null);
                                  }}
                                  className={cn(
                                    "shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                                    pickerDateStr === tab.dateStr
                                      ? "bg-primary text-white"
                                      : "bg-black/30 text-muted-foreground border border-white/10 hover:text-white"
                                  )}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            <p className="text-xs text-muted-foreground mb-2">Chọn khung giờ (trong giờ mở cửa)</p>
                            <div
                              className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6 max-h-52 overflow-y-auto overscroll-contain p-1"
                              key={`${slotTick}-${pickerDateStr}`}
                            >
                              {hourSlotsForPicker.map((timeHm) => {
                                const cls = bookingModal.classData!;
                                const isPast = isSlotInPast(pickerDateStr, timeHm);
                                const rem = getSlotRemaining(cls.id, pickerDateStr, timeHm);
                                const isFull = !isPast && rem <= 0;
                                const disabled = isPast || isFull;
                                const isSelected =
                                  selectedSlot?.dateStr === pickerDateStr && selectedSlot?.timeHm === timeHm;
                                return (
                                  <button
                                    key={timeHm}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      setSelectedSlot({
                                        dateStr: pickerDateStr,
                                        timeHm,
                                        label: slotLabelForDate(pickerDateStr, timeHm, dateTabs),
                                      });
                                    }}
                                    className={cn(
                                      "py-2.5 px-1 rounded-xl text-sm font-medium border transition-colors",
                                      disabled &&
                                        "border-white/5 bg-white/5 text-muted-foreground cursor-not-allowed opacity-60",
                                      !disabled &&
                                        isSelected &&
                                        "border-primary bg-primary/20 text-primary",
                                      !disabled &&
                                        !isSelected &&
                                        "border-white/10 bg-black/30 text-white hover:border-primary/50"
                                    )}
                                  >
                                    {isPast ? (
                                      <span className="block text-[10px] leading-tight">Đã qua</span>
                                    ) : isFull ? (
                                      <span className="block text-[10px] leading-tight">Hết slot</span>
                                    ) : (
                                      timeHm
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Class cố định: Chỉ hiển thị 1 slot */}
                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5 mb-6 space-y-3">
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground shrink-0">Ngày học</span>
                                <span className="text-white font-medium text-right">
                                  {bookingModal.classData.startTime
                                    ? new Date(bookingModal.classData.startTime).toLocaleDateString("vi-VN", { 
                                        weekday: "long", 
                                        day: "2-digit", 
                                        month: "2-digit", 
                                        year: "numeric" 
                                      })
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground shrink-0">Giờ học</span>
                                <span className="text-primary font-bold text-right">
                                  {bookingModal.classData.startTime && bookingModal.classData.endTime
                                    ? `${formatTime(bookingModal.classData.startTime)} - ${formatTime(bookingModal.classData.endTime)}`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground shrink-0">Thời lượng</span>
                                <span className="text-white font-medium text-right">{bookingModal.classData.duration}</span>
                              </div>
                              <div className="h-px bg-white/5 my-2 w-full" />
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Trạng thái</span>
                                <span className="text-green-400 font-bold">Còn chỗ</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mb-4">
                              Lớp học có giờ cố định. Nhấn "Tiếp tục" để xác nhận đặt chỗ.
                            </p>
                          </>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 border border-white/10 hover:bg-white/5"
                            onClick={closeBookingModal}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 glow-btn"
                            disabled={isOpenGym(bookingModal.classData) && !selectedSlot}
                            onClick={() => {
                              // Nếu là class cố định, tự động set selectedSlot
                              const targetClass = bookingModal.classData!;
                              if (!isOpenGym(targetClass)) {
                                const targetStart = targetClass.startTime;
                                if (targetStart) {
                                  const startDate = new Date(targetStart);
                                  const dateStr = startDate.toISOString().split('T')[0];
                                  const timeHm = formatTime(targetStart);
                                  setSelectedSlot({
                                    dateStr,
                                    timeHm,
                                    label: `${startDate.toLocaleDateString("vi-VN", { 
                                      day: "2-digit", 
                                      month: "2-digit" 
                                    })}, ${timeHm}`
                                  });
                                }
                              }
                              setBookingStep("confirm");
                            }}
                          >
                            Tiếp tục
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-6 pr-8">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-1">Xác nhận đặt chỗ</h2>
                          <p className="text-muted-foreground">Vui lòng kiểm tra lại thông tin lớp học.</p>
                        </div>

                        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 mb-6 space-y-3">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground shrink-0">Lớp học</span>
                            <span className="text-white font-medium text-right">{bookingModal.classData.name}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground shrink-0">Địa điểm</span>
                            <span className="text-white font-medium text-right">{bookingModal.classData.gym}</span>
                          </div>
                          {isOpenGym(bookingModal.classData) && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-muted-foreground shrink-0">Giờ mở cửa</span>
                              <span className="text-white/80 text-sm text-right">{bookingModal.classData.openHours}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground shrink-0">Giờ đã chọn</span>
                            <span className="text-primary font-bold text-right">{selectedSlot?.label}</span>
                          </div>
                          <div className="h-px bg-white/5 my-2 w-full" />
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Chi phí</span>
                            <span className="text-primary font-bold">{bookingModal.classData.credits} Credit</span>
                          </div>
                        </div>

                        {/* Error Display */}
                        {bookingError && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4"
                          >
                            <p className="text-red-400 text-sm text-center">{bookingError}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 border border-white/10 hover:bg-white/5"
                            onClick={() => {
                              setBookingStep("pick-time");
                              setBookingError(null);
                            }}
                            disabled={isBookingLoading}
                          >
                            Quay lại
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 glow-btn"
                            onClick={handleBook}
                            disabled={isBookingLoading || !selectedSlot}
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

                        {/* Buy Credit Button - Show when insufficient credits */}
                        {bookingError && bookingError.toLowerCase().includes("credit") && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => {
                              closeBookingModal();
                              navigate("/membership");
                            }}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Mua thêm credit
                          </Button>
                        )}
                      </>
                    )}
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
