import { useEffect, useState } from "react";
import { Activity, Calendar, DollarSign, Package, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminRevenueSummaryApi, AdminRevenueApiError, type AdminRevenueSummaryResponse } from "@/api/adminRevenue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    let mounted = true;

    getAdminRevenueSummaryApi()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
        setErrorText(null);
      })
      .catch((error) => {
        if (!mounted) return;
        setSummary(null);
        setErrorText(
          error instanceof AdminRevenueApiError && error.status === 404
            ? MISSING_AGGREGATE_API_TEXT
            : "Không tải được dữ liệu doanh thu"
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    </div>
  );
}
