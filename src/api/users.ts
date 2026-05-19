export const API_URL = "/api/users";

export interface UserDto {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export const getAllUsersApi = async (): Promise<UserDto[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Lấy danh sách người dùng thất bại");
  }
  return response.json();
};

export const getUserByIdApi = async (id: string): Promise<UserDto> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error("Không tìm thấy người dùng");
  }
  return response.json();
};

export const updateUserApi = async (id: string, data: UpdateUserRequest) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Cập nhật người dùng thất bại");
  }
  return response.json();
};

export const changeUserStatusApi = async (id: string, isActive: boolean) => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isActive),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Thay đổi trạng thái thất bại");
  }
  return response.json();
};

export const deleteUserApi = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Xóa người dùng thất bại");
  }
  return response.json();
};
