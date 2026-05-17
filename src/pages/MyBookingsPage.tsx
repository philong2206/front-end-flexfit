import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MyBookingsPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Lịch Sử Đặt Chỗ</h1>
        <p className="text-muted-foreground text-lg">Quản lý các buổi tập sắp tới và đã tham gia của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl border border-white/5 w-fit">
        <button className="px-5 py-2 rounded-lg bg-primary text-white font-medium text-sm shadow-sm transition-all">Sắp tới</button>
        <button className="px-5 py-2 rounded-lg text-muted-foreground hover:text-white font-medium text-sm transition-all">Đã hoàn thành</button>
        <button className="px-5 py-2 rounded-lg text-muted-foreground hover:text-white font-medium text-sm transition-all">Đã hủy</button>
      </div>

      {/* Upcoming Booking Card - Main focus */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white mb-4">Buổi tập tiếp theo</h2>
        <Card className="bg-gradient-to-br from-primary/20 to-secondary border-primary/30 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-[50px] -mr-20 -mt-20" />
          <CardContent className="p-0 sm:flex">
            <div className="p-6 sm:p-8 flex-1 relative z-10">
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-3">Yoga Vinyasa</Badge>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Flow & Balance</h3>
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày</p>
                    <p className="font-medium text-white">Hôm nay, 16 Tháng 5</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-medium text-white">18:00 - 19:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Địa điểm</p>
                    <p className="font-medium text-white">Zen Studio, Quận 1</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">Hủy lịch</Button>
                <Button className="glow-btn">Chỉ đường</Button>
              </div>
            </div>
            
            <div className="bg-black/40 sm:w-72 p-6 sm:p-8 flex flex-col items-center justify-center border-l border-white/5">
              <p className="text-sm text-muted-foreground mb-4 text-center">Đưa mã QR này cho lễ tân để check-in</p>
              <div className="bg-white p-4 rounded-xl shadow-lg relative group">
                <QrCode className="w-32 h-32 text-black" />
                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer">
                  <span className="text-black font-bold">Phóng to</span>
                </div>
              </div>
              <p className="text-xs text-primary mt-4 font-mono">ID: BKG-29481A</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List of other bookings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4">Các buổi tập khác</h2>
        <div className="space-y-4">
          {[
            { id: 1, name: "HIIT Đốt mỡ", gym: "PowerHouse Gym", date: "T6, 17/05", time: "19:30", type: "Cardio", status: "upcoming" },
            { id: 2, name: "Boxing Nhập môn", gym: "Iron Paradise", date: "T7, 18/05", time: "17:00", type: "Boxing", status: "upcoming" },
          ].map((booking) => (
            <Card key={booking.id} className="bg-secondary/40 border-white/5 hover:bg-secondary/60 transition-colors">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20 shrink-0">
                    <span className="text-xs text-primary font-medium">T6</span>
                    <span className="text-lg font-bold text-white">17</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{booking.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.gym}</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10">{booking.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-white/10 hover:bg-white/5">Chi tiết</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
