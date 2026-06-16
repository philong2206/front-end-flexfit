import { useEffect, useState } from "react";
import { Activity, Calendar, DollarSign, Package, Wallet, Clock, Search, Filter } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminRevenueSummaryApi, AdminRevenueApiError, type AdminRevenueSummaryResponse } from "@/api/adminRevenue";
import { getAdminPaymentHistoryApi, getPaymentStatusInfo, type PaymentHistoryDto } from "@/api/payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const MISSING_AGGREGATE_API_TEXT = "Chưa có API thống kê doanh thu tổng hợp";

type RevenueCard = {
  title: string;
  icon: typeof DollarSign;
  value: (summary: AdminRevenueSummaryResponse) => string;
};

const revenueCards: RevenueCard[] = [
  {
    title: "Tổng doanh thu tháng này",
    icon: DollarSign,
    value: (summary) => formatPrice(summary.totalRevenueThisMonth),
  },
  {
    title: "Giao dịch thanh toán thành công",
    icon: Wallet,
    value: (summary) => `${formatNumber(summary.successfulPaymentCount)} giao dịch`,
  },
  {
    title: "Credit đã thanh toán",
    icon: Activity,
    value: (summary) => `${formatNumber(summary.totalCreditsPaid)} Credits`,
  },
  {
    title: "Doanh thu hôm nay",
    icon: Calendar,
    value: (summary) => formatPrice(summary.revenueToday),
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

export default function AdminRevenuePage() {
  const [summary, setSummary] = useState<AdminRevenueSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [history, setHistory] = useState<PaymentHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getAdminRevenueSummaryApi().catch((error) => {
        if (!mounted) return null;
        setErrorText(
          error instanceof AdminRevenueApiError && error.status === 404
            ? MISSING_AGGREGATE_API_TEXT
            : "Không tải được dữ liệu doanh thu"
        );
        return null;
      }),
      getAdminPaymentHistoryApi().catch((error) => {
        console.error("Failed to load payment history", error);
        return [];
      })
    ]).then(([summaryData, historyData]) => {
      if (!mounted) return;
      if (summaryData) setSummary(summaryData);
      if (historyData) setHistory(historyData);
    }).finally(() => {
      if (mounted) {
        setLoading(false);
        setHistoryLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      (item.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.userFullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.transactionCode?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = summary?.monthlyRevenue ?? [];
  const packageSales = summary?.packageSales ?? [];
  const emptyMessage = errorText || "Chưa có dữ liệu doanh thu";

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Thống Kê Doanh Thu</h1>
        <p className="text-muted-foreground text-lg">
          Số liệu được tổng hợp từ payment thành công toàn hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card key={card.title} className="bg-secondary border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : summary ? (
                <div className="text-2xl font-bold text-white">{card.value(summary)}</div>
              ) : (
                <div className="text-2xl font-bold text-white">--</div>
              )}
              {!loading && !summary && <p className="text-xs text-amber-400 mt-1">{emptyMessage}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-secondary border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Xu hướng Doanh thu</CardTitle>
            <CardDescription>Biến động doanh thu trong các tháng gần đây</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : !summary ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState icon={DollarSign} title={emptyMessage} description="Chưa có số liệu doanh thu để hiển thị biểu đồ." />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState icon={DollarSign} title="Chưa có dữ liệu doanh thu" description="Chưa có payment thành công trong khoảng thời gian thống kê." />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(Number(value) / 1000000).toFixed(0)}tr`} />
                  <Tooltip
                    formatter={(value) => [formatPrice(Number(value || 0)), "Doanh thu"]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "white" }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-secondary border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Doanh thu theo gói</CardTitle>
            <CardDescription>Các gói có doanh thu trong tháng này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : !summary ? (
              <EmptyState icon={Package} title="Chưa có dữ liệu doanh thu theo gói" description={emptyMessage} />
            ) : packageSales.length === 0 ? (
              <EmptyState icon={Package} title="Chưa có dữ liệu doanh thu theo gói" description="Chưa có gói nào phát sinh doanh thu trong tháng này." />
            ) : (
              packageSales.map((item) => (
                <div key={item.packageName} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <h5 className="font-bold text-white text-sm">{item.packageName}</h5>
                    <span className="text-xs text-muted-foreground">{formatNumber(item.count)} lượt mua</span>
                  </div>
                  <span className="font-bold text-white text-sm">{formatPrice(item.revenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lịch sử thanh toán toàn hệ thống
            </h2>
            <p className="text-sm text-muted-foreground">Tất cả giao dịch mua gói Credit</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm email, mã GD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary border-white/10 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-secondary border-white/10 w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PAID">PAID (Thành công)</SelectItem>
                <SelectItem value="PENDING">PENDING (Đang chờ)</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED (Hủy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-secondary border-white/5 overflow-hidden">
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="p-10 text-center">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Đang tải lịch sử giao dịch...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-10 text-center">
                <EmptyState 
                  icon={Clock} 
                  title="Không tìm thấy giao dịch" 
                  description={history.length === 0 ? "Hệ thống chưa có giao dịch nào." : "Không có giao dịch nào phù hợp với bộ lọc."} 
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/20">
                    <tr>
                      <th className="px-6 py-4">Mã GD</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Gói & Số tiền</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredHistory.map((item) => (
                      <tr key={item.paymentId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {item.transactionCode || item.paymentId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{item.userFullName || "Khách hàng"}</div>
                          <div className="text-xs text-muted-foreground">{item.userEmail || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-primary">{formatPrice(item.amount)}</div>
                          <div className="text-xs text-muted-foreground">{item.packageName || "Gói Credit"}</div>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const statusInfo = getPaymentStatusInfo(item.status);
                            return (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
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
    </div>
  );
}
