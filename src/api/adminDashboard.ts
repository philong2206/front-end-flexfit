export interface AdminDashboardResponse {
  totalUsers: number;
  totalPartners: number;
  totalBookingsLast30Days: number;
  platformGrowthData: Array<{ name: string; users: number }>;
  subscriptionData: Array<{ name: string; value: number; color: string }>;
}

export const getAdminDashboardApi = async (): Promise<AdminDashboardResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await fetch("/api/admin/dashboard", {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy thống kê admin thất bại");
  }

  return response.json();
};
