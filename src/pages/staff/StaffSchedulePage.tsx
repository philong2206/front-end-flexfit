import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getClassesForStaffApi, type ClassDto } from "@/api/classes";
import { Loader2, Calendar as CalendarIcon, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

export default function StaffSchedulePage() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await getClassesForStaffApi();
      if (import.meta.env.DEV) {
        console.group("=== STAFF SCHEDULE DEBUG ===");
        console.log("Total classes for this staff's branch:", data.length);
        console.groupEnd();
      }
      setClasses(data);
    } catch {
      toast.error("Lỗi tải lịch học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();

  }, []);

  // FIX: Dùng toLocaleDateString("en-CA") thay vì toISOString() để tránh lệch timezone UTC vs VN
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD theo giờ địa phương VN
  const now = new Date();

  const displayClasses = (() => {
    switch (filter) {
      case "today":
        return classes.filter(c => new Date(c.startTime).toLocaleDateString("en-CA") === todayStr);
      case "upcoming":
        return classes.filter(c => new Date(c.startTime) >= now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      default:
        return [...classes].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Lịch học &amp; Sự kiện</h1>
          <p className="text-muted-foreground text-sm mt-1">Tổng: <span className="text-white font-semibold">{classes.length}</span> lớp | Hiển thị: <span className="text-primary font-semibold">{displayClasses.length}</span> lớp</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClasses}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
            <button 
              onClick={() => setFilter("today")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "today" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
            >
              Hôm nay
            </button>
            <button 
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "upcoming" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
            >
              Sắp diễn ra
            </button>
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "all" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Danh sách Lớp học</CardTitle>
          <CardDescription>
            {filter === "today" && `Ngày hôm nay: ${todayStr}`}
            {filter === "upcoming" && "Các lớp học sắp diễn ra (từ hôm nay trở đi)"}
            {filter === "all" && "Toàn bộ lớp học trên hệ thống, sắp xếp mới nhất trước"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : displayClasses.length === 0 ? (
            <div className="text-center py-10">
              <EmptyState 
                 icon={CalendarIcon} 
                 title="Chưa có lịch học" 
                 description={
                   filter === "today" 
                     ? `Không có lớp học nào ngày ${todayStr}. Thử xem "Tất cả" để kiểm tra dữ liệu.` 
                     : filter === "upcoming"
                     ? "Không có lớp học nào sắp diễn ra."
                     : "Chưa có lớp học nào trên hệ thống."
                 } 
              />
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Xem tất cả lớp học →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg font-medium">Lớp học</th>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Chi nhánh</th>
                    <th className="px-4 py-3 font-medium">HLV</th>
                    <th className="px-4 py-3 font-medium text-center">Sức chứa</th>
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
                        <span className="block text-white font-medium">{new Date(cls.startTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})} - {new Date(cls.endTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-xs text-muted-foreground">{new Date(cls.startTime).toLocaleDateString("vi-VN")}</span>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${cls.status === "Open" || cls.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : cls.status === "Completed" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"}`}>
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
