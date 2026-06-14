import { getAllUsersApi } from "./users";
import { getAllGymsApi } from "./gyms";
import { getPackagesApi } from "./payment";

export interface AdminDashboardResponse {
  totalUsers: number | null;
  totalStaff: number | null;
  totalPartners: number | null;
  totalGyms: number | null;
  totalBookings: number | null; // null means API unsupported or failed
  platformGrowthData: Array<{ name: string; users: number }>;
  subscriptionData: Array<{ name: string; value: number; color: string }>;
}

const PACKAGE_COLORS = ['#60a5fa', '#34d399', '#f472b6'];
const MEMBERSHIP_PACKAGE_ORDER = ["Gói Starter", "Gói Standard", "Gói Premium"];

const unwrapArray = (res: unknown): unknown[] | null => {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const wrapper = res as Record<string, unknown>;
    for (const key of ["data", "items", "result", "results", "records"]) {
      if (key in wrapper) {
        const unwrapped = unwrapArray(wrapper[key]);
        if (unwrapped) return unwrapped;
      }
    }
  }
  return null;
};

const unwrapResponse = <T>(res: unknown): T[] => {
  return (unwrapArray(res) as T[] | null) ?? [];
};

const shouldUsePackageRecord = (next: Record<string, unknown>, current: Record<string, unknown>) => {
  const nextActive = next.isActive === true;
  const currentActive = current.isActive === true;
  if (nextActive !== currentActive) return nextActive;

  const nextPrice = typeof next.price === 'number' ? next.price : 0;
  const currentPrice = typeof current.price === 'number' ? current.price : 0;
  if (nextPrice !== currentPrice) return nextPrice > currentPrice;

  const nextDate = typeof next.createdAt === 'string' ? new Date(next.createdAt).getTime() : 0;
  const currentDate = typeof current.createdAt === 'string' ? new Date(current.createdAt).getTime() : 0;
  return nextDate > currentDate;
};

const getRoleNamesFromValue = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(getRoleNamesFromValue);
  }

  if (typeof value === 'object') {
    const role = value as Record<string, unknown>;
    const directNames = [role.role, role.roleName, role.name]
      .filter((name): name is string => typeof name === 'string');
    const nestedNames = [role.roles, role.userRoles, role.roleNavigation]
      .flatMap(getRoleNamesFromValue);

    return [...directNames, ...nestedNames];
  }

  return [];
};

const getUserRoleNames = (user: unknown) => {
  const u = user as Record<string, unknown>;
  return [u.role, u.roleName, u.roles, u.userRoles]
    .flatMap(getRoleNamesFromValue)
    .map(role => role.trim())
    .filter(Boolean);
};

const checkRole = (user: unknown, roleToCheck: string) => {
  return getUserRoleNames(user).some(role => role.toLowerCase() === roleToCheck.toLowerCase());
};

const hasAnyRoleData = (user: unknown) => getUserRoleNames(user).length > 0;

const getOwnerId = (gym: unknown) => {
  const g = gym as Record<string, unknown>;
  const owner = typeof g.owner === 'object' && g.owner !== null ? g.owner as Record<string, unknown> : null;
  const ownerId = g.ownerId ?? g.OwnerId ?? owner?.userId ?? owner?.id;
  return typeof ownerId === 'string' && ownerId.trim() ? ownerId.trim() : null;
};

export const getAdminDashboardApi = async (): Promise<AdminDashboardResponse> => {
  let users: unknown[] = [];
  let usersLoaded = false;
  try {
    const res = await getAllUsersApi();
    users = unwrapResponse(res);
    usersLoaded = true;
  } catch {
    // Keep null totals when the users endpoint is unavailable.
  }

  let gyms: unknown[] = [];
  let gymsLoaded = false;
  try {
    const res = await getAllGymsApi();
    gyms = unwrapResponse(res);
    gymsLoaded = true;
  } catch {
    // Keep null totals when the gyms endpoint is unavailable.
  }

  let packages: unknown[] = [];
  try {
    const res = await getPackagesApi();
    packages = unwrapResponse(res);
  } catch {
    // Keep package chart empty when the payment packages endpoint is unavailable.
  }

  const totalBookings: number | null = null;

  const totalUsers = usersLoaded ? users.length : null;
  const hasRoleData = usersLoaded && users.some(hasAnyRoleData);
  const totalStaff = hasRoleData ? users.filter(u => checkRole(u, "Staff")).length : null;
  const rolePartnerCount = usersLoaded ? users.filter(u => checkRole(u, "GymPartner")).length : 0;
  const uniqueOwnerIds = new Set(gyms.map(getOwnerId).filter((id): id is string => Boolean(id)));
  const totalPartners = rolePartnerCount > 0 ? rolePartnerCount : (gymsLoaded ? uniqueOwnerIds.size : null);
  const totalGyms = gymsLoaded ? gyms.length : null;

  // Process Platform Growth Data
  const growthMap = new Map<string, number>();
  users.forEach(user => {
    const u = user as Record<string, unknown>;
    if (u.createdAt && typeof u.createdAt === 'string') {
      const date = new Date(u.createdAt);
      if (!isNaN(date.getTime())) {
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        growthMap.set(monthYear, (growthMap.get(monthYear) || 0) + 1);
      }
    }
  });

  // Sort chronologically if possible, or just build array
  const platformGrowthData = Array.from(growthMap.entries()).map(([name, usersCount]) => ({
    name,
    users: usersCount
  }));

  // Process Subscription Data from GET /api/payment/packages.
  // Duplicate packageName records are reduced by active status, highest price, then newest createdAt.
  const packageMap = new Map<string, Record<string, unknown>>();
  packages.forEach(pkg => {
    const p = pkg as Record<string, unknown>;
    const name = (typeof p.packageName === 'string' ? p.packageName.trim() : (typeof p.name === 'string' ? p.name.trim() : ""));
    if (!MEMBERSHIP_PACKAGE_ORDER.includes(name)) return;

    if (!packageMap.has(name)) {
      packageMap.set(name, p);
    } else {
      const existing = packageMap.get(name)!;
      if (shouldUsePackageRecord(p, existing)) {
        packageMap.set(name, p);
      }
    }
  });

  const subscriptionData = MEMBERSHIP_PACKAGE_ORDER
    .filter(name => packageMap.has(name))
    .map((name, index) => ({
      name,
      value: 1,
      color: PACKAGE_COLORS[index % PACKAGE_COLORS.length]
    }));

  return {
    totalUsers,
    totalStaff,
    totalPartners,
    totalGyms,
    totalBookings,
    platformGrowthData,
    subscriptionData
  };
};
