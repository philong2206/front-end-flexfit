import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays } from 'lucide-react';

const SchedulePage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">Lịch tập</h1>
      <Card className="bg-secondary border-white/5 overflow-hidden">
        <CardContent className="p-6">
          <EmptyState
            icon={CalendarDays}
            title="Lịch tập chưa khả dụng"
            description="API lịch tập cá nhân chưa được backend cung cấp, nên trang này đang được tạm ẩn dữ liệu để tránh lỗi tải trang."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;
