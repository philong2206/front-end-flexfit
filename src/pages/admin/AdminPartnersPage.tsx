import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Trash2, ShieldAlert, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllGymsApi, changeGymStatusApi, deleteGymApi, type GymDto } from "@/api/gyms";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminPartnersPage() {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
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

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const data = await getAllGymsApi();
      setGyms(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng tập:", error);
      toast.error("Không thể tải danh sách đối tác phòng tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGyms();
    }, 0);
    return () => clearTimeout(timer);
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
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
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
        } catch (error) {
          console.error("Lỗi khi xóa đối tác:", error);
          toast.error("Xóa đối tác thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredGyms = gyms.filter(g => {
    const matchesSearch = g.gymName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && g.status.toUpperCase() === filterStatus;
  });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý Đối tác Gym</h1>
        <p className="text-muted-foreground text-lg">Giám sát, kiểm duyệt và quản lý các cơ sở phòng tập liên kết.</p>
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
              {/* Filter Tabs */}
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

              {/* Search Bar */}
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
                        <div className="flex items-center justify-end gap-2">
                          {gym.status === "Pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => handleStatusChange(gym.gymId, "Approved")}
                                title="Phê duyệt hoạt động"
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Duyệt
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(gym.gymId, "Rejected")}
                                title="Từ chối cơ sở"
                              >
                                <XCircle className="w-4 h-4 mr-1.5" /> Từ chối
                              </Button>
                            </>
                          )}
                          {gym.status === "Approved" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              onClick={() => handleStatusChange(gym.gymId, "Rejected")}
                              title="Tạm dừng hoạt động"
                            >
                              <ShieldAlert className="w-4 h-4 mr-1.5" /> Tạm dừng
                            </Button>
                          )}
                          {gym.status === "Rejected" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleStatusChange(gym.gymId, "Approved")}
                              title="Mở hoạt động lại"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Kích hoạt
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDelete(gym.gymId)}
                            title="Xóa đối tác"
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
