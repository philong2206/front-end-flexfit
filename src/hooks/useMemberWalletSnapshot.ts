import { useEffect, useState, useCallback } from "react";
import {
  getUserCreditWalletApi,
  getUserTransactionHistoryApi,
  type CreditTransactionResponse,
  type CreditWalletResponse,
} from "@/api/creditPackages";
import { withShortLivedCache, invalidateShortLivedCache } from "@/lib/simpleGetCache";
import { normalizeApiError } from "@/lib/normalizeApiError";
import { toast } from "sonner";

const WALLET_CACHE_PREFIX = "wallet-snap:";

function pickLatestDeposit(txns: CreditTransactionResponse[]) {
  return txns
    .filter((t) => t.amount > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function tierFromWallet(wallet: CreditWalletResponse, txns: CreditTransactionResponse[], lang: "en" | "vi"): string {
  const latestDeposit = pickLatestDeposit(txns);
  const vi = (s: string) => `Thành viên FLEXFIT ${s}`;
  const en = (s: string) => `${s} Member`;

  if (latestDeposit?.description) {
    const desc = latestDeposit.description.toLowerCase();
    if (desc.includes("elite") || desc.includes("ultimate")) {
      return lang === "vi" ? vi("Elite") : en("Elite");
    }
    if (desc.includes("pro") || desc.includes("boost")) {
      return lang === "vi" ? vi("Pro") : en("Pro");
    }
    if (desc.includes("starter")) {
      return lang === "vi" ? vi("Starter") : en("Starter");
    }
    if (latestDeposit.amount >= 260) return lang === "vi" ? vi("Elite") : en("Elite");
    if (latestDeposit.amount >= 100) return lang === "vi" ? vi("Pro") : en("Pro");
    if (latestDeposit.amount > 0) return lang === "vi" ? vi("Starter") : en("Starter");
  }

  const earned = wallet.totalEarned || wallet.balance;
  if (earned >= 260) return lang === "vi" ? vi("Elite") : en("Elite");
  if (earned >= 100) return lang === "vi" ? vi("Pro") : en("Pro");
  if (earned > 0) return lang === "vi" ? vi("Starter") : en("Starter");
  return lang === "vi" ? vi("Basic") : en("Basic");
}

async function fetchWalletSnapshot(userId: string, lang: "en" | "vi") {
  const [wallet, txns] = await Promise.all([
    getUserCreditWalletApi(userId),
    getUserTransactionHistoryApi(userId).catch((): CreditTransactionResponse[] => []),
  ]);
  return {
    balance: wallet.balance,
    tier: tierFromWallet(wallet, txns, lang),
  };
}

/**
 * Gộp wallet + tier, cache ngắn + dedupe (layout + profile không gọi lặp liên tục).
 * `wallet-update` → xóa cache và fetch lại.
 */
export function useMemberWalletSnapshot(userId: string | undefined, lang: "en" | "vi") {
  const [balance, setBalance] = useState<number | null>(null);
  const [tier, setTier] = useState<string>(lang === "vi" ? "Thành viên FLEXFIT Basic" : "Basic Member");
  const [loading, setLoading] = useState(false);
  const [walletTick, setWalletTick] = useState(0);

  useEffect(() => {
    const onWallet = () => {
      if (userId) invalidateShortLivedCache(`${WALLET_CACHE_PREFIX}${userId}:`);
      setWalletTick((t) => t + 1);
    };
    window.addEventListener("wallet-update", onWallet);
    return () => window.removeEventListener("wallet-update", onWallet);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setBalance(null);
      setTier(lang === "vi" ? "Thành viên FLEXFIT Basic" : "Basic Member");
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    const cacheKey = `${WALLET_CACHE_PREFIX}${userId}:${lang}`;

    withShortLivedCache(cacheKey, 20_000, () => fetchWalletSnapshot(userId, lang))
      .then((snap) => {
        if (!alive) return;
        setBalance(snap.balance);
        setTier(snap.tier);
      })
      .catch((err) => {
        if (!alive) return;
        // Show toast error instead of silently failing
        const errorMessage = normalizeApiError(err);
        toast.error("Không thể tải số credit", {
          description: errorMessage,
          duration: 4000,
        });
        // Keep placeholder values
        setBalance(null);
        setTier(lang === "vi" ? "Thành viên FLEXFIT Basic" : "Basic Member");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId, lang, walletTick]);

  const refresh = useCallback(() => {
    if (userId) invalidateShortLivedCache(`${WALLET_CACHE_PREFIX}${userId}:`);
    setWalletTick((t) => t + 1);
  }, [userId]);

  return { balance, tier, loading, refresh };
}
