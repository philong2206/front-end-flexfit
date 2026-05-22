import { apiFetch } from "@/lib/apiFetch";
import { withShortLivedCache } from "@/lib/simpleGetCache";

export const API_URL = "/api/branches";

export interface StaffInfoDto {
  staffId: string;
  fullName: string;
}

export interface BranchDto {
  branchId: string;
  gymId: string;
  branchName: string;
  address: string;
  city: string;
  district: string;
  openTime: string;
  closeTime: string;
  thumbnailUrl: string;
  creditCost: number;
  isActive: boolean;
  createdAt: string;
  staffs: StaffInfoDto[];
}

export interface CreateBranchRequest {
  gymId: string;
  branchName: string;
  address: string;
  city: string;
  district: string;
  openTime: string;
  closeTime: string;
  thumbnailUrl: string;
  creditCost: number;
}

export interface UpdateBranchRequest {
  branchName: string;
  address: string;
  city: string;
  district: string;
  openTime: string;
  closeTime: string;
  thumbnailUrl: string;
  creditCost: number;
}

export const getAllBranchesApi = async (): Promise<BranchDto[]> => {
  return withShortLivedCache("GET:/api/branches", 60_000, async () => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
      throw new Error("Lấy danh sách chi nhánh thất bại");
    }
    return response.json();
  });
};

export const getBranchByIdApi = async (id: string): Promise<BranchDto> => {
  const response = await apiFetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error("Không tìm thấy chi nhánh");
  }
  return response.json();
};

export const createBranchApi = async (data: CreateBranchRequest) => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Tạo chi nhánh thất bại");
  }
  return response.json();
};

export const updateBranchApi = async (id: string, data: UpdateBranchRequest) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Cập nhật chi nhánh thất bại");
  }
  return response.json();
};

export const changeBranchStatusApi = async (id: string, isActive: boolean) => {
  const response = await apiFetch(`${API_URL}/${id}/status`, {
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

export const deleteBranchApi = async (id: string) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Xóa chi nhánh thất bại");
  }
  return response.json();
};

export interface AssignStaffDto {
  userId: string;
  branchId: string;
}

export interface UpdateBranchStaffDto {
  branchId: string;
  newStaffId: string;
}

export const assignStaffToBranchApi = async (data: AssignStaffDto) => {
  const token = localStorage.getItem("access_token");
  const response = await apiFetch(`${API_URL}/assign-staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Bổ nhiệm nhân viên thất bại");
  }
  return response.json();
};

export const removeStaffFromBranchApi = async (staffId: string, branchId: string) => {
  const token = localStorage.getItem("access_token");
  const response = await apiFetch(`${API_URL}/remove-staff?staffId=${staffId}&branchId=${branchId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Gỡ nhân viên khỏi chi nhánh thất bại");
  }
  return response.json();
};

export const updateBranchStaffApi = async (data: UpdateBranchStaffDto) => {
  const token = localStorage.getItem("access_token");
  const response = await apiFetch(`${API_URL}/update-staff`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Cập nhật nhân viên quản lý thất bại");
  }
  return response.json();
};
