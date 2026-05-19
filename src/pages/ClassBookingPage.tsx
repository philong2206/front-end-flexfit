import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Star, Calendar, Info, Users, Filter, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { bookGymSessionApi } from "@/api/bookings";
import { deductCreditsLocally } from "@/api/creditPackages";
import { getAllBranchesApi } from "@/api/branches";

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
}

const CLASS_TEMPLATES = [
  { name: "Yoga Flow Cơ bản", trainer: "HLV. Mai Anh", credits: 3, slots: 5, totalSlots: 20, type: "Yoga", time: "18:00 - 19:00", image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1470&auto=format&fit=crop" },
  { name: "HIIT Đốt mỡ", trainer: "HLV. Đức Dũng", credits: 4, slots: 2, totalSlots: 15, type: "Cardio", time: "19:30 - 20:30", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop" },
  { name: "Boxing Nhập môn", trainer: "HLV. Thanh Tùng", credits: 5, slots: 8, totalSlots: 10, type: "Boxing", time: "17:00 - 18:30", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1374&auto=format&fit=crop" },
  { name: "Pilates Reformer", trainer: "HLV. Linh Chi", credits: 6, slots: 8, totalSlots: 10, type: "Pilates", time: "08:00 - 09:00", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1470&auto=format&fit=crop" }
];

export default function ClassBookingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("Hôm nay");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    const loadBranchesAndClasses = async () => {
      try {
        const branchList = await getAllBranchesApi();
        
        const generated: ClassItem[] = [];
        branchList.forEach((branch) => {
          CLASS_TEMPLATES.forEach((template, index) => {
            generated.push({
              id: `${branch.branchId}-${index}`,
              name: template.name,
              gym: branch.branchName,
              branchId: branch.branchId,
              time: template.time,
              trainer: template.trainer,
              credits: template.credits,
              slots: template.slots,
              totalSlots: template.totalSlots,
              type: template.type,
              image: template.image
            });
          });
        });
        setClasses(generated);
      } catch (err) {
        console.error("Failed to load branches and classes", err);
      }
    };
    loadBranchesAndClasses();
  }, []);

  const parseMockTime = (dateStr: string, timeStr: string) => {
    const now = new Date();
    const targetDate = new Date(now);
    
    if (dateStr.includes("Hôm nay")) {
      // Keep today
    } else if (dateStr.includes("Ngày mai")) {
      targetDate.setDate(now.getDate() + 1);
    } else {
      // Parse e.g. "T5, 16/05"
      const dateMatch = dateStr.match(/(\d{2})\/(\d{2})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        targetDate.setDate(day);
        targetDate.setMonth(month);
      } else {
        targetDate.setDate(now.getDate() + 1);
      }
    }
    
    // Parse time range: e.g. "18:00 - 19:00"
    const [startPart, endPart] = timeStr.split(" - ");
    const [startHour, startMinute] = startPart.split(":").map(Number);
    const [endHour, endMinute] = endPart.split(":").map(Number);
    
    const startDate = new Date(targetDate);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    return {
      startTimeStr: startDate.toISOString(),
      endTimeStr: endDate.toISOString()
    };
  };

  const handleBookClick = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsBooked(false);
    setShowBookingModal(true);
  };

  const handleBook = async () => {
    if (!user?.userId) {
      alert("Vui lòng đăng nhập với tài khoản Hội viên để thực hiện đặt chỗ.");
      return;
    }
    if (!selectedClass) return;

    try {
      setIsBookingLoading(true);
      
      const { startTimeStr, endTimeStr } = parseMockTime(selectedDate, selectedClass.time);

      await bookGymSessionApi({
        branchId: selectedClass.branchId,
        sessionName: selectedClass.name,
        startTime: startTimeStr,
        endTime: endTimeStr
      });

      // Deduct credit locally
      deductCreditsLocally(user.userId, selectedClass.credits);

      setIsBooked(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setIsBooked(false);
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đặt lịch thất bại");
    } finally {
      setIsBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Đặt Lớp Học</h1>
          <p className="text-muted-foreground text-lg">Khám phá và tham gia các lớp học sôi động.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto bg-secondary/50 p-2 rounded-2xl border border-white/5">
          {["Hôm nay", "Ngày mai", "T5, 16/05", "T6, 17/05"].map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedDate === date ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {date}
            </button>
          ))}
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Calendar className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm lớp học, HLV, phòng tập..." 
            className="pl-10 bg-secondary/50 border-white/10 h-12 rounded-xl focus-visible:ring-primary text-white"
          />
        </div>
        <Button className="h-12 px-6 bg-secondary/50 hover:bg-secondary border border-white/10 text-white rounded-xl gap-2">
          <Filter className="w-4 h-4" /> Lọc
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {["Tất cả", "Yoga", "HIIT", "Boxing", "Pilates", "Cardio", "Zumba", "Đạp xe"].map((type, i) => (
          <Badge 
            key={i} 
            variant={i === 0 ? "default" : "outline"} 
            className={`px-4 py-2 text-sm cursor-pointer whitespace-nowrap ${i === 0 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-transparent text-muted-foreground border-white/10 hover:border-primary/50 hover:text-white'}`}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={cls.id}
          >
            <Card className="bg-secondary/40 border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 group">
              <div className="h-48 relative overflow-hidden">
                <img src={cls.image} alt={cls.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-white">{cls.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-white">{cls.slots > 0 ? `Còn ${cls.slots} chỗ` : 'Hết chỗ'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-white">{cls.trainer}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleBookClick(cls)}
                  disabled={cls.slots === 0}
                  className={`w-full ${cls.slots === 0 ? 'bg-white/5 text-muted-foreground' : 'glow-btn'}`}
                >
                  {cls.slots === 0 ? 'Danh sách chờ' : 'Đặt chỗ ngay'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Booking Modal Overlay */}
      {showBookingModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !isBookingLoading && !isBooked && setShowBookingModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-secondary border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
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
                  
                  <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Thời gian</span>
                      <span className="text-white font-medium">{selectedClass.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2"><Star className="w-4 h-4" /> Huấn luyện viên</span>
                      <span className="text-white font-medium">{selectedClass.trainer}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <span className="text-muted-foreground">Phí đặt chỗ</span>
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
                      onClick={() => setShowBookingModal(false)}
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
