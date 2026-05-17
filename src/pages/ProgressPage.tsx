import { motion } from "framer-motion";
import { Flame, Trophy, TrendingUp, Target, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const weightData = [
  { month: "T1", weight: 75 },
  { month: "T2", weight: 74.2 },
  { month: "T3", weight: 73.5 },
  { month: "T4", weight: 72.8 },
  { month: "T5", weight: 71.5 },
];

const caloriesData = [
  { day: "T2", cal: 450 },
  { day: "T3", cal: 0 },
  { day: "T4", cal: 600 },
  { day: "T5", cal: 350 },
  { day: "T6", cal: 800 },
  { day: "T7", cal: 500 },
  { day: "CN", cal: 950 },
];

export default function ProgressPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tiến Độ Thể Chất</h1>
        <p className="text-muted-foreground text-lg">Theo dõi và tự hào về những gì bạn đã đạt được.</p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-secondary/80 border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-colors" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chuỗi ngày tập</p>
                <h3 className="text-3xl font-bold text-white mt-1">12 <span className="text-lg font-normal text-muted-foreground">ngày</span></h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-secondary/80 border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng calo (tuần)</p>
                <h3 className="text-3xl font-bold text-white mt-1">3,650 <span className="text-lg font-normal text-muted-foreground">kcal</span></h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-secondary/80 border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-green-500/20 transition-colors" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/20 text-green-500 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mục tiêu cân nặng</p>
                <h3 className="text-3xl font-bold text-white mt-1">71.5 <span className="text-lg font-normal text-muted-foreground">kg</span></h3>
                <p className="text-xs text-green-400 mt-2">-3.5 kg kể từ T1</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-secondary/80 border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Huy hiệu</p>
                <h3 className="text-3xl font-bold text-white mt-1">8 <span className="text-lg font-normal text-muted-foreground">cái</span></h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Diễn biến cân nặng
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#888" tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Calo tiêu thụ (Tuần này)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caloriesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#888" tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="cal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h2 className="text-xl font-bold text-white mb-4">Huy hiệu đạt được</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { name: "Khởi đầu mới", icon: "🌱", color: "from-green-500/20 to-green-600/20", border: "border-green-500/30" },
            { name: "Chiến binh thép", icon: "⚔️", color: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/30" },
            { name: "Yogi đích thực", icon: "🧘", color: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/30" },
            { name: "Kỷ luật thép", icon: "🔥", color: "from-orange-500/20 to-orange-600/20", border: "border-orange-500/30" },
            { name: "Bất khả chiến bại", icon: "🏆", color: "from-yellow-500/20 to-yellow-600/20", border: "border-yellow-500/30" },
          ].map((badge, i) => (
            <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b ${badge.color} border ${badge.border} hover:-translate-y-1 transition-transform cursor-pointer`}>
              <span className="text-4xl mb-2 filter drop-shadow-md">{badge.icon}</span>
              <span className="text-xs font-semibold text-center text-white">{badge.name}</span>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-white/5 border-dashed">
            <span className="text-2xl mb-2 text-muted-foreground opacity-50">🔒</span>
            <span className="text-xs font-medium text-center text-muted-foreground">Còn 12 huy hiệu</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
