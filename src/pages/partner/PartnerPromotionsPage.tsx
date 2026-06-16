import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Tag, Loader2, Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPromotionApi, deletePromotionApi, getPromotionByIdApi, getAllPromotionsApi, type PromotionDto } from '@/api/promotions';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const initialFormData = {
  title: '',
  description: '',
  discountPercent: 10,
  startDate: '',
  endDate: '',
};

export default function PartnerPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<PromotionDto | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);

  const fetchPromotions = () => {
    setLoading(true);
    setError(null);
    getAllPromotionsApi()
      .then((data) => setPromotions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách khuyến mãi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!formData.title.trim()) throw new Error("Vui lòng nhập Title");
      if (formData.discountPercent < 1 || formData.discountPercent > 100) throw new Error("Discount Percent phải từ 1 đến 100");
      if (!formData.startDate || !formData.endDate) throw new Error("Vui lòng chọn ngày bắt đầu và kết thúc");

      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) throw new Error("Ngày kết thúc phải sau ngày bắt đầu");

      await createPromotionApi({
        title: formData.title.trim(),
        description: formData.description,
        discountPercent: formData.discountPercent,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      toast.success("Tạo khuyến mãi thành công");
      setCreateDialogOpen(false);
      setFormData(initialFormData);
      fetchPromotions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailDialogOpen(true);
    setIsDetailLoading(true);
    try {
      const data = await getPromotionByIdApi(id);
      setDetailData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải chi tiết thất bại");
      setDetailDialogOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPromotionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!promotionToDelete) return;
    try {
      await deletePromotionApi(promotionToDelete);
      toast.success("Đã xóa khuyến mãi");
      fetchPromotions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeleteConfirmOpen(false);
      setPromotionToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý khuyến mãi</h1>
          <p className="text-muted-foreground text-lg">Thiết lập các chương trình ưu đãi cho hội viên.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Tạo khuyến mãi
        </Button>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu khuyến mãi...</p>
            </div>
          ) : error ? (
            <ErrorState
              title="Không tải được dữ liệu"
              message={error}
              onRetry={fetchPromotions}
            />
          ) : promotions.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Chưa có khuyến mãi"
              description="Hiện chưa có chương trình khuyến mãi nào để hiển thị."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promotion) => (
                <div key={promotion.promotionId} className="rounded-xl border border-white/5 bg-black/20 p-5 hover:border-primary/30 transition-colors flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-white text-lg">{promotion.title}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                      promotion.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {promotion.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{promotion.description || 'Không có mô tả'}</p>

                  <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-primary">{promotion.discountPercent ?? 0}% OFF</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(promotion.startDate).toLocaleDateString("vi-VN")} - {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(promotion.promotionId)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-2"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Chi tiết
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(promotion.promotionId)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-secondary border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Tạo khuyến mãi mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title / Mã khuyến mãi *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-background border-white/10"
                placeholder="VD: SUMMER2024"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-white/10"
                placeholder="Mô tả khuyến mãi"
              />
            </div>
            <div>
              <Label>Phần trăm giảm (%) *</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                className="bg-background border-white/10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <Label>Ngày kết thúc *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-background border-white/10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleCreateSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-secondary border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Chi tiết khuyến mãi</DialogTitle>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Mã / Tiêu đề</Label>
                  <p className="text-white font-medium">{detailData.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <p className={detailData.isActive ? "text-green-400" : "text-gray-400"}>
                    {detailData.isActive ? "Đang hoạt động" : "Không hoạt động"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mức giảm</Label>
                  <p className="text-white font-medium">{detailData.discountPercent}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Từ ngày</Label>
                  <p className="text-white font-medium">{new Date(detailData.startDate).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Đến ngày</Label>
                  <p className="text-white font-medium">{new Date(detailData.endDate).toLocaleString("vi-VN")}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Mô tả</Label>
                <p className="text-white mt-1">{detailData.description || "Không có mô tả"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xóa khuyến mãi"
        message="Bạn có chắc chắn muốn xóa chương trình khuyến mãi này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
