import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Plus, Edit, Trash2, MapPin, Image as ImageIcon, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import type { GymDto } from "@/api/gyms";
import { createBranchApi, updateBranchApi, deleteBranchApi, changeBranchStatusApi, updateBranchImagesApi, type BranchDto, type BranchImageDto, type CreateBranchRequest, type UpdateBranchRequest } from "@/api/branches";
import { getPartnerGyms, getPartnerBranches } from "@/services/partnerApi";
import { resolveFitnessImage } from "@/lib/imageFallbacks";

export default function PartnerGymsPage() {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formDialog, setFormDialog] = useState<{ open: boolean; mode: "create" | "edit"; branchId: string | null }>({
    open: false, mode: "create", branchId: null
  });
  const [formData, setFormData] = useState<Partial<CreateBranchRequest & UpdateBranchRequest>>({});
  const [galleryImages, setGalleryImages] = useState<BranchImageDto[]>([]);
  const [isGalleryModified, setIsGalleryModified] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, branchId: string | null }>({ open: false, branchId: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gymData, branchData] = await Promise.all([
        getPartnerGyms(),
        getPartnerBranches()
      ]);
      setGyms(gymData);
      setBranches(branchData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách dữ liệu";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    if (gyms.length === 0) {
      toast.error("Tài khoản đối tác chưa có Gym để tạo chi nhánh");
      return;
    }
    setFormData({
      gymId: gyms.length === 1 ? gyms[0].gymId : "",
      branchName: "",
      address: "",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      openTime: "06:00:00",
      closeTime: "22:00:00",
      thumbnailUrl: "",
      creditCost: 1,
    });
    setGalleryImages([]);
    setIsGalleryModified(false);
    setFormDialog({ open: true, mode: "create", branchId: null });
  };

  const handleEdit = (branch: BranchDto) => {
    setFormData({
      gymId: branch.gymId,
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      district: branch.district,
      openTime: branch.openTime,
      closeTime: branch.closeTime,
      thumbnailUrl: branch.thumbnailUrl,
      creditCost: branch.creditCost,
    });
    setGalleryImages(branch.images || []);
    setIsGalleryModified(false);
    setFormDialog({ open: true, mode: "edit", branchId: branch.branchId });
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      if (formDialog.mode === "create" && !formData.gymId) throw new Error("Vui lòng chọn phòng Gym");
      if (!formData.branchName) throw new Error("Tên chi nhánh không được để trống");
      if (!formData.address) throw new Error("Địa chỉ không được để trống");
      if (!formData.city) throw new Error("Thành phố không được để trống");
      if (!formData.district) throw new Error("Quận/huyện không được để trống");
      if (!formData.openTime) throw new Error("Giờ mở cửa không được để trống");
      if (!formData.closeTime) throw new Error("Giờ đóng cửa không được để trống");
      if (formData.creditCost === undefined || formData.creditCost < 0) throw new Error("Giá Credit không hợp lệ");

      // Validate time
      const openParts = formData.openTime.split(":");
      const closeParts = formData.closeTime.split(":");
      const openMinutes = parseInt(openParts[0]) * 60 + parseInt(openParts[1] || "0");
      const closeMinutes = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1] || "0");

      if (openMinutes >= closeMinutes) {
        throw new Error("Giờ mở cửa phải trước giờ đóng cửa");
      }

      let branchId = formDialog.branchId;

      if (formDialog.mode === "create") {
        // Chế độ tạo mới: tạo branch trước để lấy ID, sau đó cập nhật ảnh
        const res = await createBranchApi(formData as CreateBranchRequest);
        branchId = typeof res === 'string' ? res : (res.branchId || res.id);
        toast.success("Thêm cơ sở thành công");

        // Cập nhật gallery sau khi tạo branch
        if (branchId && galleryImages.length > 0) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            await updateBranchImagesApi(branchId, { images: galleryImages });
          } catch (imgErr) {
            console.error("Lỗi cập nhật gallery:", imgErr);
            const errorMsg = imgErr instanceof Error ? imgErr.message : "";
            toast.error(`Cơ sở đã được tạo, nhưng cập nhật ảnh thất bại. Lỗi: ${errorMsg}`);
          }
        }
      } else if (formDialog.branchId) {
        // Chế độ chỉnh sửa: cập nhật ảnh TRƯỚC (concurrency token chưa thay đổi),
        // sau đó mới cập nhật thông tin branch
        if (isGalleryModified) {
          try {
            console.log("Đang cập nhật gallery cho branchId:", formDialog.branchId);
            await updateBranchImagesApi(formDialog.branchId, { images: galleryImages });
          } catch (imgErr) {
            console.error("Lỗi cập nhật gallery:", imgErr);
            const errorMsg = imgErr instanceof Error ? imgErr.message : "";
            toast.error(`Cập nhật bộ sưu tập ảnh thất bại. Lỗi: ${errorMsg}`);
          }
          // Delay nhỏ để backend xử lý xong images trước khi cập nhật branch
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        await updateBranchApi(formDialog.branchId, formData as UpdateBranchRequest);
        toast.success("Cập nhật cơ sở thành công");
      }

      setFormDialog({ open: false, mode: "create", branchId: null });
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    setDeleteConfirm({ open: true, branchId });
  };

  const confirmDeleteBranch = async () => {
    if (!deleteConfirm.branchId) return;
    try {
      await deleteBranchApi(deleteConfirm.branchId);
      toast.success("Xóa cơ sở thành công");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa cơ sở thất bại");
    } finally {
      setDeleteConfirm({ open: false, branchId: null });
    }
  };

  const handleChangeStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      await changeBranchStatusApi(branchId, !currentStatus);
      toast.success(`Cơ sở đã được ${!currentStatus ? 'kích hoạt' : 'tạm dừng'}`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setFormData({ ...formData, thumbnailUrl: compressed });
    } catch (err) {
      toast.error("Lỗi xử lý ảnh");
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsGalleryModified(true); // Đánh dấu là gallery đã thay đổi
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là hình ảnh`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        setGalleryImages((prev) => [
          ...prev,
          { imageUrl: compressed, displayOrder: prev.length }
        ]);
      } catch (err) {
        toast.error(`Lỗi xử lý ảnh: ${file.name}`);
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    setIsGalleryModified(true); // Đánh dấu là gallery đã thay đổi
    setGalleryImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((img, i) => ({ ...img, displayOrder: i }));
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý cơ sở</h1>
          <p className="text-muted-foreground text-lg">Danh sách các phòng tập/chi nhánh thuộc quyền quản lý</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phòng tập mới
        </Button>
      </div>

      {loading ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải danh sách cơ sở...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline">Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      ) : branches.length === 0 ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Chưa có cơ sở nào</p>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Tạo cơ sở đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map((branch, index) => {
            const parentGym = gyms.find((g) => g.gymId === branch.gymId);
            return (
              <motion.div
                key={branch.branchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-secondary border-white/5 hover:border-primary/30 transition-all overflow-hidden">
                  <div className="h-40 w-full overflow-hidden relative group">
                    <img
                      src={resolveFitnessImage(branch.thumbnailUrl)}
                      alt={branch.branchName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {branch.images && branch.images.length > 0 && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-white shadow-xl">
                        <ImageIcon className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold">{branch.images.length}</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="line-clamp-2">{branch.branchName}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.branchId)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{[branch.address, branch.district, branch.city].filter(Boolean).join(", ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {parentGym && (
                          <span className="inline-block px-2 py-1 rounded bg-white/5 text-gray-300">
                            Gym: {parentGym.gymName}
                          </span>
                        )}
                        <span className="inline-block px-2 py-1 rounded bg-white/5 text-gray-300">
                          {branch.openTime.slice(0, 5)} - {branch.closeTime.slice(0, 5)}
                        </span>
                        <span className="inline-block px-2 py-1 rounded bg-white/5 text-gray-300 font-medium">
                          <span className="text-primary">{branch.creditCost}</span> Credit
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <button
                          onClick={() => handleChangeStatus(branch.branchId, branch.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${branch.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                            }`}
                        >
                          {branch.isActive ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog({ open, mode: "create", branchId: null })}>
        <DialogContent className="bg-secondary border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {formDialog.mode === "create" ? "Thêm cơ sở mới" : "Chỉnh sửa cơ sở"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formDialog.mode === "create" && (
              <div>
                <Label>Thuộc phòng gym *</Label>
                <Select
                  value={formData.gymId || ""}
                  onValueChange={(val) => setFormData({ ...formData, gymId: val })}
                >
                  <SelectTrigger className="bg-background border-white/10">
                    <SelectValue placeholder="Chọn phòng gym" />
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map((gym) => (
                      <SelectItem key={gym.gymId} value={gym.gymId}>
                        {gym.gymName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Tên chi nhánh *</Label>
              <Input
                value={formData.branchName || ""}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className="bg-background border-white/10"
                placeholder="Ví dụ: FlexFit Quận 1"
              />
            </div>
            <div>
              <Label>Địa chỉ *</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-background border-white/10"
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quận/huyện *</Label>
                <Input
                  value={formData.district || ""}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="bg-background border-white/10"
                  placeholder="Ví dụ: Quận 1"
                />
              </div>
              <div>
                <Label>Thành phố *</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-background border-white/10"
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giờ mở cửa *</Label>
                <Input
                  type="time"
                  step="1"
                  value={formData.openTime?.slice(0, 8) || "06:00:00"}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value })}
                  className="bg-background border-white/10 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <Label>Giờ đóng cửa *</Label>
                <Input
                  type="time"
                  step="1"
                  value={formData.closeTime?.slice(0, 8) || "22:00:00"}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value })}
                  className="bg-background border-white/10 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
            <div>
              <Label>Credit tiêu chuẩn (Open Gym) *</Label>
              <Input
                type="number"
                value={formData.creditCost || 0}
                onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) || 0 })}
                className="bg-background border-white/10"
                min={0}
              />
            </div>
            <div>
              <Label>Ảnh đại diện cơ sở</Label>
              <div className="mt-2 flex flex-col items-center gap-4">
                <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/20 group">
                  {formData.thumbnailUrl ? (
                    <>
                      <img
                        src={resolveFitnessImage(formData.thumbnailUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => document.getElementById('branch-image-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" /> Thay đổi ảnh
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('branch-image-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Tải ảnh lên
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  id="branch-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * Hệ thống sẽ lưu trữ ảnh đại diện của cơ sở. Dung lượng tối đa 5MB.
                </p>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="pt-4 border-t border-white/5">
              <Label className="text-white font-bold text-lg mb-4 block">Bộ sưu tập ảnh (Gallery)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryImages.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black/20">
                    <img
                      src={resolveFitnessImage(img.imageUrl)}
                      alt={`Gallery ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                      {img.displayOrder + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => document.getElementById('gallery-upload')?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-primary font-medium">Thêm ảnh</span>
                </button>
              </div>
              <input
                id="gallery-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleGalleryChange}
              />
              <p className="text-[10px] text-muted-foreground mt-3">
                * Thêm nhiều ảnh để khách hàng có cái nhìn chi tiết về cơ sở. Ảnh được sắp xếp theo thứ tự bạn thêm vào.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialog({ open: false, mode: "create", branchId: null })}
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
              {formDialog.mode === "create" ? "Tạo cơ sở" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        title="Xóa cơ sở"
        message="Bạn có chắc chắn muốn xóa cơ sở này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các lớp học đang liên kết."
        confirmText="Xóa cơ sở"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDeleteBranch}
        onCancel={() => setDeleteConfirm({ open: false, branchId: null })}
      />
    </div>
  );
}
