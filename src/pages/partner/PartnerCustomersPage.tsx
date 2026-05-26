import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPartnerCustomers } from '@/services/partnerApi';

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

  useEffect(() => {
    getPartnerCustomers()
      .then((data) => setCustomers(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Khong the tai danh sach khach hang'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Khach hang</h1>
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Dang tai danh sach khach hang...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : customers.length === 0 ? (
            <p className="text-muted-foreground">Chua co khach hang nao.</p>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div key={customer.userId} className="rounded-lg border border-white/10 p-4">
                  <p className="font-semibold text-white">{customer.fullName || customer.email}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.totalBookings} bookings - {customer.totalCreditUsed} credits
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
