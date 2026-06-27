import { motion } from "framer-motion";
import { Users, Building2, Activity, ShieldCheck, TrendingUp, AlertTriangle, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { changeGymStatusApi, type GymDto } from "@/api/gyms";
import { getAdminDashboardApi, type AdminDashboardResponse } from "@/api/adminDashboard";
import { getSystemLogsApi, type SystemLog } from "@/api/systemLog";

export default function AdminDashboard() {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    // ── Run dashboard stats + system logs IN PARALLEL ─────────────────────
    setLoadingStats(true);
    setStatsError(false);
    setLoadingLogs(true);
    setLogsError(null);

    Promise.all([
      getAdminDashboardApi(),
      getSystemLogsApi({ pageSize: 5 }),
    ])
      .then(([dashData, logData]) => {
        setDashboardStats(dashData);
        // Reuse gyms already fetched inside getAdminDashboardApi (no extra call)
        setGyms(dashData.gyms ?? []);
        setSystemLogs(logData.logs || []);
      })
      .catch((error) => {
        setDashboardStats(null);
        setStatsError(true);
        setLogsError(error instanceof Error ? error.message : "Không tải được dữ liệu.");
      })
      .finally(() => {
        setLoadingStats(false);
        setLoadingLogs(false);
      });
  }, []);

  const pendingGyms = gyms.filter(g => g.status === 'Pending');
  const chartGrowthData = dashboardStats?.platformGrowthData || [];
  const chartSubscriptionData = dashboardStats?.subscriptionData || [];
  const statsUnavailableText = statsError ? "Không tải được dữ liệu" : "Chưa có dữ liệu";

  const renderStatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return value.toLocaleString("vi-VN");
  };
  const bookingsUnavailable = !dashboardStats || dashboardStats.totalBookings === null || dashboardStats.totalBookings === undefined;
  const bookingsSubtitle = bookingsUnavailable
    ? statsUnavailableText
    : `${renderStatNumber(dashboardStats.totalBookings)} lượt đặt`;

  const formatLogDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const handleApprove = async (id: string) => {
    try {
      await changeGymStatusApi(id, "Approved");
      setGyms(gyms.map(g => g.gymId === id ? { ...g, status: "Approved" } : g));
      if (dashboardStats) {
        setDashboardStats({
          ...dashboardStats,
          totalPartners: dashboardStats.totalPartners === null ? null : dashboardStats.totalPartners + 1
        });
      }
    } catch {
      setStatsError(true);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await changeGymStatusApi(id, "Rejected");
      setGyms(gyms.map(g => g.gymId === id ? { ...g, status: "Rejected" } : g));
    } catch {
      setStatsError(true);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hệ thống Quản trị</h1>
          <p className="text-muted-foreground text-lg">Giám sát toàn bộ hoạt động của nền tảng FLEXFIT.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Link to="/admin/approvals">
            <ShieldCheck className="w-4 h-4" /> Xét duyệt đối tác ({pendingGyms.length})
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card border-white/5 h-full hover:-translate-y-1 hover:shadow-xl hover:border-white/10 transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-20 mb-2" /> : <div className="text-2xl font-bold text-white">{renderStatNumber(dashboardStats?.totalUsers)}</div>}
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {dashboardStats ? "Người dùng đăng ký" : statsUnavailableText}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-white/5 h-full hover:-translate-y-1 hover:shadow-xl hover:border-white/10 transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đối tác Gym</CardTitle>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <div className="text-2xl font-bold text-white">{renderStatNumber(dashboardStats?.totalGyms)}</div>}
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {dashboardStats ? `${renderStatNumber(dashboardStats.totalPartners)} đối tác` : statsUnavailableText}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-white/5 h-full hover:-translate-y-1 hover:shadow-xl hover:border-white/10 transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lượt đặt chỗ</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <div className="text-2xl font-bold text-white">
                {renderStatNumber(dashboardStats?.totalBookings)}
              </div>}
              <p className="text-xs text-muted-foreground mt-1">
                {bookingsSubtitle}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-white/5 h-full border-l-4 border-l-amber-500 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-white/10 transition-all duration-300 rounded-2xl">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[20px] -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-500">Cần xử lý</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              {loadingStats ? <Skeleton className="h-8 w-12 mb-2 bg-amber-500/20" /> : <div className="text-2xl font-bold text-white">{pendingGyms.length}</div>}
              <p className="text-xs text-amber-400/70 mt-1">{pendingGyms.length} duyệt gym</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="bg-card border-white/5 rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Biểu đồ tăng trưởng</CardTitle>
              <CardDescription>Số lượng người dùng và đối tác tham gia nền tảng</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {loadingStats ? (
                  <Skeleton className="w-full h-full rounded-xl" />
              ) : chartGrowthData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {statsUnavailableText}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-white/5 h-full rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Cơ cấu gói thành viên</CardTitle>
              <CardDescription>Tỷ lệ đăng ký các gói</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex flex-col items-center justify-center relative">
              {loadingStats ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : chartSubscriptionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground w-full">
                  <EmptyState 
                    icon={Activity}
                    title={statsUnavailableText}
                    description="Chưa có dữ liệu cơ cấu gói thành viên"
                  />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartSubscriptionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartSubscriptionData.map((entry, index) => (
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
                    <span className="text-2xl font-bold text-white">{chartSubscriptionData.reduce((sum, item) => sum + item.value, 0)}</span>
                    <span className="block text-[10px] text-muted-foreground uppercase mt-1">Đăng ký</span>
                  </div>
                  <div className="flex gap-4 mt-4 w-full justify-center">
                    {chartSubscriptionData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-card border-white/5 h-full rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Đối tác chờ duyệt</CardTitle>
                  <CardDescription>Các phòng gym mới đăng ký tham gia hệ thống</CardDescription>
                </div>
                <Button asChild variant="outline" className="text-xs h-8 border-white/10 text-white">
                  <Link to="/admin/approvals">Quản lý duyệt</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg font-medium">Tên cơ sở</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
                      <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingGyms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8">
                          <EmptyState 
                            icon={Building2}
                            title="Không có đối tác chờ duyệt"
                            description="Tất cả các đối tác mới đã được xử lý xong."
                          />
                        </td>
                      </tr>
                    ) : (
                      pendingGyms.map((gym) => (
                        <tr key={gym.gymId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">{gym.gymName}</td>
                          <td className="px-4 py-4">{gym.email}</td>
                          <td className="px-4 py-4">{formatDate(gym.createdAt)}</td>
                          <td className="px-4 py-4 text-right">
                            <Button size="sm" onClick={() => handleApprove(gym.gymId)} className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 mr-2">Duyệt</Button>
                            <Button variant="ghost" onClick={() => handleReject(gym.gymId)} size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">Xóa</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-card border-white/5 h-full rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Nhật ký hệ thống gần đây</CardTitle>
                  <CardDescription>Các hoạt động mới nhất trên hệ thống</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg font-medium">Hành động</th>
                      <th className="px-4 py-3 font-medium">Mô tả</th>
                      <th className="px-4 py-3 font-medium">Người dùng</th>
                      <th className="px-4 py-3 font-medium">IP</th>
                      <th className="px-4 py-3 rounded-r-lg font-medium">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-8">
                           <Skeleton className="h-8 w-full mb-2 bg-white/10" />
                           <Skeleton className="h-8 w-full mb-2 bg-white/10" />
                           <Skeleton className="h-8 w-full mb-2 bg-white/10" />
                        </td>
                      </tr>
                    ) : logsError ? (
                      <tr>
                        <td colSpan={5} className="py-8">
                          <ErrorState
                            title="Không tải được nhật ký hệ thống"
                            message={logsError}
                          />
                        </td>
                      </tr>
                    ) : systemLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8">
                          <EmptyState 
                            icon={ScrollText}
                            title="Chưa có nhật ký hệ thống"
                            description="Không có ghi nhận hoạt động nào gần đây."
                          />
                        </td>
                      </tr>
                    ) : (
                      systemLogs.map((log) => (
                        <tr key={log.logId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">{log.action}</td>
                          <td className="px-4 py-4 truncate max-w-[200px]" title={log.description}>{log.description || "-"}</td>
                          <td className="px-4 py-4">{log.userEmail || log.userFullName || "System"}</td>
                          <td className="px-4 py-4">{log.ipAddress || "-"}</td>
                          <td className="px-4 py-4">{formatLogDate(log.createdAt)}</td>
                        </tr>
                      ))
                    )}
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
