const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/payment`;

export interface CreatePaymentRequest {
  packageId: string;
  paymentMethod?: string;
}

export interface PaymentUrlResponse {
  paymentId?: string;
  checkoutUrl?: string;
  CheckoutUrl?: string;
  url?: string;
  Url?: string;
  paymentUrl?: string;
  paymentLink?: string;
  data?: {
    checkoutUrl?: string;
  };
}

export interface PaymentHistoryDto {
  paymentId: string;
  userId: string;
  userEmail?: string;
  userFullName?: string;
  packageId: string;
  packageName?: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionCode?: string;
  createdAt: string;
  paidAt?: string;
}

export const getPaymentStatusInfo = (status: string) => {
  if (!status) return { label: 'Không xác định', className: 'bg-gray-500/20 text-gray-400' };
  const s = status.toLowerCase();
  if (['success', 'paid', 'completed', 'succeeded'].includes(s)) {
    return { label: 'Thành công', className: 'bg-green-500/20 text-green-400' };
  }
  if (['pending', 'processing'].includes(s)) {
    return { label: 'Đang xử lý', className: 'bg-yellow-500/20 text-yellow-400' };
  }
  if (['failed', 'fail'].includes(s)) {
    return { label: 'Thất bại', className: 'bg-red-500/20 text-red-400' };
  }
  if (['cancelled', 'canceled'].includes(s)) {
    return { label: 'Đã hủy', className: 'bg-gray-500/20 text-gray-400' };
  }
  return { label: status, className: 'bg-gray-500/20 text-gray-400' };
};

// =========================
// 1. GET PACKAGES
// =========================
export const getPackagesApi = async () => {
  const response = await fetch(`${API_URL}/packages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || "Failed to fetch packages"
    );
  }

  return response.json();
};

// =========================
// 2. CREATE PAYMENT
// =========================
export const createPaymentApi = async (
  request: CreatePaymentRequest
): Promise<PaymentUrlResponse> => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),
    },
    body: JSON.stringify({
      packageId: request.packageId,
      paymentMethod: request.paymentMethod || "PAYOS",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || "Failed to create payment url"
    );
  }

  const data: PaymentUrlResponse = await response.json();

  // =========================
  // AUTO FIX WRONG URL
  // =========================
  const rawUrl =
    data.checkoutUrl ||
    data.CheckoutUrl ||
    data.url ||
    data.Url ||
    data.paymentUrl ||
    data.paymentLink ||
    data.data?.checkoutUrl;

  if (data.paymentId) {
    localStorage.setItem("pending_payment_id", data.paymentId);
  }

  if (rawUrl) {
    const fixedUrl = rawUrl
      .replace("http://localhost:5173/api/payment/", "https://pay.payos.vn/web/")
      .replace("http://localhost:5023/api/payment/", "https://pay.payos.vn/web/");

    data.checkoutUrl = fixedUrl;
    data.paymentUrl = fixedUrl;
  }

  return data;
};

// =========================
// 3. GET MY CREDIT
// =========================
export const getMyCreditApi = async () => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/my-credit`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || "Failed to fetch credit"
    );
  }

  return response.json();
};

// =========================
// 4. PAYMENT CALLBACK
// =========================
export const paymentCallbackApi = async (
  queryString: string = ""
) => {
  const token = localStorage.getItem("access_token");

  const query =
    queryString &&
      !queryString.startsWith("?")
      ? `?${queryString}`
      : queryString;

  const response = await fetch(
    `${API_URL}/callback${query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
      "Failed to process payment callback"
    );
  }

  return response.json();
};

// =========================
// 5. PAYOS WEBHOOK
// =========================
export const payosWebhookApi = async (
  webhookData: Record<string, unknown>
) => {
  const response = await fetch(
    `${API_URL}/payos-webhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
      "Failed to process webhook"
    );
  }

  return response.json();
};

// =========================
// 6. GET MY PAYMENT HISTORY
// =========================
export const getMyPaymentHistoryApi = async (): Promise<PaymentHistoryDto[]> => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch payment history");
  }

  return response.json();
};

// =========================
// 7. GET ADMIN PAYMENT HISTORY
// =========================
export const getAdminPaymentHistoryApi = async (): Promise<PaymentHistoryDto[]> => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/admin/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch admin payment history");
  }

  return response.json();
};