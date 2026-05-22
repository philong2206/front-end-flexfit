import { useEffect, useState } from "react";
import { Tag, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerPromotions } from "@/services/partnerApi";
import { toast } from "sonner";

export default function PartnerPromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      await getPartnerPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách khuyến mãi";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Khuyến mãi</h1>
          <p className="text-muted-foreground text-lg">Quản lý các chương trình khuyến mãi</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Tạo khuyến mãi mới
        </Button>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Danh sách khuyến mãi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Đang tải danh sách khuyến mãi...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={fetchPromotions} variant="outline">Thử lại</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Tag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">API endpoint chưa được triển khai</p>
                <p className="text-xs text-muted-foreground">Backend cần tạo: GET /api/partner/promotions</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
