export const API_URL = "/api/branches";

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
  isActive: boolean;
  createdAt: string;
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
}

export interface UpdateBranchRequest {
  branchName: string;
  address: string;
  city: string;
  district: string;
  openTime: string;
  closeTime: string;
  thumbnailUrl: string;
}

export const getAllBranchesApi = async (): Promise<BranchDto[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Lấy danh sách chi nhánh thất bại");
  }
  return response.json();
};

export const getBranchByIdApi = async (id: string): Promise<BranchDto> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error("Không tìm thấy chi nhánh");
  }
  return response.json();
};

export const createBranchApi = async (data: CreateBranchRequest) => {
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${id}`, {
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

export const deleteBranchApi = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Xóa chi nhánh thất bại");
  }
  return response.json();
};
