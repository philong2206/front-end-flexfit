import { useMemo } from "react";
import { parseJwt } from "@/lib/utils";
import type { User } from "@/contexts/AuthContext";

/** userId từ context hoặc từ JWT khi context chưa kịp sync. */
export function useResolvedUserId(user: User | null | undefined): string | undefined {
  return useMemo(() => {
    if (user?.userId) return user.userId;
    const t = localStorage.getItem("access_token");
    if (!t) return undefined;
    const p = parseJwt(t);
    return typeof p?.sub === "string" ? p.sub : undefined;
  }, [user?.userId]);
}
