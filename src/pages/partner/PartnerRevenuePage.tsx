import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerRevenueReport } from '@/services/partnerApi';

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

  useEffect(() => {
    getPartnerRevenueReport()
      .then((data) => setReport(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Khong the tai bao cao doanh thu'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bao cao doanh thu</h1>
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Dang tai bao cao doanh thu...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : report ? (
            <div className="space-y-4">
              <div className="text-3xl font-bold text-white">{report.totalRevenue} credits</div>
              <div className="grid gap-3 md:grid-cols-2">
                {report.revenueByBranch.map((item) => (
                  <div key={item.name} className="rounded-lg border border-white/10 p-4">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.total} credits</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
