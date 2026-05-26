/* eslint-disable no-useless-assignment */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Star, Info, Users, Loader2, CheckCircle, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { bookClassApi, getMyGymBookingsApi, getMyClassBookingsApi } from "@/api/bookings";
import { getAllClassesApi } from "@/api/classes";
import { toast } from "sonner";
import { isClassStartInPast } from "@/lib/gymTimeSlots";
import { isInsufficientCreditsError, normalizeApiError } from "@/lib/normalizeApiError";

const SESSION_SLOT_REMAINING_KEY = "flexfit_class_slot_remaining";

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Ví dụ: "Hôm nay, 18:00" — chỉ FE, không gọi BE */
function formatClassCalendarLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const t = new Date();
  const dayDiff = Math.round((startOfDayMs(d) - startOfDayMs(t)) / 86400000);
  const hm = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (dayDiff === 0) return `Hôm nay, ${hm}`;
  if (dayDiff === 1) return `Ngày mai, ${hm}`;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${days[d.getDay()]}, ${dd}/${mm}, ${hm}`;
}

function readStoredSlotRemaining(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SESSION_SLOT_REMAINING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function writeStoredSlotRemaining(next: Record<string, number>) {
  sessionStorage.setItem(SESSION_SLOT_REMAINING_KEY, JSON.stringify(next));
}

interface ClassItem {
  id: string;
  name: string;
  gym: string;
  branchId: string;
  time: string;
  trainer: string;
  credits: number;
  slots: number;
  totalSlots: number;
  type: string;
  image: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationMins: number;
}

interface DateTab {
  label: string;
  dateStr: string; // YYYY-MM-DD
}

export default function ClassBookingPage() {
  const { user } = useAuth();
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [dateTabs, setDateTabs] = useState<DateTab[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [remainingByClassId, setRemainingByClassId] = useState<Record<string, number>>({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Generate dynamic date tabs for the next 7 days
  useEffect(() => {
    const tabs: DateTab[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      let label = "";
      if (i === 0) label = "Hôm nay";
      else if (i === 1) label = "Ngày mai";
      else {
        const dayOfWeek = d.getDay();
        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        label = `${days[dayOfWeek]}, ${dd}/${mm}`;
      }
      tabs.push({ label, dateStr });
    }
    setDateTabs(tabs);
    if (tabs.length > 0) {
      setSelectedDateStr(tabs[0].dateStr);
    }
  }, []);

  // Fetch real classes from backend (cache + hủy khi unmount / StrictMode)
  useEffect(() => {
    const ac = new AbortController();
    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const classList = await getAllClassesApi();
        if (ac.signal.aborted) return;
        const mapped: ClassItem[] = classList.map((cls) => {
          const start = new Date(cls.startTime);
          const end = new Date(cls.endTime);
          const startStr = start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
          const endStr = end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
          const durationMins = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
          
          return {
            id: cls.classId,
            name: cls.className,
            gym: cls.branchName,
            branchId: cls.branchId,
            time: `${startStr} - ${endStr}`,
            trainer: cls.coachName || "HLV chuyên nghiệp",
            credits: cls.creditCost,
            slots: cls.capacity,
            totalSlots: cls.capacity,
            type: cls.categoryName,
            image: cls.thumbnailUrl || "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1470&auto=format&fit=crop",
            startTime: cls.startTime,
            endTime: cls.endTime,
            durationMins,
          };
        });
        setClasses(mapped);
        const stored = readStoredSlotRemaining();
        const remaining: Record<string, number> = {};
        for (const c of mapped) {
          const s = stored[c.id];
          remaining[c.id] = s !== undefined ? Math.min(c.totalSlots, Math.max(0, s)) : c.totalSlots;
        }
        setRemainingByClassId(remaining);
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error("Failed to load classes", err);
        toast.error("Không thể tải danh sách lớp học.");
      } finally {
        if (!ac.signal.aborted) setIsLoadingClasses(false);
      }
    };
    loadClasses();
    return () => ac.abort();
  }, []);

  const getRemaining = useCallback(
    (classId: string, fallbackTotal: number) => remainingByClassId[classId] ?? fallbackTotal,
    [remainingByClassId]
  );

  const slotOptions = useMemo(() => {
    if (!selectedClass) return [];
    return classes
      .filter((c) => c.name === selectedClass.name && c.branchId === selectedClass.branchId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [classes, selectedClass]);

  const handleBookClick = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsBooked(false);
    setSlotPickerOpen(true);
    setShowBookingModal(true);
  };

  const handleBook = async () => {
    if (!user?.userId) {
      toast.error("Vui lòng đăng nhập với tài khoản Hội viên để thực hiện đặt chỗ.");
      return;
    }
    if (!selectedClass) return;

    if (isClassStartInPast(selectedClass.startTime)) {
      toast.error("Ca này đã qua giờ. Vui lòng chọn khung giờ khác.");
      return;
    }

    const rem = getRemaining(selectedClass.id, selectedClass.totalSlots);
    if (rem <= 0) {
      toast.error("Ca này đã hết slot. Vui lòng chọn ngày giờ khác.");
      return;
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

      const newStart = new Date(selectedClass.startTime);
      const newEnd = new Date(selectedClass.endTime);

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
        toast.error("Bạn đã có một lịch đặt chỗ khác trùng ngày, trùng giờ với lớp học này. Vui lòng chọn khung giờ hoặc lớp học khác!");
        return;
      }

      // Book Class using the real class id
      await bookClassApi({
        classId: selectedClass.id
      });

      window.dispatchEvent(new Event("wallet-update"));

      setRemainingByClassId((prev) => {
        const cur = prev[selectedClass.id] ?? selectedClass.totalSlots;
        const nextVal = Math.max(0, cur - 1);
        const next = { ...prev, [selectedClass.id]: nextVal };
        writeStoredSlotRemaining(next);
        return next;
      });

      setIsBooked(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setIsBooked(false);
      }, 2000);
    } catch (err) {
      const errorMessage = normalizeApiError(err);
      if (isInsufficientCreditsError(err)) {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsBookingLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return classes.filter((cls) => {
      const classDateStr = cls.startTime.split("T")[0];
      const matchesDate = classDateStr === selectedDateStr;
      const matchesCategory =
        selectedCategory === "Tất cả" || cls.type.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        query === "" ||
        cls.name.toLowerCase().includes(query) ||
        cls.trainer.toLowerCase().includes(query) ||
        cls.gym.toLowerCase().includes(query);
      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [classes, selectedDateStr, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Đặt Lớp Học</h1>
          <p className="text-muted-foreground text-lg">Khám phá và tham gia các lớp học sôi động.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto bg-secondary/50 p-2 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
          {dateTabs.map((tab) => (
            <button
              key={tab.dateStr}
              onClick={() => setSelectedDateStr(tab.dateStr)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDateStr === tab.dateStr ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm lớp học, HLV, phòng tập..." 
            className="pl-10 bg-secondary/50 border-white/10 h-12 rounded-xl focus-visible:ring-primary text-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {["Tất cả", "Yoga", "HIIT", "Boxing", "Pilates", "Crossfit", "Dance", "Kickboxing", "Zumba"].map((type) => (
          <Badge 
            key={type} 
            variant={selectedCategory === type ? "default" : "outline"} 
            onClick={() => setSelectedCategory(type)}
            className={`px-4 py-2 text-sm cursor-pointer whitespace-nowrap ${selectedCategory === type ? 'bg-primary text-white hover:bg-primary/90' : 'bg-transparent text-muted-foreground border-white/10 hover:border-primary/50 hover:text-white'}`}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* Classes Grid */}
      {isLoadingClasses ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p>Đang tải danh sách lớp học...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-20 bg-secondary/20 border border-white/5 rounded-3xl">
          <p className="text-muted-foreground text-lg">Không tìm thấy lớp học nào cho ngày đã chọn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={cls.id}
            >
              <Card className="bg-secondary/40 border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 group">
                <div className="h-48 relative overflow-hidden">
                  <img src={cls.image} alt={cls.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/50 backdrop-blur-md text-white border-none">{cls.type}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-primary border-primary/30">
                      {cls.credits} Credits
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{cls.name}</h3>
                      <p className="text-sm text-gray-300 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {cls.gym}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-white/90 leading-snug">{cls.gym}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookClick(cls)}
                    className="flex w-full items-center gap-2 text-sm text-left rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 hover:border-primary/40 hover:bg-white/5 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-white font-medium flex-1 min-w-0">
                      {formatClassCalendarLabel(cls.startTime)}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-white">{cls.durationMins} phút</span>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {getRemaining(cls.id, cls.totalSlots) > 0
                        ? `Còn ${getRemaining(cls.id, cls.totalSlots)} slot`
                        : "Hết slot"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-white/5">
                    <Star className="w-4 h-4 text-primary fill-primary shrink-0" />
                    <span className="text-white truncate">{cls.trainer}</span>
                  </div>
                  <Button
                    onClick={() => handleBookClick(cls)}
                    disabled={
                      isClassStartInPast(cls.startTime) || getRemaining(cls.id, cls.totalSlots) <= 0
                    }
                    className={`w-full mt-1 ${
                      isClassStartInPast(cls.startTime) || getRemaining(cls.id, cls.totalSlots) <= 0
                        ? "bg-white/5 text-muted-foreground"
                        : "glow-btn"
                    }`}
                  >
                    {isClassStartInPast(cls.startTime)
                      ? "Đã qua giờ"
                      : getRemaining(cls.id, cls.totalSlots) <= 0
                        ? "Hết slot"
                        : "Đặt chỗ ngay"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Modal Overlay */}
      {showBookingModal && selectedClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!isBookingLoading && !isBooked) {
              setShowBookingModal(false);
              setSlotPickerOpen(false);
            }
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-secondary border border-white/10 rounded-3xl w-full max-w-md max-h-[min(90vh,640px)] overflow-y-auto overflow-x-hidden shadow-2xl relative overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {!isBooked ? (
              <>
                <div className="h-32 relative">
                  <img src={selectedClass.image} alt={selectedClass.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent" />
                </div>
                <div className="p-6 relative -mt-6">
                  <Badge className="bg-primary text-white mb-2">{selectedClass.type}</Badge>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedClass.name}</h2>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mb-6"><MapPin className="w-4 h-4" /> {selectedClass.gym}</p>
                  
                  <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 mb-4">
                    <button
                      type="button"
                      onClick={() => setSlotPickerOpen((o) => !o)}
                      className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-white/5 p-2 -m-2 transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Ngày & giờ tập</p>
                        <p className="text-white font-medium truncate">
                          {formatClassCalendarLabel(selectedClass.startTime)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedClass.time} · {selectedClass.durationMins} phút</p>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-muted-foreground shrink-0 transition-transform", slotPickerOpen && "rotate-180")} />
                    </button>

                    {slotPickerOpen && (
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30">
                        <p className="text-[11px] text-muted-foreground px-3 py-2 border-b border-white/5 bg-black/20">
                          Chọn ca cùng lớp tại chi nhánh này (cập nhật chỗ trống trên trình duyệt của bạn).
                        </p>
                        <ul className="max-h-52 overflow-y-auto overscroll-contain divide-y divide-white/5">
                          {slotOptions.map((opt) => {
                            const isPast = isClassStartInPast(opt.startTime);
                            const rem = getRemaining(opt.id, opt.totalSlots);
                            const isFull = !isPast && rem <= 0;
                            const disabled = isPast || isFull;
                            const active = opt.id === selectedClass.id;
                            return (
                              <li key={opt.id}>
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => !disabled && setSelectedClass(opt)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-colors",
                                    active && !disabled && "bg-primary/15",
                                    disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/5"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{formatClassCalendarLabel(opt.startTime)}</p>
                                    <p className="text-xs text-muted-foreground">{opt.time}</p>
                                  </div>
                                  {isPast ? (
                                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Đã qua</span>
                                  ) : isFull ? (
                                    <span className="text-xs font-semibold text-red-400 shrink-0">Hết slot</span>
                                  ) : (
                                    <span className="text-xs text-primary shrink-0">Còn {rem}</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm"><Star className="w-4 h-4" /> Huấn luyện viên</span>
                      <span className="text-white font-medium text-sm truncate max-w-[55%]">{selectedClass.trainer}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Phí đặt chỗ</span>
                      <span className="text-primary font-bold text-lg">{selectedClass.credits} Credits</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-6">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/70">Bạn có thể hủy miễn phí trước 12 tiếng. Sau thời gian này, phí hủy sẽ được tính bằng 50% số credit của lớp.</p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/10 hover:bg-white/5" 
                      onClick={() => {
                        setShowBookingModal(false);
                        setSlotPickerOpen(false);
                      }}
                      disabled={isBookingLoading}
                    >
                      Hủy
                    </Button>
                    <Button 
                      className="flex-1 glow-btn" 
                      onClick={handleBook}
                      disabled={
                        isBookingLoading ||
                        isClassStartInPast(selectedClass.startTime) ||
                        getRemaining(selectedClass.id, selectedClass.totalSlots) <= 0
                      }
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
                </div>
              </>
            ) : (
              <div className="p-8 py-12 flex flex-col items-center text-center">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring" }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Đặt chỗ thành công!</h2>
                <p className="text-muted-foreground">Bạn đã đăng ký thành công lớp {selectedClass.name}.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
