export const API_URL = "/api/gyms";

export interface GymDto {
  gymId: string;
  ownerId: string;
  gymName: string;
  description: string;
  thumbnailUrl: string;
  phoneNumber: string;
  email: string;
  status: string;
  ratingAverage: number;
  totalReviews: number;
  createdAt: string;
}

export interface CreateGymRequest {
  ownerId: string;
  gymName: string;
  description: string;
  thumbnailUrl: string;
  phoneNumber: string;
  email: string;
}

export interface UpdateGymRequest {
  gymName: string;
  description: string;
  thumbnailUrl: string;
  phoneNumber: string;
  email: string;
}

export const getAllGymsApi = async (): Promise<GymDto[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Lấy danh sách phòng tập thất bại");
  }
  return response.json();
};

export const getGymByIdApi = async (id: string): Promise<GymDto> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error("Không tìm thấy phòng tập");
  }
  return response.json();
};

export const createGymApi = async (data: CreateGymRequest) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Tạo phòng tập thất bại");
  }
  return response.json();
};

export const updateGymApi = async (id: string, data: UpdateGymRequest) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Cập nhật phòng tập thất bại");
  }
  return response.json();
};

export const changeGymStatusApi = async (id: string, status: string) => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status), // The backend expects a raw string from body: [FromBody] string status
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Thay đổi trạng thái thất bại");
  }
  return response.json();
};

export const deleteGymApi = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Xóa phòng tập thất bại");
  }
  return response.json();
};

export interface TransferGymOwnershipDto {
  gymId: string;
  newOwnerId: string;
}

export const transferGymOwnershipApi = async (data: TransferGymOwnershipDto) => {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/transfer-owner`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Chuyển nhượng quyền sở hữu thất bại");
  }
  return response.json();
};

