/**
 * Fetch chuẩn hóa: gộp header JSON + Bearer (nếu có).
 * Bật đo thời gian: DevTools → Application → Local Storage → `FLEXFIT_DEBUG_API` = `1`
 *
 * In-memory GET cache với TTL 60 giây.
 * Dùng clearApiCache(url?) sau các mutation để invalidate.
 */

// ─── In-Memory GET Cache ────────────────────────────────────────────────────

const CACHE_TTL_MS = 60_000; // 60 giây

interface CacheEntry {
  data: unknown;
  expireAt: number;
}

const apiCache = new Map<string, CacheEntry>();

/** Xoá cache: không truyền url → xoá toàn bộ; truyền url → xoá entry đó. */
export function clearApiCache(url?: string): void {
  if (url) {
    apiCache.delete(url);
  } else {
    apiCache.clear();
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function resolveUrl(input: RequestInfo | URL): string {
  let urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl && urlStr.startsWith("/")) {
    if (baseUrl.endsWith("/api") && urlStr.startsWith("/api")) {
      urlStr = baseUrl.replace(/\/api$/, "") + urlStr;
    } else {
      urlStr = baseUrl.replace(/\/$/, "") + urlStr;
    }
  }

  return urlStr;
}

// ─── Core Fetch ─────────────────────────────────────────────────────────────

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = resolveUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();
  const isGet = method === "GET";

  // ── Serve from cache for GET requests ───────────────────────────────────
  if (isGet) {
    const cached = apiCache.get(urlStr);
    if (cached && Date.now() < cached.expireAt) {
      // Return a synthetic Response wrapping the cached JSON so callers
      // can still call response.json() the same way.
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }
  }

  // ── Execute real fetch ───────────────────────────────────────────────────
  const inputForFetch =
    typeof input === "object" && "url" in input
      ? new Request(urlStr, input as RequestInit)
      : urlStr;

  const label = traceLabel(init?.method, urlStr);
  const trace = shouldTraceApi();
  if (trace) console.time(label);

  const merged = new Headers(getDefaultApiHeaders());
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => merged.set(k, v));
  }

  let response: Response;
  try {
    response = await fetch(inputForFetch, { ...init, headers: merged });
  } finally {
    if (trace) console.timeEnd(label);
  }

  // ── Cache successful GET responses ───────────────────────────────────────
  if (isGet && response.ok) {
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      apiCache.set(urlStr, { data, expireAt: Date.now() + CACHE_TTL_MS });
      // Return a fresh Response so the caller's response.json() still works
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    } catch {
      // Non-JSON GET response — just return the original without caching
    }
  }

  return response;
}
