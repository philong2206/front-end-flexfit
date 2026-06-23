import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/amenities`;

export interface AmenityDto {
    amenityId: string;
    amenityName: string;
    iconUrl: string;
    description: string;
}

export const getAmenitiesApi = async (): Promise<AmenityDto[]> => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
        throw new Error("Lấy danh sách tiện ích thất bại");
    }
    return response.json();
};
