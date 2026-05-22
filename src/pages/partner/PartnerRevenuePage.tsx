import { useEffect, useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerRevenueReport } from "@/services/partnerApi";
import { toast } from "sonner";

export default function PartnerRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      await getPartnerRevenueReport();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải báo cáo doanh thu";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Báo cáo doanh thu</h1>
        <p className="text-muted-foreground text-lg">Thống kê doanh thu và hiệu suất kinh doanh</p>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Tổng quan doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Đang tải báo cáo doanh thu...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={fetchRevenue} variant="outline">Thử lại</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">API endpoint chưa được triển khai</p>
                <p className="text-xs text-muted-foreground">Backend cần tạo: GET /api/partner/revenue</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
