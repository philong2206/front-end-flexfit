import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPartnerBranches } from '@/services/partnerApi';
import { assignStaffByEmailApi, removeStaffFromBranchApi } from '@/api/branches';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, Building, Trash2, Plus, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface StaffInfoDto {
  staffId: string;
  fullName: string;
}

interface BranchDto {
  branchId: string;
  branchName: string;
  staffs: StaffInfoDto[];
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function PartnerStaffPage() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    branchId: string;
    branchName: string;
  }>({ isOpen: false, branchId: "", branchName: "" });

  const [staffEmail, setStaffEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchesData = await getPartnerBranches();
      setBranches(Array.isArray(branchesData) ? branchesData : (branchesData.data || []));
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (branchId: string, branchName: string) => {
    setStaffEmail("");
    setAssignModal({ isOpen: true, branchId, branchName });
  };

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, branchId: "", branchName: "" });
    setStaffEmail("");
  };

  const handleAssignStaff = async () => {
    const email = staffEmail.trim();

    if (!email) {
      toast.error("Vui lòng nhập email nhân viên");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Email nhân viên không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignStaffByEmailApi({ branchId: assignModal.branchId, email });
      toast.success("Đã thêm nhân viên vào chi nhánh thành công.");
      closeAssignModal();
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Thêm nhân viên thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = (branchId: string, staffId: string, staffName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Gỡ nhân viên",
      message: `Bạn có chắc chắn muốn gỡ nhân viên "${staffName}" khỏi chi nhánh này?`,
      type: "danger",
      onConfirm: async () => {
        try {
          await removeStaffFromBranchApi(staffId, branchId);
          toast.success("Gỡ nhân viên thành công");
          fetchData();
        } catch (err: unknown) {
          const error = err as Error;
          toast.error(error.message || "Gỡ nhân viên thất bại");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Nhân viên</h1>
          <p className="text-muted-foreground text-lg">Quản lý và phân công nhân viên cho các chi nhánh của bạn.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="py-10">
          <ErrorState title="Không tải được dữ liệu" message={error} onRetry={fetchData} />
        </div>
      ) : branches.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon={Building}
            title="Chưa có chi nhánh"
            description="Bạn cần tạo chi nhánh trước khi phân công nhân viên."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <Card key={branch.branchId} className="bg-secondary border-white/5 overflow-hidden flex flex-col">
              <CardHeader className="bg-black/20 border-b border-white/5 pb-4">
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  {branch.branchName}
                </CardTitle>
                <CardDescription>
                  {branch.staffs?.length || 0} nhân viên phụ trách
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 p-4 space-y-4">
                  {(!branch.staffs || branch.staffs.length === 0) ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      Chưa có nhân viên nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {branch.staffs.map(staff => (
                        <div key={staff.staffId} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {staff.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{staff.fullName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleRemoveStaff(branch.branchId, staff.staffId, staff.fullName)}
                            title="Gỡ nhân viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 pt-0 mt-auto">
                  <Button
                    className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-colors"
                    onClick={() => openAssignModal(branch.branchId, branch.branchName)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhân viên
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={assignModal.isOpen} onOpenChange={(open) => open ? setAssignModal(prev => ({ ...prev, isOpen: true })) : closeAssignModal()}>
        <DialogContent className="bg-[#1E293B] text-white border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Phân công nhân viên</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Nhập email tài khoản đã đăng ký để thêm vào chi nhánh <span className="font-bold text-white">{assignModal.branchName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email nhân viên *</label>
                <input
                  type="email"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAssignModal}>
              Hủy
            </Button>
            <Button onClick={handleAssignStaff} disabled={isSubmitting || !staffEmail.trim()}>
              {isSubmitting ? "Đang xử lý..." : "Thêm nhân viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
