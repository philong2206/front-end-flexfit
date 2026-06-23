import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ShieldCheck, Mail, Phone, Calendar, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllGymsApi, changeGymStatusApi, type GymDto } from "@/api/gyms";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { resolveFitnessImage } from "@/lib/imageFallbacks";

export default function AdminApprovalsPage() {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
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
    onConfirm: () => { }
  });

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const data = await getAllGymsApi();
      setGyms(data);
    } catch (error) {
      console.error("Lỗi khi tải gyms chờ duyệt:", error);
      toast.error("Không thể tải danh sách phòng tập chờ duyệt");
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

    const title = status === "Approved" ? "Phê duyệt đối tác" : "Từ chối đối tác";
    const confirmMsg = status === "Approved"
      ? `Bạn có chắc chắn muốn PHÊ DUYỆT cho cơ sở "${gym.gymName}" hoạt động trên hệ thống?`
      : `Bạn có chắc chắn muốn TỪ CHỐI đơn đăng ký của cơ sở "${gym.gymName}"?`;

    setConfirmModal({
      isOpen: true,
      title,
      message: confirmMsg,
      type: status === "Approved" ? "info" : "danger",
      onConfirm: async () => {
        try {
          await changeGymStatusApi(id, status);
          setGyms(prev => prev.filter(g => g.gymId !== id)); // Remove from pending list
          toast.success(status === "Approved" ? "Đã phê duyệt phòng tập hoạt động!" : "Đã từ chối đơn đăng ký!");
        } catch (error) {
          console.error("Lỗi khi xét duyệt:", error);
          toast.error("Duyệt đối tác thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const pendingGyms = gyms.filter(g => g.status === "Pending");

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Duyệt phòng tập</h1>
          <p className="text-muted-foreground text-lg">Kiểm tra và phê duyệt các phòng tập mới do đối tác đăng ký.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Card className="bg-secondary border-white/5 py-12 text-center text-muted-foreground">
            Đang tải danh sách chờ phê duyệt...
          </Card>
        ) : pendingGyms.length === 0 ? (
          <Card className="bg-secondary border-white/5 py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Không có phòng tập chờ duyệt</h3>
              <p className="text-sm text-muted-foreground">Tất cả các cơ sở đăng ký mới đã được kiểm duyệt hoàn tất.</p>
            </div>
          </Card>
        ) : (
          pendingGyms.map((gym) => (
            <motion.div
              key={gym.gymId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-secondary border-white/5 hover:border-white/10 transition-all overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">

                  {/* Left Column: Image/Branding */}
                  <div className="lg:col-span-1 flex flex-col justify-between">
                    {gym.thumbnailUrl ? (
                      <img
                        src={gym.thumbnailUrl}
                        alt={gym.gymName}
                        className="w-full h-40 object-cover rounded-xl border border-white/10"
                      />
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-black/40 flex items-center justify-center text-primary font-extrabold text-3xl border border-white/5">
                        {gym.gymName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/10 inline-block mb-2">
                        Chờ Phê Duyệt
                      </span>
                      <h3 className="text-xl font-bold text-white leading-tight">{gym.gymName}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {gym.description || "Không có mô tả chi tiết cơ sở."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>Email: {gym.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>SĐT: {gym.phoneNumber || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Ngày đăng ký: {new Date(gym.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span>ID đối tác: {gym.ownerId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="lg:col-span-1 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                    <Button
                      onClick={() => handleStatusChange(gym.gymId, "Approved")}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 rounded-xl"
                    >
                      <CheckCircle className="w-4.5 h-4.5" /> Duyệt cơ sở
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(gym.gymId, "Rejected")}
                      variant="outline"
                      className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
                    >
                      <XCircle className="w-4.5 h-4.5" /> Từ chối
                    </Button>
                  </div>

                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

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
