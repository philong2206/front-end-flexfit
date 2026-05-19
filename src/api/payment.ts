const API_URL = "/api/payment";

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