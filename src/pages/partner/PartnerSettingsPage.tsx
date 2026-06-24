import { useEffect, useState } from "react";
import {
  Building2,
  Edit,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  Phone,
  Shield,
  Star,
  Store,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { GymDto, UpdateGymRequest } from "@/api/gyms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleSettingsPage, type SettingsStat } from "@/components/settings/RoleSettingsPage";
import { resolveFitnessImage } from "@/lib/imageFallbacks";
import {
  getPartnerBranches,
  getPartnerClasses,
  getPartnerCustomers,
  getPartnerGyms,
  updateGym,
} from "@/services/partnerApi";

type PartnerStats = {
  gyms: number;
  branches: number;
  classes: number;
  customers: number;
};

type GymFormData = UpdateGymRequest;

const emptyGymForm: GymFormData = {
  gymName: "",
  description: "",
  thumbnailUrl: "",
  phoneNumber: "",
  email: "",
};

const safeArrayLength = (value: unknown) => {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data.length;
    if (Array.isArray(record.items)) return record.items.length;
    if (Array.isArray(record.gyms)) return record.gyms.length;
    if (Array.isArray(record.branches)) return record.branches.length;
    if (Array.isArray(record.classes)) return record.classes.length;
    if (Array.isArray(record.customers)) return record.customers.length;
  }
  return 0;
};

const normalizeGyms = (value: unknown): GymDto[] => {
  if (Array.isArray(value)) return value as GymDto[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "gyms", "result", "results"]) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as GymDto[];
    }
  }
  return [];
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function PartnerSettingsPage() {
  const [stats, setStats] = useState<PartnerStats>({ gyms: 0, branches: 0, classes: 0, customers: 0 });
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [editingGym, setEditingGym] = useState<GymDto | null>(null);
  const [formData, setFormData] = useState<GymFormData>(emptyGymForm);
  const [formLoading, setFormLoading] = useState(false);

  const loadPartnerData = async (shouldUpdate = () => true) => {
    setLoadingStats(true);
    setLoadingGyms(true);

    const [gymResult, branches, classes, customers] = await Promise.all([
      getPartnerGyms().catch((error) => {
        toast.error(error instanceof Error ? error.message : "Không thể tải danh sách phòng gym");
        return [];
      }),
      getPartnerBranches().catch(() => []),
      getPartnerClasses().catch(() => []),
      getPartnerCustomers().catch(() => []),
    ]);

    const normalizedGyms = normalizeGyms(gymResult);
    if (!shouldUpdate()) return;

    setGyms(normalizedGyms);
    setStats({
      gyms: normalizedGyms.length || safeArrayLength(gymResult),
      branches: safeArrayLength(branches),
      classes: safeArrayLength(classes),
      customers: safeArrayLength(customers),
    });
    setLoadingStats(false);
    setLoadingGyms(false);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      await loadPartnerData(() => mounted);
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards: SettingsStat[] = [
    { label: "Tổng số cơ sở", value: stats.gyms, icon: Building2, color: "text-emerald-400" },
    { label: "Tổng số chi nhánh", value: stats.branches, icon: Store, color: "text-emerald-400" },
    { label: "Tổng số lớp học", value: stats.classes, icon: Layers, color: "text-emerald-400" },
    { label: "Tổng số hội viên", value: stats.customers, icon: Users, color: "text-emerald-400" },
  ];

  const openEditDialog = (gym: GymDto) => {
    setEditingGym(gym);
    setFormData({
      gymName: gym.gymName || "",
      description: gym.description || "",
      thumbnailUrl: gym.thumbnailUrl || "",
      phoneNumber: gym.phoneNumber || "",
      email: gym.email || "",
    });
  };

  const closeEditDialog = () => {
    if (formLoading) return;
    setEditingGym(null);
    setFormData(emptyGymForm);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
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
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setFormData((current) => ({ ...current, thumbnailUrl: compressed }));
    } catch {
      toast.error("Xử lý ảnh thất bại");
    } finally {
      event.target.value = "";
    }
  };

  const validateForm = () => {
    if (!formData.gymName.trim()) throw new Error("Tên phòng gym không được để trống");
    if (!formData.phoneNumber.trim()) throw new Error("Số điện thoại không được để trống");
    if (!formData.email.trim()) throw new Error("Email không được để trống");
    if (!isValidEmail(formData.email.trim())) throw new Error("Email không hợp lệ");
  };

  const handleSubmit = async () => {
    if (!editingGym) return;

    try {
      validateForm();
      setFormLoading(true);
      await updateGym(editingGym.gymId, {
        gymName: formData.gymName.trim(),
        description: formData.description.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
      });
      toast.success("Cập nhật thông tin phòng gym thành công");
      setEditingGym(null);
      await loadPartnerData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật phòng gym thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const gymManagement = (
    <Card className="rounded-2xl border-white/10 bg-[#182235] shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Building2 className="h-5 w-5 text-emerald-400" />
          Thông tin phòng gym
        </CardTitle>
        <CardDescription>Cập nhật thông tin thương hiệu gym hiển thị cho khách hàng.</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingGyms ? (
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#101827] py-10 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-400" />
            Đang tải danh sách phòng gym...
          </div>
        ) : gyms.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#101827] p-6 text-center text-slate-400">
            Tài khoản đối tác chưa có phòng gym để cập nhật.
          </div>
        ) : (
          <div className="space-y-4">
            {gyms.map((gym) => (
              <div key={gym.gymId} className="overflow-hidden rounded-xl border border-white/10 bg-[#101827]">
                <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                  <div className="h-32 overflow-hidden rounded-lg bg-black/20 md:h-28">
                    <img
                      src={resolveFitnessImage(gym.thumbnailUrl)}
                      alt={gym.gymName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-white">{gym.gymName}</h3>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                          {gym.status || "Active"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                        {gym.description || "Chưa có mô tả phòng gym."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-emerald-400" />
                        {gym.email || "Chưa có email"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        {gym.phoneNumber || "Chưa có số điện thoại"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-emerald-400" />
                        {Number(gym.ratingAverage || 0).toFixed(1)} ({gym.totalReviews || 0} đánh giá)
                      </span>
                    </div>
                  </div>

                  <Button onClick={() => openEditDialog(gym)} className="bg-primary hover:bg-primary/90">
                    <Edit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <RoleSettingsPage
        title="Cài đặt đối tác"
        subtitle="Quản lý tài khoản, hệ thống và thông tin phòng gym của đối tác."
        roleLabel="Gym Partner"
        roleIcon={Shield}
        statsTitle="Quản lý hệ thống"
        statsDescription="Thống kê nhanh các dữ liệu đang thuộc quyền quản lý."
        stats={statCards}
        statsLoading={loadingStats}
        mainExtra={gymManagement}
      />

      <Dialog open={Boolean(editingGym)} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-secondary">
          <DialogHeader>
            <DialogTitle className="text-white">Cập nhật phòng gym</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tên phòng gym *</Label>
              <Input
                value={formData.gymName}
                onChange={(event) => setFormData({ ...formData, gymName: event.target.value })}
                className="border-white/10 bg-background"
                placeholder="Ví dụ: FlexFit Premium"
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="min-h-28 border-white/10 bg-background"
                placeholder="Giới thiệu ngắn về phòng gym, dịch vụ và điểm nổi bật..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="border-white/10 bg-background"
                  placeholder="contact@flexfit.vn"
                />
              </div>
              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                  className="border-white/10 bg-background"
                  placeholder="0900000000"
                />
              </div>
            </div>

            <div>
              <Label>Ảnh đại diện phòng gym</Label>
              <div className="mt-2 flex flex-col items-center gap-4">
                <div className="group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-black/20">
                  {formData.thumbnailUrl ? (
                    <>
                      <img
                        src={resolveFitnessImage(formData.thumbnailUrl)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => document.getElementById("gym-thumbnail-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Thay đổi ảnh
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="mb-2 h-12 w-12 opacity-20" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById("gym-thumbnail-upload")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Tải ảnh lên
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  id="gym-thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground">
                  Ảnh sẽ được nén trước khi gửi để giảm dung lượng cập nhật.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={formLoading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading} className="bg-primary hover:bg-primary/90">
              {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
