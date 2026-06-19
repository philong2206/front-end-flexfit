export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/schedule`;

export interface ScheduleItemResponse {
  bookingId: string;
  bookingType: "Gym" | "Class";
  title: string;
  branchName?: string;
  gymName?: string;
  coachName?: string;
  startTime: string;
  endTime: string;
  status: string;
  checkInStatus: string;
  creditUsed: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getMyScheduleApi = async (startDate?: string, endDate?: string): Promise<ScheduleItemResponse[]> => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();

  const response = await fetch(`${API_URL}/my-calendar${query ? `?${query}` : ""}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy lịch tập thất bại");
  }

  return response.json();
};
