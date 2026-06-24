import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { getAmenitiesApi, createAmenityApi, updateAmenityApi, deleteAmenityApi, type AmenityDto } from "@/api/amenities";
import { toast } from "sonner";

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<AmenityDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityDto | null>(null);
  const [amenityName, setAmenityName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirm Modal state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    amenityId: string;
    amenityName: string;
  }>({ isOpen: false, amenityId: "", amenityName: "" });

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const data = await getAmenitiesApi();
      setAmenities(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tiện ích:", error);
      toast.error("Không thể tải danh sách tiện ích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setSelectedAmenity(null);
    setAmenityName("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (amenity: AmenityDto) => {
    setDialogMode("edit");
    setSelectedAmenity(amenity);
    setAmenityName(amenity.amenityName);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amenityName.trim()) {
      toast.error("Tên tiện ích không được để trống");
      return;
    }

    try {
      setSubmitting(true);
      if (dialogMode === "add") {
        const newAmenity = await createAmenityApi({ amenityName: amenityName.trim() });
        const savedAmenity = (newAmenity && newAmenity.amenityId) ? newAmenity : {
          amenityId: Math.random().toString(36).substring(2, 9), // Fallback ID if none returned
          amenityName: amenityName.trim()
        };
        setAmenities(prev => [...prev, savedAmenity]);
        toast.success(`Đã thêm tiện ích "${amenityName.trim()}" thành công!`);
        fetchAmenities(); // Tải lại danh sách để chắc chắn đồng bộ với database
      } else {
        if (!selectedAmenity) return;
        const updated = await updateAmenityApi(selectedAmenity.amenityId, { amenityName: amenityName.trim() });
        const updatedAmenity = (updated && updated.amenityId) ? updated : {
          amenityId: selectedAmenity.amenityId,
          amenityName: amenityName.trim()
        };
        setAmenities(prev => prev.map(a => a.amenityId === selectedAmenity.amenityId ? updatedAmenity : a));
        toast.success(`Đã cập nhật tiện ích "${amenityName.trim()}" thành công!`);
        fetchAmenities(); // Tải lại danh sách để đồng bộ với database
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (amenity: AmenityDto) => {
    setConfirmDelete({ isOpen: true, amenityId: amenity.amenityId, amenityName: amenity.amenityName });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAmenityApi(confirmDelete.amenityId);
      setAmenities(prev => prev.filter(a => a.amenityId !== confirmDelete.amenityId));
      toast.success(`Đã xóa tiện ích "${confirmDelete.amenityName}"`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Xóa tiện ích thất bại");
    } finally {
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Quản lý tiện ích
          </h1>
          <p className="text-muted-foreground text-lg">Cấu hình danh sách tiện ích dịch vụ cho toàn bộ phòng tập trên hệ thống.</p>
        </div>
        <Button
          onClick={handleOpenAddDialog}
          className="bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 rounded-xl"
        >
          <Plus className="w-5 h-5" /> Thêm tiện ích
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <Card className="bg-secondary border-white/5 py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" /> Đang tải danh sách tiện ích...
        </Card>
      ) : amenities.length === 0 ? (
        <Card className="bg-secondary border-white/5 py-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Chưa có tiện ích nào</h3>
            <p className="text-sm text-muted-foreground">Nhấp vào nút "Thêm tiện ích" để tạo mới.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {amenities.map((amenity) => (
            <motion.div
              key={amenity.amenityId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-secondary border-white/5 hover:border-white/15 transition-all p-5 flex flex-col justify-between h-full group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
                      {amenity.amenityName}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {amenity.amenityId.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <Button
                    onClick={() => handleOpenEditDialog(amenity)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </Button>
                  <Button
                    onClick={() => handleOpenDeleteConfirm(amenity)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[400px] rounded-2xl">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="space-y-1.5 mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {dialogMode === "add" ? "Thêm tiện ích mới" : "Chỉnh sửa tiện ích"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                {dialogMode === "add"
                  ? "Tạo tiện ích mới để các đối tác gắn vào chi nhánh phòng tập."
                  : "Đổi tên tiện ích. Thay đổi sẽ đồng bộ trên toàn hệ thống."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="amenityName" className="text-sm font-semibold text-gray-300">
                  Tên tiện ích <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amenityName"
                  value={amenityName}
                  onChange={(e) => setAmenityName(e.target.value)}
                  placeholder="Ví dụ: Bể bơi, Phòng xông hơi, Giữ xe miễn phí..."
                  className="bg-black/30 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary/50"
                  required
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white rounded-xl"
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang lưu...</>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Xóa tiện ích hệ thống"
        message={`Bạn có chắc chắn muốn xóa tiện ích "${confirmDelete.amenityName}"? Hành động này sẽ gỡ tiện ích khỏi tất cả các chi nhánh đang liên kết.`}
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
