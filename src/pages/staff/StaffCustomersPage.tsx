import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllUsersApi, type UserDto } from "@/api/users";
import { getLogsForManagerApi, type CheckInLogDto } from "@/api/checkInLog";
import { getStaffCheckInBookingsApi, type BookingResponse } from "@/api/bookings";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StaffCustomersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [usersData, logsData, bookingsData] = await Promise.all([
          getAllUsersApi().catch(() => [] as UserDto[]),
          getLogsForManagerApi().catch(() => [] as CheckInLogDto[]),
          getStaffCheckInBookingsApi().catch(() => [] as BookingResponse[]),
        ]);

        // Identify unique user IDs who have interacted with this branch
        const branchUserIds = new Set<string>();
        logsData.forEach(log => { if (log.userId) branchUserIds.add(log.userId); });

        // Actually, let's check checkInLog.ts again. CheckInLogDto HAS userId.
        // BookingResponse is mainly for check-in where you search by code.
        // If a booking is found, it has user info.

        // Let's assume bookingsData has userId or we can get it from usersData by email
        bookingsData.forEach(booking => {
          if (booking.userEmail) {
            const user = (usersData as UserDto[]).find(u => u.email === booking.userEmail);
            if (user) branchUserIds.add(user.userId);
          }
        });

        // Filter all users to only show those who have a booking or check-in log at this branch
        const filtered = usersData.filter(u => branchUserIds.has(u.userId));
        setUsers(filtered);
      } catch {
        toast.error("Không thể tải danh sách hội viên");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Quản lý Hội viên</h1>
      <Card className="bg-secondary border-white/5">
        <CardHeader className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-white">Danh sách Hội viên</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary transition-colors"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không tìm thấy hội viên"
              description={searchTerm ? "Thử tìm kiếm với từ khóa khác." : "Chưa có dữ liệu hội viên."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg font-medium">Hội viên</th>
                    <th className="px-4 py-3 font-medium">Liên hệ</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Ngày tham gia</th>
                    <th className="px-4 py-3 rounded-r-lg font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                              {u.fullName?.charAt(0) || "U"}
                            </div>
                          )}
                          <span className="font-semibold text-white">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs">{u.email}</div>
                        <div className="text-xs">{u.phoneNumber || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.isActive ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-4 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8 border-white/10 text-white hover:bg-white/10" onClick={() => setSelectedUser(u)}>Chi tiết</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open: boolean) => !open && setSelectedUser(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Chi tiết Hội viên</DialogTitle>
            <DialogDescription>Thông tin tổng quan của khách hàng</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-4">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-16 h-16 rounded-full border-2 border-primary/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl border-2 border-primary/20">
                    {selectedUser.fullName?.charAt(0) || "U"}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${selectedUser.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {selectedUser.isActive ? "Đang hoạt động" : "Bị khóa"}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Số điện thoại</p>
                  <p className="font-medium">{selectedUser.phoneNumber || "Chưa cập nhật"}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Ngày tham gia</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Đăng nhập lần cuối</p>
                  <p className="font-medium">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Chưa từng đăng nhập"}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Xác thực Email</p>
                  <p className="font-medium">{selectedUser.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
