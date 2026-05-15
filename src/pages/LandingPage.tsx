import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Home, Search, CalendarDays, ShoppingBag, 
  ShoppingCart, Crown, LayoutGrid, LogIn,
  Zap, ShieldCheck, Clock, ArrowRight,
  Dumbbell, Star, MapPin, User, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const LOCATIONS = [
  { 
    name: "FLEXFIT Gym Quận 1", 
    location: "TP.HCM", 
    rating: 4.8, 
    credits: 15,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    name: "PowerHouse Gym", 
    location: "TP.HCM", 
    rating: 4.6, 
    credits: 15,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    name: "Iron Paradise", 
    location: "TP.HCM", 
    rating: 4.9, 
    credits: 15,
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop"
  },
];

const PRODUCTS = [
  { 
    name: "Áo Tank Top Gym Pro", 
    rating: 4.7, 
    price: "299.000đ", 
    oldPrice: "399.000đ", 
    discount: "-25%",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1374&auto=format&fit=crop"
  },
  { 
    name: "Quần Short Thể Thao", 
    rating: 4.5, 
    price: "349.000đ", 
    oldPrice: "400.000đ", 
    discount: "-12%",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    name: "Áo Compression Dài Tay", 
    rating: 4.8, 
    price: "450.000đ", 
    oldPrice: "550.000đ", 
    discount: "-18%",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1430&auto=format&fit=crop"
  },
  { 
    name: "Giày Chạy Bộ UltraFlex", 
    rating: 4.9, 
    price: "1.290.000đ", 
    oldPrice: "1.590.000đ", 
    discount: "-19%",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop"
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function LandingPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">
      
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white transition-transform group-hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
              FF
            </div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase group-hover:text-primary transition-colors">
              FLEXFIT
            </span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
            <Link to="/explore" className="flex items-center gap-2 hover:text-white transition-colors">
              <Search className="w-4 h-4" /> Khám phá
            </Link>
            <Link to="/bookings" className="flex items-center gap-2 hover:text-white transition-colors">
              <CalendarDays className="w-4 h-4" /> Lịch đã đặt
            </Link>
            <Link to="/explore" className="flex items-center gap-2 hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" /> Cửa hàng
            </Link>
            <Link to="/membership" className="flex items-center gap-2 hover:text-white transition-colors">
              <Crown className="w-4 h-4" /> Thành viên
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors">
              <LayoutGrid className="w-4 h-4" /> Dashboard
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-muted-foreground border-r border-white/10 pr-4">
              <div className="relative group cursor-pointer">
                <ShoppingCart className="w-5 h-5 group-hover:text-white transition-colors" />
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-white">45 Credits</span>
                  <span className="text-xs text-primary">Pro Member</span>
                </div>
                <div className="relative">
                  <div 
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-[2px] cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                      AL
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 bg-secondary/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                      >
                        <Link to="/profile" className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">
                          <User className="w-4 h-4" />
                          <span>Hồ sơ cá nhân</span>
                        </Link>
                        <Link to="/dashboard" className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">
                          <LayoutGrid className="w-4 h-4" />
                          <span>Bảng điều khiển</span>
                        </Link>
                        <div className="h-px bg-white/10 my-1 w-full" />
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 gap-2 border border-primary/20 transition-all hover:scale-105">
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        
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

          <div className="relative z-10 w-full container mx-auto px-4">
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
                Tập luyện – Đặt sân <br />
                <span className="text-primary">Mua đồ tập</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed"
              >
                Tất cả trong một. Trải nghiệm hệ sinh thái thể thao thông minh, đặt sân dễ dàng và sắm đồ chính hãng chỉ với một tài khoản duy nhất.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full rounded-full px-8 h-14 text-base font-semibold glow-btn">
                    Bắt đầu ngay <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full px-8 h-14 text-base font-semibold border-white/20 text-white hover:bg-white/10 glass transition-all">
                    <ShoppingBag className="w-5 h-5 mr-2" /> Cửa hàng
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background relative -mt-16 z-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Đặt chỗ tức thì", desc: "Hệ thống AI xử lý đặt chỗ chỉ trong 30 giây", icon: Zap },
                { title: "Bảo đảm chất lượng", desc: "100% đối tác được xác minh tiêu chuẩn", icon: ShieldCheck },
                { title: "Linh hoạt giờ giấc", desc: "Quản lý, đặt và huỷ lịch dễ dàng 24/7", icon: Clock },
                { title: "Mua sắm tiện lợi", desc: "Giao hàng hỏa tốc đồ tập chính hãng", icon: ShoppingBag }
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
                  className="bg-secondary/50 backdrop-blur-lg rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center shadow-2xl hover:bg-secondary hover:border-white/10 transition-all duration-300 group"
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
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-white mb-8"
            >
              Khám phá theo loại hình
            </motion.h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {CATEGORIES.map((cat, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-secondary rounded-2xl p-6 border border-white/5 min-w-[160px] flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer shrink-0 group"
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
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Địa điểm nổi bật</h2>
              <Link to="/explore" className="text-sm font-semibold text-primary hover:text-white transition-colors flex items-center group">
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {LOCATIONS.map((loc, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                >
                  <Card className="bg-secondary border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 group cursor-pointer">
                    <div className="h-56 relative overflow-hidden">
                      <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent opacity-80" />
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10">
                        <Dumbbell className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-white font-medium">Phòng Gym</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{loc.name}</h3>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="w-4 h-4 mr-1.5" /> {loc.location}
                        </div>
                        <div className="flex items-center text-sm font-medium text-white bg-white/5 px-2 py-1 rounded-md">
                          <Star className="w-4 h-4 text-primary fill-primary mr-1.5" /> {loc.rating}
                        </div>
                      </div>
                      <div className="mt-5 pt-5 border-t border-white/5">
                        <span className="text-primary font-bold text-lg">{loc.credits} <span className="text-sm font-normal text-muted-foreground">credit/buổi</span></span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 mb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Sản phẩm nổi bật</h2>
              <Link to="/explore" className="text-sm font-semibold text-primary hover:text-white transition-colors flex items-center group">
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {PRODUCTS.map((prod, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                >
                  <Card className="bg-secondary border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col group cursor-pointer h-full">
                    <div className="h-64 relative overflow-hidden bg-white/5 p-6 flex items-center justify-center">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-2.5 py-1.5 rounded-md shadow-lg">
                        {prod.discount}
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">{prod.name}</h3>
                      <div className="flex items-center text-sm font-medium text-muted-foreground mb-4">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary mr-1" /> {prod.rating}
                      </div>
                      <div className="mt-auto flex items-center gap-3">
                        <span className="text-primary font-bold text-lg">{prod.price}</span>
                        <span className="text-sm text-muted-foreground line-through">{prod.oldPrice}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/5 bg-secondary pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-sm">FF</div>
                <span className="font-bold text-xl text-white uppercase tracking-tighter">FLEXFIT</span>
              </Link>
              <p className="text-muted-foreground max-w-sm">
                Nền tảng thể thao kết nối hàng ngàn phòng gym và studio trên toàn quốc. Tập luyện mọi lúc, mọi nơi chỉ với một tài khoản.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Khám phá</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link to="/explore" className="hover:text-primary transition-colors">Phòng Gym</Link></li>
                <li><Link to="/explore" className="hover:text-primary transition-colors">Yoga Studio</Link></li>
                <li><Link to="/explore" className="hover:text-primary transition-colors">Sản phẩm</Link></li>
                <li><Link to="/membership" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
            <p>© 2026 FlexFit Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
