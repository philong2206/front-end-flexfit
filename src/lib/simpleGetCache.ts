/**
 * Cache GET ngắn hạn + gộp request đang bay (dedupe StrictMode / nhiều component cùng gọi).
 * Phù hợp dữ liệu ít thay đổi (danh sách lớp, chi nhánh).
 */
type Entry<T> = {
  expiresAt: number;
  data?: T;
  promise?: Promise<T>;
};

const store = new Map<string, Entry<unknown>>();

export function withShortLivedCache<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit?.data !== undefined && hit.expiresAt > now) {
    return Promise.resolve(hit.data);
  }
  if (hit?.promise) return hit.promise;

  const promise = factory()
    .then((data) => {
      store.set(key, { expiresAt: Date.now() + ttlMs, data });
      return data;
    })
    .catch((err) => {
      store.delete(key);
      throw err;
    })
    .finally(() => {
      const cur = store.get(key) as Entry<T> | undefined;
      if (cur && cur.promise === promise) {
        store.set(key, { expiresAt: cur.expiresAt, data: cur.data });
      }
    });

  store.set(key, { expiresAt: 0, promise });
  return promise;
}

export function invalidateShortLivedCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear();
    return;
  }
  for (const k of store.keys()) {
    if (k.startsWith(keyPrefix)) store.delete(k);
  }
}
