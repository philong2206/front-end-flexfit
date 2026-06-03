import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllClassesApi, type ClassDto } from "@/api/classes";
import { Loader2, Calendar as CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

export default function StaffSchedulePage() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today">("today");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getAllClassesApi();
        setClasses(data);
      } catch {
        toast.error("Lỗi tải lịch học");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const displayClasses = filter === "today" 
    ? classes.filter(c => c.startTime.startsWith(todayStr)) 
    : classes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Lịch học & Sự kiện</h1>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
          <button 
            onClick={() => setFilter("today")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "today" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
          >
            Hôm nay
          </button>
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "all" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
          >
            Tất cả
          </button>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Danh sách Lớp học</CardTitle>
          <CardDescription>Trạng thái lớp và số lượng hội viên đăng ký</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : displayClasses.length === 0 ? (
            <EmptyState 
               icon={CalendarIcon} 
               title="Chưa có lịch học" 
               description={filter === "today" ? "Không có lớp học nào được xếp lịch trong hôm nay." : "Chưa có lớp học nào trên hệ thống."} 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg font-medium">Lớp học</th>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Chi nhánh</th>
                    <th className="px-4 py-3 font-medium">HLV</th>
                    <th className="px-4 py-3 font-medium text-center">Hội viên</th>
                    <th className="px-4 py-3 rounded-r-lg font-medium text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayClasses.map((cls) => (
                    <tr key={cls.classId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-4">
                         <span className="font-semibold text-white block">{cls.className}</span>
                         <span className="text-xs text-muted-foreground">{cls.categoryName}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block text-white font-medium">{new Date(cls.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(cls.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-xs text-muted-foreground">{new Date(cls.startTime).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-4">{cls.branchName}</td>
                      <td className="px-4 py-4 font-medium text-white">{cls.coachName || "Chưa xếp"}</td>
                      <td className="px-4 py-4 text-center">
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-xs">
                           <Users className="w-3.5 h-3.5 text-primary" />
                           {cls.capacity}
                         </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${cls.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                          {cls.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
