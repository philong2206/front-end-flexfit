import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerReviews } from '@/services/partnerApi';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, Loader2, Star } from 'lucide-react';

interface PartnerReview {
  reviewId: string;
  rating: number;
  comment: string;
  customerName: string;
  className?: string;
  gymName?: string;
  createdAt: string;
}

const Page = () => {
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    setError(null);

    getPartnerReviews()
      .then((data) => setReviews(data))
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách đánh giá'
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Đánh giá từ hội viên
          </h1>
          <p className="text-muted-foreground text-lg">
            Xem những đánh giá thật từ hội viên về dịch vụ của bạn.
          </p>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Đang tải danh sách đánh giá...
              </p>
            </div>
          ) : error ? (
            <ErrorState
              title="Không thể tải đánh giá"
              message={error}
              onRetry={fetchReviews}
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Chưa có dữ liệu đánh giá"
              description="Các cơ sở của bạn chưa có đánh giá thật từ API hiện có."
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.reviewId}
                  className="rounded-xl border border-white/5 bg-black/20 p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                        {(review.customerName || 'K').charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          {review.customerName || 'Khách hàng'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.className
                            ? `Lớp: ${review.className}`
                            : `Phòng tập: ${review.gymName || 'Không xác định'}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-current' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300">
                    {review.comment || 'Không có bình luận'}
                  </p>

                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </p>
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
