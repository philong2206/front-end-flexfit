import { motion } from "framer-motion";
import { Users, DollarSign, Calendar as CalendarIcon, TrendingUp, ChevronRight, Activity, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";

const revenueData = [
  { name: "Tháng 1", total: 4500 },
  { name: "Tháng 2", total: 5200 },
  { name: "Tháng 3", total: 4800 },
  { name: "Tháng 4", total: 6100 },
  { name: "Tháng 5", total: 5900 },
  { name: "Tháng 6", total: 7200 },
];

const attendanceData = [
  { time: "06:00", count: 45 },
  { time: "09:00", count: 20 },
  { time: "12:00", count: 15 },
  { time: "15:00", count: 30 },
  { time: "18:00", count: 85 },
  { time: "21:00", count: 40 },
];

export default function PartnerDashboard() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tổng quan cơ sở</h1>
          <p className="text-muted-foreground text-lg">Quản lý hiệu suất kinh doanh của chuỗi FLEXFIT chi nhánh Quận 1.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 glass text-white">Xuất báo cáo</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Tạo lớp học mới</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tháng này</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$24,500</div>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Khách hàng mới</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">+142</div>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +4.1% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lượt đặt chỗ</CardTitle>
              <CalendarIcon className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,240</div>
              <p className="text-xs text-muted-foreground mt-1">Trong 30 ngày qua</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ lấp đầy</CardTitle>
              <Activity className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">86%</div>
              <p className="text-xs text-muted-foreground mt-1">Trung bình các lớp học</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Biểu đồ doanh thu</CardTitle>
              <CardDescription>Doanh thu tính theo USD trong 6 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Mật độ khách đến phòng tập</CardTitle>
              <CardDescription>Lưu lượng khách trung bình theo khung giờ trong ngày</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2">
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Lớp học sắp diễn ra</CardTitle>
                <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">Xem tất cả</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg font-medium">Tên lớp</th>
                      <th className="px-4 py-3 font-medium">Huấn luyện viên</th>
                      <th className="px-4 py-3 font-medium">Thời gian</th>
                      <th className="px-4 py-3 font-medium">Sĩ số</th>
                      <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "HIIT Performance", trainer: "Nguyen Van A", time: "18:00 - 19:00", capacity: "24/25", status: "Gần đầy" },
                      { name: "Yoga Vinyasa", trainer: "Tran Thi B", time: "19:30 - 20:30", capacity: "15/20", status: "Mở" },
                      { name: "Crossfit", trainer: "Le Van C", time: "20:00 - 21:00", capacity: "20/20", status: "Đầy" },
                      { name: "Zumba Dance", trainer: "Pham Thi D", time: "Ngày mai, 07:00", capacity: "10/30", status: "Mở" },
                    ].map((cls, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">{cls.name}</td>
                        <td className="px-4 py-4">{cls.trainer}</td>
                        <td className="px-4 py-4">{cls.time}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span>{cls.capacity}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              cls.status === 'Đầy' ? 'bg-red-500/20 text-red-400' :
                              cls.status === 'Gần đầy' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {cls.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader>
              <CardTitle className="text-white">Chi nhánh hoạt động</CardTitle>
              <CardDescription>Trạng thái các cơ sở hiện tại</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "FLEXFIT Quận 1", address: "Le Loi, Q1", status: "active", members: 1240 },
                  { name: "FLEXFIT Quận 2", address: "Thao Dien, Q2", status: "active", members: 850 },
                  { name: "FLEXFIT Quận 7", address: "Phu My Hung, Q7", status: "maintenance", members: 620 },
                ].map((gym, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20">
                    <div className="flex gap-3 items-center">
                      <div className={`w-2 h-2 rounded-full ${gym.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
                      <div>
                        <h4 className="font-semibold text-white text-sm">{gym.name}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 mr-1" /> {gym.address}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{gym.members}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Hội viên</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white border border-white/10">
                Thêm chi nhánh mới
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
