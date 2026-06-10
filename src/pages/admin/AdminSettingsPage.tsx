import { useEffect, useState } from "react";
import { Building2, Shield, ShieldCheck, UserCog, Users } from "lucide-react";
import { getAdminDashboardApi } from "@/api/adminDashboard";
import { RoleSettingsPage, type SettingsStat } from "@/components/settings/RoleSettingsPage";

type AdminStats = {
  users: number | null;
  partners: number | null;
  staff: number | null;
  gyms: number | null;
};

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<AdminStats>({ users: null, partners: null, staff: null, gyms: null });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoadingStats(true);
      const dashboard = await getAdminDashboardApi().catch(() => null);

      if (!mounted) return;
      setStats({
        users: dashboard?.totalUsers ?? null,
        partners: dashboard?.totalPartners ?? null,
        staff: dashboard?.totalStaff ?? null,
        gyms: dashboard?.totalGyms ?? null,
      });
      setLoadingStats(false);
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards: SettingsStat[] = [
    { label: "Tổng người dùng", value: stats.users, icon: Users, color: "text-emerald-400", emptyLabel: "Không tải được dữ liệu người dùng" },
    { label: "Tổng đối tác", value: stats.partners, icon: ShieldCheck, color: "text-emerald-400", emptyLabel: "Không tải được dữ liệu đối tác" },
    { label: "Tổng nhân viên", value: stats.staff, icon: UserCog, color: "text-emerald-400", emptyLabel: "Chưa có dữ liệu nhân viên" },
    { label: "Tổng phòng tập", value: stats.gyms, icon: Building2, color: "text-emerald-400", emptyLabel: "Không tải được dữ liệu phòng tập" },
  ];

  return (
    <RoleSettingsPage
      title="Cài đặt quản trị"
      subtitle="Quản lý tài khoản quản trị, hệ thống và thông báo nền tảng."
      roleLabel="Admin"
      roleIcon={Shield}
      statsTitle="Thống kê hệ thống"
      statsDescription="Tổng quan nhanh về người dùng, đối tác và dữ liệu nền tảng."
      stats={statCards}
      statsLoading={loadingStats}
    />
  );
}
