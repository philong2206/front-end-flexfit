import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerPromotions } from '@/services/partnerApi';

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

  useEffect(() => {
    getPartnerPromotions()
      .then((data) => setPromotions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Khong the tai khuyen mai'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Khuyen mai</h1>
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Dang tai khuyen mai...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : promotions.length === 0 ? (
            <p className="text-muted-foreground">Chua co khuyen mai nao.</p>
          ) : (
            <div className="space-y-3">
              {promotions.map((promotion) => (
                <div key={promotion.promotionId} className="rounded-lg border border-white/10 p-4">
                  <p className="font-semibold text-white">{promotion.title}</p>
                  <p className="text-sm text-muted-foreground">{promotion.description || 'Khong co mo ta'}</p>
                  <p className="text-sm text-muted-foreground">
                    {promotion.discountPercent ?? 0}% - {promotion.isActive ? 'Active' : 'Inactive'}
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
