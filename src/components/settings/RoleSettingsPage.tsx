import { useMemo, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { useAuth, type User as AuthUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IconType = ComponentType<{ className?: string }>;

export type SettingsStat = {
  label: string;
  value: number | null;
  icon: IconType;
  color?: string;
  emptyLabel?: string;
};

type RoleSettingsPageProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  roleIcon: IconType;
  statsTitle: string;
  statsDescription: string;
  stats: SettingsStat[];
  statsLoading?: boolean;
  profileExtra?: ReactNode;
  mainExtra?: ReactNode;
};

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("flexfit_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function LoadingValue() {
  return <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-white/10 align-middle" />;
}

function StatValue({ item }: { item: SettingsStat }) {
  if (item.value === null) {
    return (
      <span title={item.emptyLabel} className="text-3xl font-bold text-white">
        --
      </span>
    );
  }

  return <>{item.value.toLocaleString("vi-VN")}</>;
}

export function RoleSettingsPage({
  title,
  subtitle,
  roleLabel,
  roleIcon: RoleIcon,
  statsTitle,
  statsDescription,
  stats,
  statsLoading = false,
  profileExtra,
  mainExtra,
}: RoleSettingsPageProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayUser = useMemo(() => user ?? getStoredUser(), [user]);
  const name = displayUser?.fullName || "FlexFit User";
  const email = displayUser?.email || "user@flexfit.local";
  const initial = name.trim().charAt(0).toUpperCase() || "F";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-lg">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-6 xl:col-span-1">
          <Card className="overflow-hidden rounded-2xl border-white/10 bg-[#182235] shadow-none">
            <div className="h-24 bg-gradient-to-br from-emerald-500/35 via-emerald-500/20 to-slate-500/10" />
            <CardContent className="relative px-6 pb-6 pt-0">
              <div className="-mt-12 mb-4 flex justify-center">
                {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full border-4 border-[#182235] object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#182235] bg-emerald-500/15 text-3xl font-bold text-emerald-400">
                    {initial}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-center">
                <div>
                  <h2 className="text-xl font-bold text-white">{name}</h2>
                  <p className="mt-1 break-all text-sm text-slate-400">{email}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge className="border-slate-500/20 bg-slate-500/15 text-slate-300">
                    <RoleIcon className="mr-1.5 h-3.5 w-3.5" />
                    {roleLabel}
                  </Badge>
                  <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-400">
                    Đang hoạt động
                  </Badge>
                </div>
                {profileExtra}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleLogout}
            variant="destructive"
            className="h-12 w-full rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card className="rounded-2xl border-white/10 bg-[#182235] shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-emerald-400" />
                {statsTitle}
              </CardTitle>
              <CardDescription>{statsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-[#101827] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">{item.label}</p>
                          <p className="mt-2 text-3xl font-bold text-white">
                            {statsLoading ? <LoadingValue /> : <StatValue item={item} />}
                          </p>
                          {!statsLoading && item.value === null && item.emptyLabel && (
                            <p className="mt-1 text-xs text-slate-500">{item.emptyLabel}</p>
                          )}
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                          <Icon className={`h-6 w-6 ${item.color || "text-emerald-400"}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {mainExtra}
        </div>
      </div>
    </div>
  );
}
