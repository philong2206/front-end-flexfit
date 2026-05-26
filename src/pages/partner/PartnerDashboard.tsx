import { motion } from "framer-motion";
import { Users, DollarSign, Calendar as CalendarIcon, TrendingUp, Activity, MapPin, Loader2, Trash2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { getAllBranchesApi } from "@/api/branches";
import type { BranchDto } from "@/api/branches";
import { getAllClassesApi, createClassApi, deleteClassApi } from "@/api/classes";
import type { ClassDto } from "@/api/classes";
import { getAllGymsApi } from "@/api/gyms";
import { getPartnerDashboardStats } from "@/services/partnerApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const revenueData: Array<{ name: string; total: number }> = [];
const attendanceData: Array<{ time: string; count: number }> = [];

// Seeded Categories Mapping in DB
const CATEGORY_MAPPING = [
  { name: "Boxing", id: "d210424b-de26-4fb8-afe7-1374f32063dc" },
  { name: "Crossfit", id: "aa7ff679-6857-4f7c-959f-8cb7fde50e71" },
  { name: "Dance", id: "ed8f4d96-f264-4962-a7ff-5279f3bf3f3a" },
  { name: "HIIT", id: "45ad01af-eefe-4a80-bc13-d8ee99cece2b" },
  { name: "Kickboxing", id: "619e7582-a00e-46bb-b710-f42e472112c6" },
  { name: "Pilates", id: "19117d26-6a16-4d35-a5fc-6fd029abda08" },
  { name: "Yoga", id: "f7af0324-45fd-4484-89be-d7b1aacf670a" },
  { name: "Zumba", id: "7da8aef0-1e51-42dd-9c33-6a1f37ea630d" },
];

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<{
    revenue: number;
    newCustomers: number;
    totalBookings: number;
    occupancyRate: number;
    revenueData: Array<{ name: string; total: number }>;
    attendanceData: Array<{ time: string; count: number }>;
  } | null>(null);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Classes States
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  // Creation States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [newBranchId, setNewBranchId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(CATEGORY_MAPPING[0].id);
  const [newClassName, setNewClassName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCoachName, setNewCoachName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newCapacity, setNewCapacity] = useState(20);
  const [newCreditCost, setNewCreditCost] = useState(4);
  const [newDifficultyLevel, setNewDifficultyLevel] = useState("Trung bình");
  const [newCalories, setNewCalories] = useState(500);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");

  const getPartnerBranchesForCurrentUser = async () => {
    if (!user?.userId) return [];
    const [gymList, branchList] = await Promise.all([
      getAllGymsApi(),
      getAllBranchesApi(),
    ]);
    const partnerGymIds = new Set(
      gymList.filter((gym) => gym.ownerId === user.userId).map((gym) => gym.gymId)
    );
    return branchList.filter((branch) => partnerGymIds.has(branch.gymId));
  };

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const data = await getPartnerBranchesForCurrentUser();
      setBranches(data);
      if (data.length > 0) {
        setNewBranchId(data[0].branchId);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi nhánh:", error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const partnerBranches = branches.length > 0 ? branches : await getPartnerBranchesForCurrentUser();
      const partnerBranchIds = new Set(partnerBranches.map((branch) => branch.branchId));
      const data = partnerBranchIds.size > 0
        ? (await getAllClassesApi()).filter((cls) => partnerBranchIds.has(cls.branchId))
        : [];
      // Sort classes by start time ascending
      const sorted = data.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setClasses(sorted);
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp học:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    getPartnerDashboardStats()
      .then((data) => setDashboardStats(data))
      .catch((error) => console.error("Loi khi tai thong ke dashboard:", error));
    fetchBranches();
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const chartRevenueData = dashboardStats?.revenueData?.length ? dashboardStats.revenueData : revenueData;
  const chartAttendanceData = dashboardStats?.attendanceData?.length ? dashboardStats.attendanceData : attendanceData;

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này không?")) return;
    try {
      await deleteClassApi(classId);
      toast.success("Xóa lớp học thành công!");
      fetchClasses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa lớp học thất bại");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchId || !newCategoryId || !newClassName || !newStartDate || !newStartTime || !newEndDate || !newEndTime) {
      toast.error("Vui lòng nhập đầy đủ các trường thông tin bắt buộc.");
      return;
    }
    if (!branches.some((branch) => branch.branchId === newBranchId)) {
      toast.error("Chi nhánh tạo lớp không thuộc đối tác hiện tại.");
      return;
    }

    try {
      setCreating(true);
      
      const startDateTimeStr = `${newStartDate}T${newStartTime}:00`;
      const endDateTimeStr = `${newEndDate}T${newEndTime}:00`;

      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(endDateTimeStr);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast.error("Định dạng thời gian bắt đầu hoặc kết thúc không hợp lệ.");
        return;
      }

      if (endDateTime <= startDateTime) {
        toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
        return;
      }

      await createClassApi({
        branchId: newBranchId,
        categoryId: newCategoryId,
        className: newClassName,
        description: newDescription || undefined,
        coachName: newCoachName || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        capacity: Number(newCapacity),
        creditCost: Number(newCreditCost),
        difficultyLevel: newDifficultyLevel || undefined,
        caloriesBurnEstimate: newCalories ? Number(newCalories) : undefined,
        thumbnailUrl: newThumbnailUrl || undefined
      });

      toast.success("Tạo lớp học mới thành công!");
      setShowCreateModal(false);
      
      // Reset form
      setNewClassName("");
      setNewDescription("");
      setNewCoachName("");
      setNewStartDate("");
      setNewStartTime("");
      setNewEndDate("");
      setNewEndTime("");
      setNewCapacity(20);
      setNewCreditCost(4);
      setNewCalories(500);
      setNewThumbnailUrl("");
      
      fetchClasses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo lớp học thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tổng quan cơ sở</h1>
          <p className="text-muted-foreground text-lg">Quản lý hiệu suất kinh doanh của chuỗi FLEXFIT chi nhánh Quận 1.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 glass text-white">Xuất báo cáo</Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Tạo lớp học mới
          </Button>
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
              <div className="text-2xl font-bold text-white">{dashboardStats?.revenue ?? 0} credits</div>
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
              <div className="text-2xl font-bold text-white">+{dashboardStats?.newCustomers ?? 0}</div>
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
              <div className="text-2xl font-bold text-white">{dashboardStats?.totalBookings ?? 0}</div>
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
              <div className="text-2xl font-bold text-white">{dashboardStats?.occupancyRate ?? 0}%</div>
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
                <BarChart data={chartRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <AreaChart data={chartAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    {loadingClasses ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                          Đang tải danh sách lớp học...
                        </td>
                      </tr>
                    ) : classes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Chưa có lớp học nào được tạo.
                        </td>
                      </tr>
                    ) : classes.map((cls) => {
                      const start = new Date(cls.startTime);
                      const end = new Date(cls.endTime);
                      const dateStr = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                      const timeStr = `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                      
                      return (
                        <tr key={cls.classId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">
                            <div>
                              <div className="font-bold">{cls.className}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{cls.branchName}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">{cls.coachName || "Chưa có"}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-white">{timeStr}</span>
                              <span className="text-xs text-muted-foreground">{dateStr}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span>0/{cls.capacity}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                cls.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {cls.status === 'Cancelled' ? 'Hủy' : 'Hoạt động'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClass(cls.classId)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
                {loadingBranches ? (
                  <p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p>
                ) : branches.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa có chi nhánh nào.</p>
                ) : branches.map((branch) => (
                  <div key={branch.branchId} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20">
                    <div className="flex gap-3 items-center">
                      <div className={`w-2 h-2 rounded-full ${branch.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
                      <div>
                        <h4 className="font-semibold text-white text-sm">{branch.branchName}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 mr-1" /> {branch.address}, {branch.district}, {branch.city}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">0</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Hội viên</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Class Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => !creating && setShowCreateModal(false)}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 bg-black/20">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="text-primary w-6 h-6" /> Tạo lớp học mới</h2>
              <p className="text-muted-foreground text-sm">Điền thông tin chi tiết của lớp học để thêm vào lịch hoạt động.</p>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tên lớp học *</label>
                  <Input 
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="Ví dụ: HIIT Performance"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tên HLV *</label>
                  <Input 
                    value={newCoachName}
                    onChange={e => setNewCoachName(e.target.value)}
                    placeholder="Ví dụ: HLV. Nguyễn Văn A"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Chi nhánh *</label>
                  <select
                    value={newBranchId}
                    onChange={e => setNewBranchId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Phân loại môn học *</label>
                  <select
                    value={newCategoryId}
                    onChange={e => setNewCategoryId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    required
                  >
                    {CATEGORY_MAPPING.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Thời gian bắt đầu *</label>
                  <div className="flex gap-2">
                    <Input 
                      type="date"
                      value={newStartDate}
                      onChange={e => setNewStartDate(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10 [color-scheme:dark]"
                      required
                    />
                    <Input 
                      type="time"
                      value={newStartTime}
                      onChange={e => setNewStartTime(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10 [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Thời gian kết thúc *</label>
                  <div className="flex gap-2">
                    <Input 
                      type="date"
                      value={newEndDate}
                      onChange={e => setNewEndDate(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10 [color-scheme:dark]"
                      required
                    />
                    <Input 
                      type="time"
                      value={newEndTime}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10 [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Sức chứa tối đa (Capacity) *</label>
                  <Input 
                    type="number"
                    value={newCapacity}
                    onChange={e => setNewCapacity(Number(e.target.value))}
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Credits yêu cầu *</label>
                  <Input 
                    type="number"
                    value={newCreditCost}
                    onChange={e => setNewCreditCost(Number(e.target.value))}
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Độ khó *</label>
                  <select
                    value={newDifficultyLevel}
                    onChange={e => setNewDifficultyLevel(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    required
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Calo tiêu hao ước tính</label>
                  <Input 
                    type="number"
                    value={newCalories}
                    onChange={e => setNewCalories(Number(e.target.value))}
                    placeholder="Ví dụ: 500"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Đường dẫn ảnh nền (URL)</label>
                  <Input 
                    value={newThumbnailUrl}
                    onChange={e => setNewThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mô tả lớp học</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Mô tả nội dung bài tập, yêu cầu chuẩn bị..."
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 bg-black/20 -mx-6 -mb-6 p-6 justify-end">
                <Button 
                  type="button"
                  variant="outline" 
                  className="border-white/10 hover:bg-white/5" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  className="glow-btn" 
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Lưu & Xuất bản"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
