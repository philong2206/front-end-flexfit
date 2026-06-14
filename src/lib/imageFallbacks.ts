export const FITNESS_FALLBACK_IMAGE = "/fallback-fitness.svg";

export function resolveFitnessImage(url: string | null | undefined): string {
  if (!url) return FITNESS_FALLBACK_IMAGE;

  const trimmed = url.trim();
  if (!trimmed) return FITNESS_FALLBACK_IMAGE;

  try {
    const parsed = new URL(trimmed, window.location.origin);

    const isExample =
      parsed.hostname === "example.com" ||
      parsed.hostname.endsWith(".example.com");

    if (isExample) return FITNESS_FALLBACK_IMAGE;

    return trimmed;
  } catch {
    return trimmed;
  }
}