import { useEffect, useState } from "react";
import { Building2, Layers, Shield, Store, Users } from "lucide-react";
import { RoleSettingsPage, type SettingsStat } from "@/components/settings/RoleSettingsPage";
import {
  getPartnerBranches,
  getPartnerClasses,
  getPartnerCustomers,
  getPartnerGyms,
} from "@/services/partnerApi";

type PartnerStats = {
  gyms: number;
  branches: number;
  classes: number;
  customers: number;
};

const safeArrayLength = (value: unknown) => {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data.length;
    if (Array.isArray(record.items)) return record.items.length;
    if (Array.isArray(record.gyms)) return record.gyms.length;
    if (Array.isArray(record.branches)) return record.branches.length;
    if (Array.isArray(record.classes)) return record.classes.length;
    if (Array.isArray(record.customers)) return record.customers.length;
  }
  return 0;
};

export default function PartnerSettingsPage() {
  const [stats, setStats] = useState<PartnerStats>({ gyms: 0, branches: 0, classes: 0, customers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoadingStats(true);
      const [gyms, branches, classes, customers] = await Promise.all([
        getPartnerGyms().catch(() => []),
        getPartnerBranches().catch(() => []),
        getPartnerClasses().catch(() => []),
        getPartnerCustomers().catch(() => []),
      ]);

      if (!mounted) return;
      setStats({
        gyms: safeArrayLength(gyms),
        branches: safeArrayLength(branches),
        classes: safeArrayLength(classes),
        customers: safeArrayLength(customers),
      });
      setLoadingStats(false);
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards: SettingsStat[] = [
    { label: "Tổng số cơ sở", value: stats.gyms, icon: Building2, color: "text-emerald-400" },
    { label: "Tổng số chi nhánh", value: stats.branches, icon: Store, color: "text-emerald-400" },
    { label: "Tổng số lớp học", value: stats.classes, icon: Layers, color: "text-emerald-400" },
    { label: "Tổng số hội viên", value: stats.customers, icon: Users, color: "text-emerald-400" },
  ];

  return (
    <RoleSettingsPage
      title="Cài đặt đối tác"
      subtitle="Quản lý tài khoản, hệ thống và thông báo của đối tác."
      roleLabel="Gym Partner"
      roleIcon={Shield}
      statsTitle="Quản lý hệ thống"
      statsDescription="Thống kê nhanh các dữ liệu đang thuộc quyền quản lý."
      stats={statCards}
      statsLoading={loadingStats}
    />
  );
}
