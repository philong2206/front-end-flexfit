import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerPromotions } from '@/services/partnerApi';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Tag, Loader2 } from 'lucide-react';

interface Promotion {
  promotionId: string;
  title: string;
  description?: string;
  discountPercent?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const Page = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = () => {
    setLoading(true);
    setError(null);
    getPartnerPromotions()
      .then((data) => setPromotions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách khuyến mãi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý khuyến mãi</h1>
          <p className="text-muted-foreground text-lg">Thiết lập các chương trình ưu đãi cho hội viên.</p>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu khuyến mãi...</p>
            </div>
          ) : error ? (
            <ErrorState 
              title="Không tải được dữ liệu"
              message={error}
              onRetry={fetchPromotions}
            />
          ) : promotions.length === 0 ? (
            <EmptyState 
              icon={Tag} 
              title="Chưa có khuyến mãi"
              description="Hiện chưa có chương trình khuyến mãi nào để hiển thị."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promotion) => (
                <div key={promotion.promotionId} className="rounded-xl border border-white/5 bg-black/20 p-5 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-white text-lg">{promotion.title}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                      promotion.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {promotion.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{promotion.description || 'Không có mô tả'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-sm font-semibold text-primary">{promotion.discountPercent ?? 0}% OFF</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(promotion.startDate).toLocaleDateString("vi-VN")} - {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
