import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Zap, ShieldCheck, Clock, ArrowRight,
  Dumbbell, Star, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllGymsApi, type GymDto } from "@/api/gyms";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { name: "Phòng Gym", count: "10 địa điểm", emoji: "🏋️" },
  { name: "Cầu lông", count: "10 địa điểm", emoji: "🏸" },
  { name: "Tennis", count: "5 địa điểm", emoji: "🎾" },
  { name: "Pickleball", count: "5 địa điểm", emoji: "🏓" },
  { name: "Yoga", count: "3 địa điểm", emoji: "🧘" },
  { name: "Boxing", count: "2 địa điểm", emoji: "🥊" },
  { name: "Bơi lội", count: "3 địa điểm", emoji: "🏊" },
];



const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(true);

  const handleMembershipClick = () => {
    if (isAuthenticated) {
      navigate("/membership");
    } else {
      navigate("/register");
    }
  };

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const data = await getAllGymsApi();
        setGyms(data.slice(0, 6)); // Display top 6
      } catch (error) {
        console.error("Failed to fetch gyms", error);
      } finally {
        setLoadingGyms(false);
      }
    };
    fetchGyms();
  }, []);

  return (
    <div className="w-full flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" 
              alt="Gym Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          </motion.div>

          <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
            <div className="max-w-2xl">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-6 backdrop-blur-md"
              >
                <Zap className="w-4 h-4 text-primary" /> Nền tảng fitness hàng đầu Việt Nam
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight"
              >
                Một tài khoản – <br />
                <span className="text-primary">Hàng trăm phòng tập</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed"
              >
                Tất cả trong một. Trải nghiệm hệ sinh thái thể thao thông minh, đặt lịch linh hoạt chỉ với một tài khoản duy nhất.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={handleMembershipClick}
                  className="w-full sm:w-auto rounded-full px-8 h-14 text-base font-semibold glow-btn"
                >
                  Đăng ký thành viên <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full px-8 h-14 text-base font-semibold border-white/20 text-white hover:bg-white/10 glass transition-all">
                    <MapPin className="w-5 h-5 mr-2" /> Khám phá ngay
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background relative -mt-16 z-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Đặt chỗ tức thì", desc: "Hệ thống AI xử lý đặt chỗ chỉ trong 30 giây", icon: Zap },
                { title: "Bảo đảm chất lượng", desc: "100% đối tác được xác minh tiêu chuẩn", icon: ShieldCheck },
                { title: "Linh hoạt giờ giấc", desc: "Quản lý, đặt và huỷ lịch dễ dàng 24/7", icon: Clock }
              ].map((feature, i) => (
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }
                  }}
                  key={i} 
                  className="bg-secondary/50 backdrop-blur-lg rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center shadow-2xl hover:bg-secondary hover:border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(249,115,22,0.05)] transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl text-white font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-white mb-8"
            >
              Khám phá theo loại hình
            </motion.h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7 md:gap-4 md:overflow-visible md:pb-0">
              {CATEGORIES.map((cat, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-secondary rounded-2xl p-6 border border-white/5 min-w-[140px] md:min-w-0 md:w-full flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer shrink-0 md:shrink group"
                >
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <h3 className="text-white font-semibold text-base mb-1">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.count}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Locations */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Địa điểm nổi bật</h2>
              <Link to="/explore" className="text-sm font-semibold text-primary hover:text-white transition-colors flex items-center group">
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingGyms ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-10">Đang tải địa điểm...</div>
              ) : gyms.length === 0 ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-10">
                  Chưa có phòng tập nào.
                </div>
              ) : (
                gyms.map((loc, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={loc.gymId}
                  >
                    <Card 
                      onClick={() => navigate('/explore', { state: { selectedGymId: loc.gymId } })}
                      className="bg-secondary/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/15 hover:shadow-[0_20px_40px_rgba(249,115,22,0.05)] hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-56 relative overflow-hidden">
                        <img src={loc.thumbnailUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"} alt={loc.gymName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-85" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-2 border border-white/10">
                          <Dumbbell className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs text-white font-semibold">Phòng Gym</span>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{loc.gymName}</h3>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mr-1.5 text-primary" /> TP.HCM
                          </div>
                          <div className="flex items-center text-sm font-medium text-white bg-white/5 px-2.5 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-primary fill-primary mr-1.5" /> {loc.ratingAverage || 5.0}
                          </div>
                        </div>
                        <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-primary font-extrabold text-xl">
                            Từ 10 <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">credits</span>
                          </span>
                          <span className="text-xs font-semibold text-white/80 group-hover:text-primary flex items-center gap-1 transition-colors">
                            Chi tiết <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>



    </div>
  );
}
