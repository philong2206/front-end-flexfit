/**
 * Fetch chuẩn hóa: gộp header JSON + Bearer (nếu có).
 * Bật đo thời gian: DevTools → Application → Local Storage → `FLEXFIT_DEBUG_API` = `1`
 */
export function getDefaultApiHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function shouldTraceApi(): boolean {
  return (
    import.meta.env.DEV &&
    typeof localStorage !== "undefined" &&
    localStorage.getItem("FLEXFIT_DEBUG_API") === "1"
  );
}

function traceLabel(method: string | undefined, url: string): string {
  return `[API] ${method || "GET"} ${url}`;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  const method = init?.method;
  const label = traceLabel(method, url);
  const trace = shouldTraceApi();
  if (trace) console.time(label);

  const merged = new Headers(getDefaultApiHeaders());
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => merged.set(k, v));
  }

  try {
    return await fetch(input, { ...init, headers: merged });
  } finally {
    if (trace) console.timeEnd(label);
  }
}
