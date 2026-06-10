import { apiFetch } from "@/lib/apiFetch";

export const SYSTEM_LOG_API_URL = "/api/SystemLog";

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface SystemLog {
  logId: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  action: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemLogResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  logs: SystemLog[];
}

export const getSystemLogsApi = async (params?: {
  searchTerm?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SystemLogResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `${SYSTEM_LOG_API_URL}${queryString ? `?${queryString}` : ""}`;

  const response = await apiFetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Failed to fetch system logs");
  }
  return response.json();
};
