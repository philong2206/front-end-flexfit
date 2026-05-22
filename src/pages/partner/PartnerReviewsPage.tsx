import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerReviews } from "@/services/partnerApi";
import { toast } from "sonner";

export default function PartnerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      await getPartnerReviews();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách đánh giá";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Đánh giá</h1>
        <p className="text-muted-foreground text-lg">Phản hồi và đánh giá từ khách hàng</p>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Danh sách đánh giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Đang tải danh sách đánh giá...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={fetchReviews} variant="outline">Thử lại</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">API endpoint chưa được triển khai</p>
                <p className="text-xs text-muted-foreground">Backend cần tạo: GET /api/partner/reviews</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
