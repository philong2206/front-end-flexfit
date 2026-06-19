/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/credit-packages`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreditPackageResponse {
  packageId: string;
  packageName: string;
  creditAmount: number;
  price: number;
  description?: string;
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
}

export interface CreditWalletResponse {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface CreditTransactionResponse {
  transactionId: string;
  userId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

export const getCreditPackagesApi = async (): Promise<CreditPackageResponse[]> => {
  const response = await apiFetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy danh sách gói nạp thất bại");
  }
  return response.json();
};

export const buyCreditPackageApi = async (packageId: string, userId: string): Promise<{ message: string; balance: number }> => {
  const response = await apiFetch(`${API_URL}/${packageId}/buy`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Mua gói nạp thất bại");
  }
  return response.json();
};

export const getUserCreditWalletApi = async (userId: string): Promise<CreditWalletResponse> => {
  try {
    const response = await apiFetch(`/api/users/${userId}/credit-wallet`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || errorData.Message || "Lấy số dư credit thất bại");
      error.response = { status: response.status, data: errorData };
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    const wallet: CreditWalletResponse = await response.json();
    
    const spentKey = `spent_credits_${userId}`;
    const lastDbBalanceKey = `last_db_balance_${userId}`;
    
    const lastDbBalance = parseInt(localStorage.getItem(lastDbBalanceKey) || "0", 10);
    
    // If database balance increased (top-up or manual SQL seed), auto-reset locally spent credits
    if (wallet.balance > lastDbBalance) {
      localStorage.setItem(spentKey, "0");
    }
    localStorage.setItem(lastDbBalanceKey, wallet.balance.toString());
    
    const localSpent = parseInt(localStorage.getItem(spentKey) || "0", 10);
    if (localSpent > 0) {
      wallet.balance = Math.max(0, wallet.balance - localSpent);
      wallet.totalSpent += localSpent;
    }
    
    return wallet;
  } catch (err) {
    // Re-throw with full context for normalizeApiError
    throw err;
  }
};

export const deductCreditsLocally = (userId: string, amount: number) => {
  const spentKey = `spent_credits_${userId}`;
  const localSpent = parseInt(localStorage.getItem(spentKey) || "0", 10);
  localStorage.setItem(spentKey, (localSpent + amount).toString());
  window.dispatchEvent(new Event("wallet-update"));
};

export const refundCreditsLocally = (userId: string, amount: number) => {
  const spentKey = `spent_credits_${userId}`;
  const localSpent = parseInt(localStorage.getItem(spentKey) || "0", 10);
  localStorage.setItem(spentKey, Math.max(0, localSpent - amount).toString());
  window.dispatchEvent(new Event("wallet-update"));
};

export const getUserTransactionHistoryApi = async (userId: string): Promise<CreditTransactionResponse[]> => {
  const response = await apiFetch(`/api/users/${userId}/credit-transactions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy lịch sử giao dịch thất bại");
  }
  const data = await response.json();
  // Handle if wrapped in { data: [...] } or { items: [...] } etc.
  if (data && !Array.isArray(data)) {
    return (data.data || data.items || data.result || data.records || []) as CreditTransactionResponse[];
  }
  return data as CreditTransactionResponse[];
};

export const formatCreditAmount = (amount: number) => {
  if (amount > 0) return `+${amount} credits`;
  if (amount < 0) return `${amount} credits`;
  return `${amount} credits`;
};

export const getCreditTransactionTypeLabel = (type: string) => {
  if (!type) return "Khác";
  const t = type.toLowerCase();
  if (["purchase", "topup", "payment"].includes(t)) return "Nạp credit";
  if (["booking", "classbooking", "gymbooking"].includes(t)) return "Đặt lịch";
  if (["cancel", "refund"].includes(t)) return "Hoàn credit";
  if (t === "adminadjustment" || t === "adjustment") return "Admin điều chỉnh";
  return type; // raw type fallback
};

export interface CreateCreditPackageRequest {
  packageName: string;
  creditAmount: number;
  price: number;
  description?: string;
}

export interface UpdateCreditPackageRequest {
  packageName?: string;
  creditAmount?: number;
  price?: number;
  description?: string;
}

export interface AdminAddCreditRequest {
  userId: string;
  amount: number;
  description?: string;
}

export const getCreditPackageByIdApi = async (id: string): Promise<CreditPackageResponse> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy chi tiết gói nạp thất bại");
  }
  return response.json();
};

export const createCreditPackageApi = async (data: CreateCreditPackageRequest) => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Tạo gói nạp thất bại");
  }
  return response.json();
};

export const updateCreditPackageApi = async (id: string, data: UpdateCreditPackageRequest) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Cập nhật gói nạp thất bại");
  }
  return response.json();
};

export const changeCreditPackageStatusApi = async (id: string, isActive: boolean) => {
  const response = await apiFetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(isActive),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Thay đổi trạng thái gói nạp thất bại");
  }
  return response.json();
};

export const changeCreditPackagePopularStatusApi = async (id: string, isPopular: boolean) => {
  const response = await apiFetch(`${API_URL}/${id}/popular`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(isPopular),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Thay đổi trạng thái phổ biến thất bại");
  }
  return response.json();
};

export const deleteCreditPackageApi = async (id: string) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Xóa gói nạp thất bại");
  }
  return response.json();
};

export const adminAdjustmentCreditApi = async (data: AdminAddCreditRequest) => {
  const response = await apiFetch(`${API_URL}/admin-adjustment`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Điều chỉnh số dư credit thất bại");
  }
  return response.json();
};

