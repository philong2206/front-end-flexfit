import { useState, useEffect, useMemo } from "react";
import { Search, CheckCircle, XCircle, Trash2, ShieldAlert, Star, Plus, Edit2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllGymsApi, changeGymStatusApi, deleteGymApi, createGymApi, updateGymApi, transferGymOwnershipApi, type GymDto } from "@/api/gyms";
import { getAllUsersApi, type UserDto } from "@/api/users";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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

export default function AdminPartnersPage() {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false, title: "", message: "", type: "info", onConfirm: () => {}
  });

  // Modal states
  const [gymModal, setGymModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    gym: GymDto | null;
  }>({ isOpen: false, mode: "create", gym: null });

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    gym: GymDto | null;
  }>({ isOpen: false, gym: null });

  // Form states
  const [formData, setFormData] = useState({
    ownerId: "",
    gymName: "",
    description: "",
    thumbnailUrl: "",
    phoneNumber: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferOwnerId, setTransferOwnerId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [gymData, userData] = await Promise.all([
        getAllGymsApi(),
        getAllUsersApi().catch(() => [])
      ]);
      setGyms(gymData);
      setUsers(userData);
    } catch {
      setGyms([]);
      setLoadError("Không thể tải danh sách đối tác phòng tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = (id: string, status: "Approved" | "Rejected") => {
    const gym = gyms.find(g => g.gymId === id);
    if (!gym) return;

    const title = status === "Approved" ? "Xác nhận kích hoạt" : "Xác nhận tạm dừng";
    const confirmMsg = status === "Approved"
      ? (gym.status === "Rejected"
          ? `Bạn có chắc chắn muốn kích hoạt lại cơ sở "${gym.gymName}" hoạt động?`
          : `Bạn có chắc chắn muốn phê duyệt cơ sở "${gym.gymName}" hoạt động?`)
      : (gym.status === "Approved"
          ? `Bạn có chắc chắn muốn tạm dừng hoạt động cơ sở "${gym.gymName}"?`
          : `Bạn có chắc chắn muốn từ chối đơn đăng ký cơ sở "${gym.gymName}"?`);

    setConfirmModal({
      isOpen: true,
      title,
      message: confirmMsg,
      type: status === "Approved" ? "info" : "warning",
      onConfirm: async () => {
        try {
          await changeGymStatusApi(id, status);
          setGyms(prev => prev.map(g => g.gymId === id ? { ...g, status } : g));
          toast.success(status === "Approved" ? "Đã duyệt/kích hoạt đối tác thành công!" : "Đã tạm dừng/từ chối đối tác!");
        } catch {
          toast.error("Cập nhật trạng thái thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string) => {
    const gym = gyms.find(g => g.gymId === id);
    if (!gym) return;

    setConfirmModal({
      isOpen: true,
      title: "Xác nhận xóa đối tác",
      message: `Bạn có chắc chắn muốn xóa đối tác "${gym.gymName}"? Mọi thông tin liên quan sẽ bị loại bỏ vĩnh viễn và không thể khôi phục.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteGymApi(id);
          setGyms(prev => prev.filter(g => g.gymId !== id));
          toast.success("Đã xóa đối tác thành công!");
        } catch {
          toast.error("Xóa đối tác thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openCreateModal = () => {
    setFormData({ ownerId: "", gymName: "", description: "", thumbnailUrl: "", phoneNumber: "", email: "" });
    setGymModal({ isOpen: true, mode: "create", gym: null });
  };

  const openEditModal = (gym: GymDto) => {
    setFormData({
      ownerId: gym.ownerId, // Edit will ignore ownerId per swagger
      gymName: gym.gymName,
      description: gym.description,
      thumbnailUrl: gym.thumbnailUrl,
      phoneNumber: gym.phoneNumber,
      email: gym.email
    });
    setGymModal({ isOpen: true, mode: "edit", gym });
  };

  const handleSubmitGym = async () => {
    if (!formData.gymName || !formData.email || !formData.phoneNumber) {
      toast.error("Vui lòng điền đủ tên, email và số điện thoại.");
      return;
    }
    if (gymModal.mode === "create" && !formData.ownerId) {
      toast.error("Vui lòng chọn chủ sở hữu (Owner).");
      return;
    }

    if (gymModal.mode === "create") {
      const selectedUser = users.find(u => u.userId === formData.ownerId);
      const isPartner = selectedUser && getUserRoleNames(selectedUser).includes("GymPartner");
      if (selectedUser && !isPartner) {
        if (!window.confirm("User này chưa có role GymPartner. Vẫn tiếp tục tạo cơ sở?")) {
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      if (gymModal.mode === "create") {
        await createGymApi(formData);
        toast.success("Tạo phòng gym thành công!");
      } else if (gymModal.gym) {
        await updateGymApi(gymModal.gym.gymId, {
          gymName: formData.gymName,
          description: formData.description,
          thumbnailUrl: formData.thumbnailUrl,
          phoneNumber: formData.phoneNumber,
          email: formData.email
        });
        toast.success("Cập nhật phòng gym thành công!");
      }
      setGymModal({ isOpen: false, mode: "create", gym: null });
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Lỗi lưu phòng gym");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferModal.gym || !transferOwnerId) return;
    try {
      setIsSubmitting(true);
      await transferGymOwnershipApi({ gymId: transferModal.gym.gymId, newOwnerId: transferOwnerId });
      toast.success("Chuyển nhượng thành công!");
      setTransferModal({ isOpen: false, gym: null });
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Lỗi chuyển nhượng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGyms = gyms.filter(g => {
    const matchesSearch = g.gymName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && g.status.toUpperCase() === filterStatus;
  });

  const gymPartnerUsers = useMemo(() => {
    const partners = users.filter(u => getUserRoleNames(u).includes("GymPartner"));
    const others = users.filter(u => !getUserRoleNames(u).includes("GymPartner"));
    return { partners, others };
  }, [users]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý Đối tác Gym</h1>
          <p className="text-muted-foreground text-lg">Giám sát, kiểm duyệt và quản lý các cơ sở phòng tập liên kết.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white" onClick={openCreateModal}>
          <Plus className="w-5 h-5 mr-2" /> Thêm đối tác / phòng gym
        </Button>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-secondary border-white/5">
          <CardContent className="pt-6">
            <span className="text-sm font-medium text-muted-foreground block mb-2">Tổng số cơ sở</span>
            <span className="text-3xl font-extrabold text-white">{gyms.length}</span>
          </CardContent>
        </Card>
        <Card className="bg-secondary border-white/5">
          <CardContent className="pt-6">
            <span className="text-sm font-medium text-green-400 block mb-2">Đã được duyệt</span>
            <span className="text-3xl font-extrabold text-white">{gyms.filter(g => g.status === "Approved").length}</span>
          </CardContent>
        </Card>
        <Card className="bg-secondary border-white/5">
          <CardContent className="pt-6">
            <span className="text-sm font-medium text-amber-500 block mb-2">Đang chờ duyệt</span>
            <span className="text-3xl font-extrabold text-white">{gyms.filter(g => g.status === "Pending").length}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Danh sách phòng tập</CardTitle>
              <CardDescription>Danh sách đối tác liên kết hệ thống</CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                {["ALL", "APPROVED", "PENDING", "REJECTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                      filterStatus === status 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {status === "ALL" ? "Tất cả" : status === "APPROVED" ? "Đã duyệt" : status === "PENDING" ? "Chờ duyệt" : "Từ chối"}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm phòng tập..." 
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-medium">Phòng tập</th>
                  <th className="px-4 py-3 font-medium">Email / SĐT</th>
                  <th className="px-4 py-3 font-medium">Đánh giá</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ngày tham gia</th>
                  <th className="px-4 py-3 rounded-r-lg font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Đang tải dữ liệu...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-red-400">{loadError}</td>
                  </tr>
                ) : filteredGyms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Không tìm thấy phòng tập nào.</td>
                  </tr>
                ) : (
                  filteredGyms.map((gym) => (
                    <tr key={gym.gymId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {gym.thumbnailUrl ? (
                            <img src={gym.thumbnailUrl} alt={gym.gymName} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                              {gym.gymName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{gym.gymName}</div>
                            <div className="text-xs text-muted-foreground max-w-xs truncate">{gym.description || "Chưa cập nhật mô tả"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white font-medium">{gym.email || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{gym.phoneNumber || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-white">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{gym.ratingAverage?.toFixed(1) || "0.0"}</span>
                          <span className="text-xs text-muted-foreground">({gym.totalReviews || 0})</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          gym.status === "Approved" ? "bg-green-500/20 text-green-400" :
                          gym.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {gym.status === "Approved" ? "Hoạt động" :
                           gym.status === "Pending" ? "Chờ duyệt" : "Bị từ chối"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {new Date(gym.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-blue-400 hover:text-blue-300" onClick={() => openEditModal(gym)} title="Sửa thông tin">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-violet-400 hover:text-violet-300" onClick={() => setTransferModal({isOpen: true, gym})} title="Chuyển chủ sở hữu">
                            <UserPlus className="w-4 h-4" />
                          </Button>

                          {gym.status === "Pending" && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleStatusChange(gym.gymId, "Approved")} title="Phê duyệt hoạt động">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleStatusChange(gym.gymId, "Rejected")} title="Từ chối cơ sở">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {gym.status === "Approved" && (
                            <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" onClick={() => handleStatusChange(gym.gymId, "Rejected")} title="Tạm dừng hoạt động">
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          )}
                          {gym.status === "Rejected" && (
                            <Button variant="ghost" size="sm" className="h-8 p-1 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleStatusChange(gym.gymId, "Approved")} title="Mở hoạt động lại">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(gym.gymId)} title="Xóa đối tác">
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

      <Dialog open={gymModal.isOpen} onOpenChange={(open) => setGymModal(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{gymModal.mode === "create" ? "Thêm Phòng Gym Mới" : "Sửa Phòng Gym"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {gymModal.mode === "create" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Chủ sở hữu (Owner) *</label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="">-- Chọn User --</option>
                  <optgroup label="Users có role GymPartner">
                    {gymPartnerUsers.partners.map(u => (
                      <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Users khác">
                    {gymPartnerUsers.others.map(u => (
                      <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tên phòng gym *</label>
              <input
                type="text"
                value={formData.gymName}
                onChange={(e) => setFormData({...formData, gymName: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
                placeholder="Ví dụ: FlexFit City Center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
                placeholder="Email liên hệ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Số điện thoại *</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
                placeholder="SĐT liên hệ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ảnh đại diện (URL)</label>
              <input
                type="text"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white min-h-[80px]"
                placeholder="Giới thiệu về phòng gym..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGymModal(prev => ({...prev, isOpen: false}))}>Hủy</Button>
            <Button onClick={handleSubmitGym} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferModal.isOpen} onOpenChange={(open) => setTransferModal(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chuyển chủ sở hữu phòng tập</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {transferModal.gym?.gymName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Chủ sở hữu mới *</label>
              <select
                value={transferOwnerId}
                onChange={(e) => setTransferOwnerId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white"
              >
                <option value="">-- Chọn User --</option>
                <optgroup label="Users có role GymPartner">
                  {gymPartnerUsers.partners.map(u => (
                    <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                  ))}
                </optgroup>
                <optgroup label="Users khác">
                  {gymPartnerUsers.others.map(u => (
                    <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTransferModal({isOpen: false, gym: null})}>Hủy</Button>
            <Button onClick={handleTransferSubmit} disabled={isSubmitting || !transferOwnerId}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
