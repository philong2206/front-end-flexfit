import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerCustomers } from "@/services/partnerApi";
import { toast } from "sonner";

export default function PartnerCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      await getPartnerCustomers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách khách hàng";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Khách hàng</h1>
        <p className="text-muted-foreground text-lg">Danh sách khách hàng đã đặt lịch tại cơ sở</p>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Danh sách khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Đang tải danh sách khách hàng...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Backend cần tạo endpoint lọc khách hàng theo GymPartner
                </p>
                <Button onClick={fetchCustomers} variant="outline">Thử lại</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">Backend chưa hỗ trợ API danh sách khách hàng</p>
                <p className="text-xs text-muted-foreground">
                  Cần tạo: GET /api/partner/customers (lọc theo GymPartner)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
