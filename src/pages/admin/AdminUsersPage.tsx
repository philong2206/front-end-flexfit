import { useState, useEffect } from "react";
import { Search, Lock, Unlock, Trash2, Shield, ShieldOff, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllUsersApi, changeUserStatusApi, deleteUserApi, assignRoleApi, revokeRoleApi } from "@/api/users";
import type { UserDto } from "@/api/users";
import { getAllGymsApi, type GymDto } from "@/api/gyms";
import { getAllBranchesApi, type BranchDto } from "@/api/branches";
import { getUserTransactionHistoryApi, formatCreditAmount, getCreditTransactionTypeLabel, type CreditTransactionResponse } from "@/api/creditPackages";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROLES = ["Member", "GymPartner", "Staff", "Admin"];

const getUserRoleNames = (user: unknown): string[] => {
  const getRoleNamesFromValue = (value: unknown): string[] => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(getRoleNamesFromValue);
    if (typeof value === 'object') {
      const role = value as Record<string, unknown>;
      const directNames = [role.role, role.roleName, role.name].filter((name): name is string => typeof name === 'string');
      const nestedNames = [role.roles, role.userRoles, role.roleNavigation].flatMap(getRoleNamesFromValue);
      return [...directNames, ...nestedNames];
    }
    return [];
  };
  const u = user as Record<string, unknown>;
  return [u.role, u.roleName, u.roles, u.userRoles]
    .flatMap(getRoleNamesFromValue)
    .map(role => role.trim())
    .filter(Boolean);
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    user: UserDto | null;
    type: "assign" | "revoke";
  }>({
    isOpen: false,
    user: null,
    type: "assign"
  });
  const [selectedRole, setSelectedRole] = useState<string>(ROLES[0]);
  const [selectedRelationId, setSelectedRelationId] = useState("");
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [relationLoading, setRelationLoading] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const [creditModal, setCreditModal] = useState<{
    isOpen: boolean;
    user: UserDto | null;
  }>({ isOpen: false, user: null });
  const [creditHistory, setCreditHistory] = useState<CreditTransactionResponse[]>([]);
  const [creditLoading, setCreditLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getAllUsersApi();
      setUsers(data);
    } catch {
      setUsers([]);
      setLoadError("Không thể tải danh sách người dùng");
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

  useEffect(() => {
    if (!roleModal.isOpen || roleModal.type !== "assign") return;

    if (selectedRole !== "GymPartner" && selectedRole !== "Staff") {
      setSelectedRelationId("");
      return;
    }

    let isMounted = true;
    const loadRelationOptions = async () => {
      try {
        setRelationLoading(true);
        if (selectedRole === "GymPartner" && gyms.length === 0) {
          const data = await getAllGymsApi();
          if (isMounted) setGyms(data);
        }
        if (selectedRole === "Staff" && branches.length === 0) {
          const data = await getAllBranchesApi();
          if (isMounted) setBranches(data);
        }
      } catch {
        toast.error(selectedRole === "GymPartner" ? "Không thể tải danh sách phòng gym" : "Không thể tải danh sách chi nhánh");
      } finally {
        if (isMounted) setRelationLoading(false);
      }
    };

    loadRelationOptions();
    return () => {
      isMounted = false;
    };
  }, [roleModal.isOpen, roleModal.type, selectedRole, gyms.length, branches.length]);

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
        } catch {
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
        } catch {
          toast.error("Xóa tài khoản thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const submitRoleChange = async () => {
    if (!roleModal.user) return;
    if (roleModal.type === "assign" && selectedRole === "GymPartner" && !selectedRelationId) {
      toast.error("Vui lòng chọn phòng gym cho đối tác");
      return;
    }
    if (roleModal.type === "assign" && selectedRole === "Staff" && !selectedRelationId) {
      toast.error("Vui lòng chọn chi nhánh cho nhân viên");
      return;
    }

    setIsSubmittingRole(true);
    try {
      if (roleModal.type === "assign") {
        const payload = {
          userId: roleModal.user.userId,
          role: selectedRole,
          gymId: selectedRole === "GymPartner" ? selectedRelationId : undefined,
          branchId: selectedRole === "Staff" ? selectedRelationId : undefined,
        };
        console.log("ASSIGN ROLE PAYLOAD:", payload);
        await assignRoleApi(payload);
        toast.success(`Đã gán vai trò ${selectedRole} thành công!`);
      } else {
        await revokeRoleApi(roleModal.user.userId, selectedRole);
        toast.success(`Đã thu hồi vai trò ${selectedRole} thành công!`);
      }
      await fetchUsers(); // refresh the list to get new roles
      setRoleModal({ isOpen: false, user: null, type: "assign" });
      setSelectedRelationId("");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Thao tác thất bại");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const openCreditHistory = async (user: UserDto) => {
    setCreditModal({ isOpen: true, user });
    setCreditLoading(true);
    try {
      const data = await getUserTransactionHistoryApi(user.userId);
      setCreditHistory(data);
    } catch {
      toast.error("Không thể tải lịch sử credit");
      setCreditHistory([]);
    } finally {
      setCreditLoading(false);
    }
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
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Phòng gym/Chi nhánh</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Đăng nhập lần cuối</th>
                  <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">Đang tải dữ liệu...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-red-400">{loadError}</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleNames = getUserRoleNames(user);
                    const linkedItems = [
                      user.assignedGymName ? `Gym: ${user.assignedGymName}` : "",
                      user.assignedBranchName ? `Chi nhánh: ${user.assignedBranchName}` : "",
                    ].filter(Boolean);
                    return (
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
                        {roleNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {roleNames.map((r, i) => (
                              <span key={i} className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">---</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {linkedItems.length > 0 ? (
                          <div className="space-y-1 text-xs text-white">
                            {linkedItems.map((item) => (
                              <div key={item}>{item}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">---</span>
                        )}
                      </td>
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
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-primary hover:text-primary/80" onClick={() => {
                            setRoleModal({ isOpen: true, user, type: "assign" });
                            setSelectedRole(ROLES[0]);
                            setSelectedRelationId("");
                          }} title="Gán vai trò">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-orange-400 hover:text-orange-300" onClick={() => {
                            setRoleModal({ isOpen: true, user, type: "revoke" });
                            setSelectedRole(roleNames[0] || ROLES[0]);
                            setSelectedRelationId("");
                          }} title="Thu hồi vai trò">
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-emerald-400 hover:text-emerald-300" onClick={() => openCreditHistory(user)} title="Lịch sử credit">
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className={`h-8 p-1 px-2 ${user.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-green-400 hover:text-green-300'}`} onClick={() => handleStatusChange(user.userId, user.isActive)} title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
                            {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-red-400 hover:text-red-300" onClick={() => handleDelete(user.userId)} title="Xóa người dùng">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )})
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

      <Dialog open={roleModal.isOpen} onOpenChange={(open) => {
        setRoleModal(prev => ({ ...prev, isOpen: open }));
        if (!open) setSelectedRelationId("");
      }}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{roleModal.type === "assign" ? "Gán vai trò cho người dùng" : "Thu hồi vai trò của người dùng"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {roleModal.user?.fullName} ({roleModal.user?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn vai trò</label>
                <select 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSelectedRelationId("");
                  }}
                >
                  {roleModal.type === "revoke" && roleModal.user ? (
                    getUserRoleNames(roleModal.user).length > 0 ? (
                      getUserRoleNames(roleModal.user).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))
                    ) : (
                      <option value="" disabled>Người dùng này chưa có vai trò nào</option>
                    )
                  ) : (
                    ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))
                  )}
                </select>
              </div>
              {roleModal.type === "assign" && selectedRole === "GymPartner" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phòng gym quản lý</label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary"
                    value={selectedRelationId}
                    onChange={(e) => setSelectedRelationId(e.target.value)}
                    disabled={relationLoading}
                  >
                    <option value="">{relationLoading ? "Đang tải danh sách..." : "Chọn phòng gym / đối tác"}</option>
                    {gyms.map((gym) => (
                      <option key={gym.gymId} value={gym.gymId}>
                        {gym.gymName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {roleModal.type === "assign" && selectedRole === "Staff" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chi nhánh làm việc</label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary"
                    value={selectedRelationId}
                    onChange={(e) => setSelectedRelationId(e.target.value)}
                    disabled={relationLoading}
                  >
                    <option value="">{relationLoading ? "Đang tải danh sách..." : "Chọn chi nhánh"}</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setRoleModal(prev => ({ ...prev, isOpen: false }));
              setSelectedRelationId("");
            }}>
              Hủy
            </Button>
            <Button onClick={submitRoleChange} disabled={isSubmittingRole || relationLoading || (roleModal.type === "revoke" && !selectedRole)}>
              {isSubmittingRole ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creditModal.isOpen} onOpenChange={(open) => setCreditModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử biến động Credit</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Người dùng: <span className="text-white font-bold">{creditModal.user?.fullName}</span> ({creditModal.user?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {creditLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải lịch sử...</div>
            ) : creditHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Người dùng này chưa có giao dịch credit nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/20">
                    <tr>
                      <th className="px-4 py-3">Mã GD</th>
                      <th className="px-4 py-3">Biến động</th>
                      <th className="px-4 py-3">Số dư sau GD</th>
                      <th className="px-4 py-3">Loại GD</th>
                      <th className="px-4 py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {creditHistory.map((item) => (
                      <tr key={item.transactionId} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {(item.transactionId || "").slice(0, 8)}
                        </td>
                        <td className={`px-4 py-3 font-bold ${(item.amount || 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {formatCreditAmount(item.amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-white">{item.balanceAfter || 0}</td>
                        <td className="px-4 py-3 text-white">
                          {getCreditTransactionTypeLabel(item.type || "")}
                          <div className="text-[10px] text-muted-foreground">{item.description}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm") : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
