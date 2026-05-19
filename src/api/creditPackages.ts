export const API_URL = "/api/credit-packages";

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
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${packageId}/buy`, {
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
  const response = await fetch(`/api/users/${userId}/credit-wallet`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy số dư credit thất bại");
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
  const response = await fetch(`/api/users/${userId}/credit-transactions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy lịch sử giao dịch thất bại");
  }
  return response.json();
};
