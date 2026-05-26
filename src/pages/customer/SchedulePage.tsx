import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getMyScheduleApi, type ScheduleItemResponse } from '@/api/schedule';

const SchedulePage = () => {
  const [items, setItems] = useState<ScheduleItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyScheduleApi();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai lich tap');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">Lich Tap</h1>
      <Card className="bg-secondary border-white/5 overflow-hidden">
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Dang tai lich tap...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Ban chua co lich tap nao.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.bookingId} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.gymName || item.branchName || 'FlexFit'}</p>
                    </div>
                    <div className="text-sm text-muted-foreground md:text-right">
                      <p>{new Date(item.startTime).toLocaleString('vi-VN')}</p>
                      <p>{item.bookingType} - {item.status}</p>
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

export default SchedulePage;
