import { motion } from "framer-motion";
import { Users, Building2, Activity, ShieldCheck, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";

const platformGrowthData = [
  { name: "T1", users: 4000, partners: 240 },
  { name: "T2", users: 5000, partners: 290 },
  { name: "T3", users: 4800, partners: 320 },
  { name: "T4", users: 6000, partners: 350 },
  { name: "T5", users: 7500, partners: 400 },
  { name: "T6", users: 9200, partners: 480 },
];

const subscriptionData = [
  { name: "Starter", value: 4500, color: "#8884d8" },
  { name: "Pro", value: 3200, color: "#82ca9d" },
  { name: "Elite", value: 1500, color: "#ffc658" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hệ thống Quản trị</h1>
          <p className="text-muted-foreground text-lg">Giám sát toàn bộ hoạt động của nền tảng FLEXFIT.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 glass text-white gap-2">
            <Download className="w-4 h-4" /> Xuất dữ liệu
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <ShieldCheck className="w-4 h-4" /> Xét duyệt đối tác (12)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45,231</div>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +20.1% tháng này
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đối tác Gym</CardTitle>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">480</div>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12 đối tác mới
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lượt đặt chỗ</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">124,500</div>
              <p className="text-xs text-muted-foreground mt-1">Trong 30 ngày qua</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-secondary border-white/5 h-full border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[20px] -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-500">Cần xử lý</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-white">24</div>
              <p className="text-xs text-amber-400/70 mt-1">12 duyệt gym, 12 report</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Biểu đồ tăng trưởng</CardTitle>
              <CardDescription>Số lượng người dùng và đối tác tham gia nền tảng</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area type="monotone" dataKey="users" name="Người dùng" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-secondary border-white/5 h-full">
            <CardHeader>
              <CardTitle className="text-white">Cơ cấu gói thành viên</CardTitle>
              <CardDescription>Tỷ lệ đăng ký các gói</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-2xl font-bold text-white">9.2k</span>
                <span className="block text-[10px] text-muted-foreground uppercase mt-1">Đăng ký</span>
              </div>
              <div className="flex gap-4 mt-4 w-full justify-center">
                {subscriptionData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Đối tác chờ duyệt</CardTitle>
                  <CardDescription>Các phòng gym mới đăng ký tham gia hệ thống</CardDescription>
                </div>
                <Button variant="outline" className="text-xs h-8 border-white/10 text-white">Quản lý duyệt</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg font-medium">Tên cơ sở</th>
                      <th className="px-4 py-3 font-medium">Vị trí</th>
                      <th className="px-4 py-3 font-medium">Quy mô</th>
                      <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
                      <th className="px-4 py-3 font-medium">Giấy phép</th>
                      <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "CityFit Center", location: "Quận 3, TP.HCM", size: "Lớn (>500m2)", date: "15/05/2026", docs: "Đầy đủ" },
                      { name: "Yoga Master", location: "Cầu Giấy, HN", size: "Nhỏ (<200m2)", date: "14/05/2026", docs: "Thiếu PCCC" },
                      { name: "Iron Power Gym", location: "Quận 7, TP.HCM", size: "Vừa", date: "14/05/2026", docs: "Đầy đủ" },
                      { name: "Aqua Swim", location: "Thủ Đức, TP.HCM", size: "Lớn", date: "12/05/2026", docs: "Đầy đủ" },
                    ].map((gym, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">{gym.name}</td>
                        <td className="px-4 py-4">{gym.location}</td>
                        <td className="px-4 py-4">{gym.size}</td>
                        <td className="px-4 py-4">{gym.date}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                            gym.docs === 'Đầy đủ' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {gym.docs}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 mr-2">Duyệt</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">Từ chối</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
