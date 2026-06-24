export const FITNESS_FALLBACK_IMAGE = "/fallback-fitness.svg";

export function resolveFitnessImage(url: string | null | undefined): string {
  if (!url) return FITNESS_FALLBACK_IMAGE;

  const trimmed = url.trim();
  if (!trimmed) return FITNESS_FALLBACK_IMAGE;

  // 1. Nếu là URL tuyệt đối hoặc Base64
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  ) {
    if (trimmed.includes('example.com')) return FITNESS_FALLBACK_IMAGE;
    return trimmed;
  }

  // 2. Ngược lại coi là filename và nối với endpoint backend
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}/api/Images/get-image?fileName=${trimmed}`;
}
