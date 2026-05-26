import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerReviews } from '@/services/partnerApi';

interface PartnerReview {
  reviewId: string;
  userFullName: string;
  gymName?: string;
  className?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const Page = () => {
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPartnerReviews()
      .then((data) => setReviews(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Khong the tai danh gia'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Danh gia</h1>
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Dang tai danh gia...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">Chua co danh gia nao.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.reviewId} className="rounded-lg border border-white/10 p-4">
                  <p className="font-semibold text-white">{review.rating}/5 - {review.userFullName}</p>
                  <p className="text-sm text-muted-foreground">{review.gymName || review.className || 'FlexFit'}</p>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
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
