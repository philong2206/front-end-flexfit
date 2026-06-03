import { apiFetch } from "@/lib/apiFetch";
import { ApiError } from "./errors";

const API_URL = "/api/AI";

export const AI_UNAVAILABLE_MESSAGE = "AI hiện chưa khả dụng, vui lòng thử lại sau.";

export interface AIChatRequest {
  message: string;
}

export interface AIChatResponse {
  response: string;
}

export interface AISuggestionResponse {
  suggestion: string;
  suggestedAt?: string;
}

export type AIWorkoutSuggestion = AISuggestionResponse;
export type AIClassSuggestion = AISuggestionResponse;

async function readApiError(response: Response): Promise<ApiError> {
  const errorData = await response.json().catch(() => ({}));
  const message =
    errorData?.message ||
    errorData?.Message ||
    errorData?.detail ||
    errorData?.Detail ||
    AI_UNAVAILABLE_MESSAGE;

  const err = new ApiError(message);
  err.status = response.status;
  return err;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await readApiError(response);
  }

  return response.json() as Promise<T>;
}

export const getWorkoutSuggestionApi = async (): Promise<AIWorkoutSuggestion> => {
  const response = await apiFetch(`${API_URL}/suggest-workout`);
  return parseJsonResponse<AIWorkoutSuggestion>(response);
};

export const getClassSuggestionApi = async (): Promise<AIClassSuggestion> => {
  const response = await apiFetch(`${API_URL}/suggest-classes`);
  return parseJsonResponse<AIClassSuggestion>(response);
};

export const chatWithAIApi = async (data: AIChatRequest): Promise<AIChatResponse> => {
  const response = await apiFetch(`${API_URL}/chat`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return parseJsonResponse<AIChatResponse>(response);
};

export const suggestWorkout = getWorkoutSuggestionApi;
export const suggestClasses = getClassSuggestionApi;
export const chat = chatWithAIApi;
