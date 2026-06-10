import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Shield, ShieldCheck, UserCheck, Users } from "lucide-react";
import { getClassesForStaffApi } from "@/api/classes";
import { getLogsForManagerApi, type CheckInLogDto } from "@/api/checkInLog";
import { RoleSettingsPage, type SettingsStat } from "@/components/settings/RoleSettingsPage";

type StaffStats = {
  checkInsToday: number;
  checkInsThisWeek: number;
  classesToday: number;
  supportedMembers: number;
};

const getLogTime = (log: CheckInLogDto) => log.checkInTime || log.checkInAt || log.scannedAt;

const isSameDay = (date: Date, compare: Date) =>
  date.getFullYear() === compare.getFullYear() &&
  date.getMonth() === compare.getMonth() &&
  date.getDate() === compare.getDate();

const getWeekStart = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
};

export default function StaffSettingsPage() {
  const [stats, setStats] = useState<StaffStats>({
    checkInsToday: 0,
    checkInsThisWeek: 0,
    classesToday: 0,
    supportedMembers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoadingStats(true);
      const [logs, classes] = await Promise.all([
        getLogsForManagerApi().catch(() => []),
        getClassesForStaffApi().catch(() => []),
      ]);

      if (!mounted) return;

      const now = new Date();
      const weekStart = getWeekStart(now);
      const validLogs = logs
        .map((log) => ({ log, date: new Date(getLogTime(log) || "") }))
        .filter((item) => !Number.isNaN(item.date.getTime()));
      const todayLogs = validLogs.filter((item) => isSameDay(item.date, now));
      const weekLogs = validLogs.filter((item) => item.date >= weekStart && item.date <= now);
      const classTodayCount = classes.filter((item) => {
        const date = new Date(item.startTime);
        return !Number.isNaN(date.getTime()) && isSameDay(date, now);
      }).length;
      const supportedMembers = new Set(todayLogs.map((item) => item.log.userId).filter(Boolean)).size;

      setStats({
        checkInsToday: todayLogs.length,
        checkInsThisWeek: weekLogs.length,
        classesToday: classTodayCount,
        supportedMembers,
      });
      setLoadingStats(false);
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const profileExtra = useMemo(
    () => (
      <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Chi nhánh công tác theo phân quyền hiện tại
      </div>
    ),
    []
  );

  const statCards: SettingsStat[] = [
    { label: "Lượt check-in hôm nay", value: stats.checkInsToday, icon: UserCheck, color: "text-emerald-400" },
    { label: "Lượt check-in tuần này", value: stats.checkInsThisWeek, icon: CalendarDays, color: "text-emerald-400" },
    { label: "Lớp học hôm nay", value: stats.classesToday, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Hội viên hỗ trợ", value: stats.supportedMembers, icon: Users, color: "text-emerald-400" },
  ];

  return (
    <RoleSettingsPage
      title="Cài đặt nhân viên"
      subtitle="Quản lý tài khoản, ca làm việc và thông báo nội bộ."
      roleLabel="Staff"
      roleIcon={Shield}
      statsTitle="Thống kê ca làm việc"
      statsDescription="Tổng quan nhanh về lượt check-in và lớp học trong phạm vi nhân viên."
      stats={statCards}
      statsLoading={loadingStats}
      profileExtra={profileExtra}
    />
  );
}
