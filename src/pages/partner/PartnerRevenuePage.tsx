import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPartnerRevenueReport } from '@/services/partnerApi';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { DollarSign, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevenueReport {
  totalRevenue: number;
  revenueByMonth: Array<{ name: string; total: number }>;
  revenueByBranch: Array<{ name: string; total: number }>;
  revenueByClass: Array<{ name: string; total: number }>;
}

const Page = () => {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = () => {
    setLoading(true);
    setError(null);
    getPartnerRevenueReport()
      .then((data) => setReport(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải báo cáo doanh thu'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Báo cáo doanh thu</h1>
          <p className="text-muted-foreground text-lg">Theo dõi và phân tích doanh thu từ các cơ sở của bạn.</p>
        </div>
        <Button variant="outline" className="border-white/10 glass text-white gap-2">
          <Download className="w-4 h-4" /> Xuất báo cáo
        </Button>
      </div>

      {loading ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu doanh thu...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-secondary border-white/5">
          <CardContent>
            <ErrorState 
              title="Tính năng đang phát triển"
              message={error}
              onRetry={fetchRevenue}
            />
          </CardContent>
        </Card>
      ) : !report || report.totalRevenue === 0 ? (
        <Card className="bg-secondary border-white/5">
          <CardContent>
            <EmptyState 
              icon={DollarSign} 
              title="Chưa có dữ liệu doanh thu"
              description="Hệ thống chưa ghi nhận doanh thu nào trong khoảng thời gian này."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-primary/10 border-primary/30 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)]">
            <div className="absolute right-0 top-0 w-48 h-48 bg-primary/20 rounded-full blur-[50px] -mr-20 -mt-20" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-primary font-medium text-lg">Tổng doanh thu</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-extrabold text-white">{report.totalRevenue.toLocaleString()} <span className="text-2xl text-primary/80 font-bold">Credits</span></div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-secondary border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Doanh thu theo chi nhánh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.revenueByBranch.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-lg font-bold text-primary">{item.total.toLocaleString()} cr</p>
                    </div>
                  ))}
                  {report.revenueByBranch.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu chi nhánh</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Doanh thu theo lớp học</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.revenueByClass.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-lg font-bold text-primary">{item.total.toLocaleString()} cr</p>
                    </div>
                  ))}
                  {report.revenueByClass.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu lớp học</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
