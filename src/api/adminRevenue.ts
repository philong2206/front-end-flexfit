import { apiFetch } from "@/lib/apiFetch";

export interface AdminMonthlyRevenueItem {
  month: string;
  revenue: number;
}

export interface AdminPackageSalesItem {
  packageName: string;
  count: number;
  revenue: number;
}

export interface AdminRevenueSummaryResponse {
  totalRevenueThisMonth: number;
  successfulPaymentCount: number;
  totalCreditsPaid: number;
  revenueToday: number;
  monthlyRevenue: AdminMonthlyRevenueItem[];
  packageSales: AdminPackageSalesItem[];
}

export class AdminRevenueApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminRevenueApiError";
    this.status = status;
  }
}

export const getAdminRevenueSummaryApi = async (): Promise<AdminRevenueSummaryResponse> => {
  const response = await apiFetch("/api/admin/revenue/summary");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AdminRevenueApiError(
      response.status,
      errorData.message || errorData.Message || "Không tải được dữ liệu doanh thu"
    );
  }

  return response.json();
};
