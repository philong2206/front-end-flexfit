import { useEffect, useState, useCallback, useRef } from "react";
import { getMyProfileApi, type MemberProfileResponse } from "@/api/memberProfiles";
import { ApiUnauthorizedError } from "@/api/errors";
import { withShortLivedCache, invalidateShortLivedCache } from "@/lib/simpleGetCache";

const PROFILE_ME_CACHE = "GET:/api/profiles/me";

/**
 * Tải hồ sơ /me có cache ngắn + dedupe (StrictMode / chuyển tab).
 * Gọi `invalidateProfileCache()` sau khi PUT cập nhật thành công.
 */
export function invalidateProfileCache(): void {
  invalidateShortLivedCache(PROFILE_ME_CACHE);
}

export function useMemberProfile(userId: string | undefined, onUnauthorized?: () => void) {
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const onUnauthRef = useRef(onUnauthorized);
  onUnauthRef.current = onUnauthorized;

  const refetch = useCallback(() => {
    invalidateProfileCache();
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!userId || !localStorage.getItem("access_token")) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    withShortLivedCache(PROFILE_ME_CACHE, 12_000, () => getMyProfileApi())
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch((err) => {
        if (err instanceof ApiUnauthorizedError) onUnauthRef.current?.();
        if (alive) setProfile(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId, tick]);

  return { profile, loading, refetch };
}
