import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerCustomers } from '@/services/partnerApi';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Loader2, Search } from 'lucide-react';

interface PartnerCustomer {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  totalBookings: number;
  totalCreditUsed: number;
  lastBookingAt?: string;
}

const Page = () => {
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    setError(null);
    getPartnerCustomers()
      .then((data) => setCustomers(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý hội viên</h1>
          <p className="text-muted-foreground text-lg">Danh sách các hội viên đã từng tập luyện tại cơ sở của bạn.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm kiếm hội viên..." 
            className="bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary w-full md:w-64"
          />
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải danh sách hội viên...</p>
            </div>
          ) : error ? (
            <div className="py-10">
              <ErrorState 
                title="Không tải được dữ liệu"
                message={error}
                onRetry={fetchCustomers}
              />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-10">
              <EmptyState 
                icon={Users} 
                title="Chưa có hội viên"
                description="Chưa có hội viên nào tập luyện tại các cơ sở của bạn."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Hội viên</th>
                    <th className="px-6 py-4 font-medium">Liên hệ</th>
                    <th className="px-6 py-4 font-medium">Tổng số buổi</th>
                    <th className="px-6 py-4 font-medium">Đã chi tiêu</th>
                    <th className="px-6 py-4 font-medium">Lần cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {(customer.fullName || customer.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{customer.fullName || customer.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-white">{customer.phoneNumber || "---"}</span>
                        <span className="text-xs">{customer.email}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{customer.totalBookings}</td>
                      <td className="px-6 py-4 text-primary font-bold">{customer.totalCreditUsed} cr</td>
                      <td className="px-6 py-4">
                        {customer.lastBookingAt ? new Date(customer.lastBookingAt).toLocaleDateString("vi-VN") : "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
