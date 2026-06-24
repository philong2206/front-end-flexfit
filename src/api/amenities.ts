import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/amenities`;

// BE chỉ trả về amenityId và amenityName
export interface AmenityDto {
    amenityId: string;
    amenityName: string;
}

export interface CreateAmenityRequest {
    amenityName: string;
}

export interface UpdateAmenityRequest {
    amenityName: string;
}

export const getAmenitiesApi = async (): Promise<AmenityDto[]> => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
        throw new Error("Lấy danh sách tiện ích thất bại");
    }
    return response.json();
};

export const createAmenityApi = async (data: CreateAmenityRequest): Promise<AmenityDto> => {
    const response = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.amenityName),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        let details = "";
        if (err.errors) {
            details = ": " + Object.entries(err.errors).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`).join("; ");
        }
        throw new Error((err.message || err.title || "Thêm tiện ích thất bại") + details);
    }
    return response.json();
};

export const updateAmenityApi = async (id: string, data: UpdateAmenityRequest): Promise<AmenityDto> => {
    const response = await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.amenityName),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        let details = "";
        if (err.errors) {
            details = ": " + Object.entries(err.errors).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`).join("; ");
        }
        console.error("[updateAmenityApi] Error body:", err);
        throw new Error((err.message || err.title || "Cập nhật tiện ích thất bại") + details);
    }
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : { amenityId: id, amenityName: data.amenityName };
    } catch {
        return { amenityId: id, amenityName: data.amenityName };
    }
};

export const deleteAmenityApi = async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_URL}/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Xóa tiện ích thất bại");
    }
};


