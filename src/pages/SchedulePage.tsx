import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dates = [12, 13, 14, 15, 16, 17, 18];
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Lịch Tập</h1>
          <p className="text-muted-foreground">Theo dõi và sắp xếp lịch trình thể thao của bạn.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg border border-white/5">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Tháng</Button>
          <Button size="sm" className="bg-primary text-white shadow-sm">Tuần</Button>
        </div>
      </div>

      <Card className="bg-secondary border-white/5 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Tháng 5, 2026</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="w-8 h-8 border-white/10 text-white hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">Hôm nay</Button>
            <Button variant="outline" size="icon" className="w-8 h-8 border-white/10 text-white hover:bg-white/5"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Weekly View */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
          {days.map((day, i) => (
            <div key={day} className={`p-3 flex flex-col items-center justify-center border-r border-white/5 last:border-0 ${i === 4 ? 'bg-primary/10' : ''}`}>
              <span className={`text-xs font-medium mb-1 ${i === 4 ? 'text-primary' : 'text-muted-foreground'}`}>{day}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 4 ? 'bg-primary text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-white'}`}>
                {dates[i]}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid (Mockup) */}
        <div className="relative h-[600px] overflow-y-auto custom-scrollbar bg-secondary/30">
          <div className="absolute top-0 left-0 w-16 h-full border-r border-white/5 bg-secondary/50 flex flex-col">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 border-b border-white/5 flex items-start justify-center pt-2">
                <span className="text-xs text-muted-foreground">{i + 8}:00</span>
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="ml-16 relative h-full">
            {/* Background Grid Lines */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute w-full border-b border-white/5 h-[50px]" style={{ top: `${i * 50}px` }} />
            ))}

            {/* Event 1 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute left-[57%] w-[13%] bg-primary/20 border-l-2 border-primary p-2 rounded-r-md cursor-pointer hover:bg-primary/30 transition-colors"
              style={{ top: '50px', height: '50px' }} // 09:00 - 10:00 on T5 (index 4)
            >
              <p className="text-xs font-bold text-white truncate">Pilates</p>
              <p className="text-[10px] text-primary truncate">09:00 - 10:00</p>
            </motion.div>

            {/* Event 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="absolute left-[57%] w-[13%] bg-blue-500/20 border-l-2 border-blue-500 p-2 rounded-r-md cursor-pointer hover:bg-blue-500/30 transition-colors"
              style={{ top: '500px', height: '50px' }} // 18:00 - 19:00 on T5 (index 4)
            >
              <p className="text-xs font-bold text-white truncate">Yoga Flow</p>
              <p className="text-[10px] text-blue-400 truncate">18:00 - 19:00</p>
            </motion.div>

            {/* Event 3 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="absolute left-[85%] w-[13%] bg-purple-500/20 border-l-2 border-purple-500 p-2 rounded-r-md cursor-pointer hover:bg-purple-500/30 transition-colors"
              style={{ top: '450px', height: '75px' }} // 17:00 - 18:30 on T7 (index 6)
            >
              <p className="text-xs font-bold text-white truncate">Boxing</p>
              <p className="text-[10px] text-purple-400 truncate">17:00 - 18:30</p>
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
}
