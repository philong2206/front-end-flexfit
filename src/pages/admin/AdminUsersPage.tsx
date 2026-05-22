import { useState, useEffect } from "react";
import { Search, Lock, Unlock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllUsersApi, changeUserStatusApi, deleteUserApi } from "@/api/users";
import type { UserDto } from "@/api/users";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {}
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsersApi();
      setUsers(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = (id: string, currentStatus: boolean) => {
    const user = users.find(u => u.userId === id);
    if (!user) return;

    const title = currentStatus ? "Tạm khóa người dùng" : "Mở khóa người dùng";
    const confirmMsg = currentStatus
      ? `Bạn có chắc chắn muốn TẠM DỪNG (Khóa) hoạt động của tài khoản "${user.fullName}" (${user.email})?`
      : `Bạn có chắc chắn muốn KÍCH HOẠT hoạt động của tài khoản "${user.fullName}" (${user.email})?`;

    setConfirmModal({
      isOpen: true,
      title,
      message: confirmMsg,
      type: currentStatus ? "warning" : "info",
      onConfirm: async () => {
        try {
          await changeUserStatusApi(id, !currentStatus);
          setUsers(users.map(u => u.userId === id ? { ...u, isActive: !currentStatus } : u));
          toast.success(currentStatus ? "Đã tạm khóa người dùng!" : "Đã mở khóa người dùng thành công!");
        } catch (error) {
          console.error("Lỗi khi đổi trạng thái:", error);
          toast.error("Thay đổi trạng thái thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.userId === id);
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa tài khoản người dùng",
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${user.fullName}" (${user.email})? Thao tác này không thể khôi phục!`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteUserApi(id);
          setUsers(users.filter(u => u.userId !== id));
          toast.success("Đã xóa tài khoản vĩnh viễn!");
        } catch (error) {
          console.error("Lỗi khi xóa người dùng:", error);
          toast.error("Xóa tài khoản thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý Người dùng</h1>
          <p className="text-muted-foreground text-lg">Quản trị và theo dõi danh sách thành viên trong hệ thống.</p>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Danh sách người dùng</CardTitle>
              <CardDescription>Tất cả {users.length} tài khoản</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên, email..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-medium">Người dùng</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Đăng nhập lần cuối</th>
                  <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="font-medium text-white">{user.fullName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{user.email}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.isActive ? "Hoạt động" : "Bị Khóa"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 w-8 p-0 ${user.isActive ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10' : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'}`}
                            onClick={() => handleStatusChange(user.userId, user.isActive)}
                            title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDelete(user.userId)}
                            title="Xóa người dùng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
