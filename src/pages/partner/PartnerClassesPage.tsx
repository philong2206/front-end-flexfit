import { useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, Trash2, Edit, Eye, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClassDto, CreateClassRequest, UpdateClassRequest } from "@/api/classes";
import { 
  getAllClassesApi, 
  getClassesByBranchApi, 
  getClassByIdApi,
  createClassApi, 
  updateClassApi, 
  changeClassStatusApi,
  deleteClassApi
} from "@/api/classes";
import { getAllBranchesApi, type BranchDto } from "@/api/branches";
import { getAllGymsApi } from "@/api/gyms";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ClassStatus = "Open" | "Cancelled" | "Completed";

const normalizeClassStatus = (status?: string): ClassStatus => {
  if (status === "Open" || status === "Cancelled" || status === "Completed") return status;
  return "Open";
};

const classStatusMeta: Record<ClassStatus, { label: string; className: string }> = {
  Open: {
    label: "Đang mở",
    className: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
  },
  Cancelled: {
    label: "Đã hủy",
    className: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
  },
  Completed: {
    label: "Hoàn thành",
    className: "bg-blue-500/20 text-blue-400 cursor-not-allowed",
  },
};

export default function PartnerClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialogs
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; classId: string | null }>({ open: false, classId: null });
  const [detailData, setDetailData] = useState<ClassDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [formDialog, setFormDialog] = useState<{ open: boolean; mode: "create" | "edit"; classId: string | null }>({ 
    open: false, 
    mode: "create", 
    classId: null 
  });
  const [formData, setFormData] = useState<Partial<CreateClassRequest & UpdateClassRequest>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Fetch partner-owned branches and classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.userId) {
        setBranches([]);
        setClasses([]);
        setError("Không xác định được tài khoản đối tác");
        return;
      }

      const [gymList, branchList] = await Promise.all([
        getAllGymsApi(),
        getAllBranchesApi(),
      ]);
      const partnerGymIds = new Set(
        gymList.filter((gym) => gym.ownerId === user.userId).map((gym) => gym.gymId)
      );
      const partnerBranches = branchList.filter((branch) => partnerGymIds.has(branch.gymId));
      setBranches(partnerBranches);

      const selectedBranchBelongsToPartner =
        selectedBranch === "all" || partnerBranches.some((branch) => branch.branchId === selectedBranch);

      if (!selectedBranchBelongsToPartner) {
        setSelectedBranch("all");
        return;
      }

      const partnerBranchIds = new Set(partnerBranches.map((branch) => branch.branchId));
      if (partnerBranchIds.size === 0) {
        setClasses([]);
        return;
      }

      const data = selectedBranch === "all"
        ? await getAllClassesApi()
        : await getClassesByBranchApi(selectedBranch);
      const sorted = data
        .filter((cls) => partnerBranchIds.has(cls.branchId))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setClasses(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách lớp học";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // View detail
  const handleViewDetail = async (classId: string) => {
    setDetailDialog({ open: true, classId });
    setDetailLoading(true);
    try {
      const data = await getClassByIdApi(classId);
      setDetailData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải chi tiết lớp học");
      setDetailDialog({ open: false, classId: null });
    } finally {
      setDetailLoading(false);
    }
  };

  // Open create dialog
  const handleCreate = () => {
    if (branches.length === 0) {
      toast.error("Tài khoản đối tác chưa có chi nhánh để tạo lớp học");
      return;
    }
    setFormData({
      branchId: branches[0]?.branchId || "",
      categoryId: "",
      className: "",
      description: "",
      coachName: "",
      startTime: "",
      endTime: "",
      capacity: 20,
      creditCost: 1,
      difficultyLevel: "Beginner",
      caloriesBurnEstimate: 0,
      thumbnailUrl: "",
    });
    setFormDialog({ open: true, mode: "create", classId: null });
  };

  // Open edit dialog
  const handleEdit = async (classId: string) => {
    setFormLoading(true);
    setFormDialog({ open: true, mode: "edit", classId });
    try {
      const data = await getClassByIdApi(classId);
      setFormData({
        categoryId: data.categoryId,
        className: data.className,
        description: data.description,
        coachName: data.coachName,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        creditCost: data.creditCost,
        difficultyLevel: data.difficultyLevel,
        caloriesBurnEstimate: data.caloriesBurnEstimate,
        thumbnailUrl: data.thumbnailUrl,
        status: normalizeClassStatus(data.status),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải thông tin lớp học");
      setFormDialog({ open: false, mode: "create", classId: null });
    } finally {
      setFormLoading(false);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      if (formDialog.mode === "create") {
        if (!formData.branchId || !branches.some((branch) => branch.branchId === formData.branchId)) {
          toast.error("Chi nhánh tạo lớp không thuộc đối tác hiện tại");
          return;
        }
        await createClassApi(formData as CreateClassRequest);
        toast.success("Tạo lớp học thành công!");
      } else if (formDialog.classId) {
        await updateClassApi(formDialog.classId, formData as UpdateClassRequest);
        toast.success("Cập nhật lớp học thành công!");
      }
      setFormDialog({ open: false, mode: "create", classId: null });
      fetchClasses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  // Change status
  const handleChangeStatus = async (classId: string, currentStatus: string) => {
    const status = normalizeClassStatus(currentStatus);
    if (status === "Completed") {
      toast.info("Lớp học đã hoàn thành không thể chuyển trạng thái tại đây");
      return;
    }
    const newStatus: ClassStatus = status === "Open" ? "Cancelled" : "Open";
    try {
      await changeClassStatusApi(classId, newStatus);
      toast.success(`Đã ${newStatus === "Open" ? "mở lại" : "hủy"} lớp học`);
      fetchClasses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    }
  };

  // Delete
  const handleDelete = async (classId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
    
    try {
      await deleteClassApi(classId);
      toast.success("Xóa lớp học thành công!");
      fetchClasses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa lớp học thất bại");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [selectedBranch, user?.userId]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý lớp học</h1>
          <p className="text-muted-foreground text-lg">Danh sách các lớp học đang hoạt động</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px] bg-secondary border-white/10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Chọn chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Tạo lớp học mới
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải danh sách lớp học...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={fetchClasses} variant="outline">Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      ) : classes.length === 0 ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Chưa có lớp học nào</p>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lớp học đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-secondary border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Danh sách lớp học ({classes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg font-medium">Tên lớp</th>
                    <th className="px-4 py-3 font-medium">Huấn luyện viên</th>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Sĩ số</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 rounded-r-lg font-medium text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => {
                    const start = new Date(cls.startTime);
                    const end = new Date(cls.endTime);
                    const dateStr = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                    const timeStr = `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                    const status = normalizeClassStatus(cls.status);
                    const statusMeta = classStatusMeta[status];
                    
                    return (
                      <tr key={cls.classId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">
                          <div>
                            <div className="font-bold">{cls.className}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{cls.branchName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">{cls.coachName || "Chưa có"}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-white">{timeStr}</span>
                            <span className="text-xs text-muted-foreground">{dateStr}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">0/{cls.capacity}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleChangeStatus(cls.classId, cls.status)}
                            disabled={status === "Completed"}
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDetail(cls.classId)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(cls.classId)}
                              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(cls.classId)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, classId: null })}>
        <DialogContent className="bg-secondary border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Chi tiết lớp học</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tên lớp</Label>
                  <p className="text-white font-medium">{detailData.className}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Chi nhánh</Label>
                  <p className="text-white font-medium">{detailData.branchName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Danh mục</Label>
                  <p className="text-white font-medium">{detailData.categoryName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Huấn luyện viên</Label>
                  <p className="text-white font-medium">{detailData.coachName || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Thời gian bắt đầu</Label>
                  <p className="text-white font-medium">{new Date(detailData.startTime).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Thời gian kết thúc</Label>
                  <p className="text-white font-medium">{new Date(detailData.endTime).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sĩ số</Label>
                  <p className="text-white font-medium">{detailData.capacity} người</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Chi phí credit</Label>
                  <p className="text-white font-medium">{detailData.creditCost} credits</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Độ khó</Label>
                  <p className="text-white font-medium">{detailData.difficultyLevel || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Calories ước tính</Label>
                  <p className="text-white font-medium">{detailData.caloriesBurnEstimate || 0} kcal</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <p className="text-white font-medium">{classStatusMeta[normalizeClassStatus(detailData.status)].label}</p>
                </div>
              </div>
              {detailData.description && (
                <div>
                  <Label className="text-muted-foreground">Mô tả</Label>
                  <p className="text-white">{detailData.description}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog({ open, mode: "create", classId: null })}>
        <DialogContent className="bg-secondary border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {formDialog.mode === "create" ? "Tạo lớp học mới" : "Chỉnh sửa lớp học"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formDialog.mode === "create" && (
              <div>
                <Label>Chi nhánh *</Label>
                <Select 
                  value={formData.branchId} 
                  onValueChange={(val) => setFormData({ ...formData, branchId: val })}
                >
                  <SelectTrigger className="bg-background border-white/10">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Tên lớp *</Label>
              <Input 
                value={formData.className || ""} 
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="bg-background border-white/10"
                placeholder="Nhập tên lớp học"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea 
                value={formData.description || ""} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-white/10"
                placeholder="Mô tả về lớp học"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Huấn luyện viên</Label>
                <Input 
                  value={formData.coachName || ""} 
                  onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                  className="bg-background border-white/10"
                  placeholder="Tên HLV"
                />
              </div>
              <div>
                <Label>Category ID *</Label>
                <Input 
                  value={formData.categoryId || ""} 
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="bg-background border-white/10"
                  placeholder="ID danh mục"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Thời gian bắt đầu *</Label>
                <Input 
                  type="datetime-local"
                  value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ""} 
                  onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <Label>Thời gian kết thúc *</Label>
                <Input 
                  type="datetime-local"
                  value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ""} 
                  onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
                  className="bg-background border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sĩ số *</Label>
                <Input 
                  type="number"
                  value={formData.capacity || 20} 
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="bg-background border-white/10"
                  min={1}
                />
              </div>
              <div>
                <Label>Credit cost *</Label>
                <Input 
                  type="number"
                  value={formData.creditCost || 1} 
                  onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) })}
                  className="bg-background border-white/10"
                  min={1}
                />
              </div>
              <div>
                <Label>Calories</Label>
                <Input 
                  type="number"
                  value={formData.caloriesBurnEstimate || 0} 
                  onChange={(e) => setFormData({ ...formData, caloriesBurnEstimate: parseInt(e.target.value) })}
                  className="bg-background border-white/10"
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Độ khó</Label>
                <Select 
                  value={formData.difficultyLevel || "Beginner"} 
                  onValueChange={(val) => setFormData({ ...formData, difficultyLevel: val })}
                >
                  <SelectTrigger className="bg-background border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formDialog.mode === "edit" && (
                <div>
                  <Label>Trạng thái</Label>
                  <Select 
                    value={normalizeClassStatus(formData.status)} 
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="bg-background border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Đang mở</SelectItem>
                      <SelectItem value="Cancelled">Đã hủy</SelectItem>
                      <SelectItem value="Completed">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input 
                value={formData.thumbnailUrl || ""} 
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="bg-background border-white/10"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setFormDialog({ open: false, mode: "create", classId: null })}
              disabled={formLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={formLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {formDialog.mode === "create" ? "Tạo lớp học" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
