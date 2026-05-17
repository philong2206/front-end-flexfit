import { motion } from "framer-motion";
import { CreditCard, Calendar, TrendingUp, Sparkles, Clock, MapPin, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const activityData = [
  { name: "T2", duration: 45 },
  { name: "T3", duration: 0 },
  { name: "T4", duration: 60 },
  { name: "T5", duration: 30 },
  { name: "T6", duration: 90 },
  { name: "T7", duration: 45 },
  { name: "CN", duration: 120 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const nameParts = user?.fullName?.split(' ') || [];
  const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "bạn";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-lg font-medium text-primary">Credit hiện có</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-white">45</div>
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
              <CardTitle className="text-lg font-medium text-gray-300">Số phút hoạt động</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">390</div>
              <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +15% so với tuần trước
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-300">Lớp đã tham gia</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">12</div>
              <p className="text-sm text-muted-foreground mt-1">Trong tháng này</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="h-full bg-secondary border-white/5">
            <CardHeader>
              <CardTitle>Tổng quan hoạt động</CardTitle>
              <CardDescription>Thời gian tập luyện trong 7 ngày qua.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorDuration)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full bg-secondary border-white/5 flex flex-col">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle>Lịch trình sắp tới</CardTitle>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="space-y-6">
                {[
                  { name: "HIIT Performance", time: "Hôm nay, 18:00", gym: "FLEXFIT Quận 1", type: "HIIT", isNext: true },
                  { name: "Yoga Vinyasa", time: "Ngày mai, 07:00", gym: "Zen Studio", type: "Yoga", isNext: false },
                  { name: "Boxing Basics", time: "Thứ 6, 18:30", gym: "Iron Paradise", type: "Boxing", isNext: false }
                ].map((item, i) => (
                  <div key={i} className="relative pl-6 border-l border-white/10 last:border-transparent pb-1">
                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${item.isNext ? 'bg-primary shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-white/20'}`} />
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`font-semibold ${item.isNext ? 'text-white' : 'text-gray-300'}`}>{item.name}</span>
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.gym}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary hover:bg-primary/10">
                Xem toàn bộ lịch
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Gợi ý cho bạn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Phục hồi Yoga", gym: "Zen Studio", time: "T7, 8:00 Sáng", credits: 3 },
            { name: "Crossfit Nâng cao", gym: "Iron Core", time: "CN, 5:00 Chiều", credits: 5 },
            { name: "Cycling Sprint", gym: "Velocity", time: "T2, 9:00 Sáng", credits: 4 },
          ].map((rec, i) => (
            <Card key={i} className="bg-black/40 border-white/5 hover:border-primary/30 transition-colors group cursor-pointer">
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
