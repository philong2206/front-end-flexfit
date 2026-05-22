import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentCallbackApi } from "@/api/payment";
import { toast } from "sonner";

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notifyBackendCancel = async () => {
      try {
        // Lấy paymentId từ localStorage (được lưu lúc ấn mua) hoặc từ query params của PayOS nếu có cấu hình
        const paymentId = localStorage.getItem("pending_payment_id") || searchParams.get("paymentId");
        
        if (!paymentId) {
          console.warn("Không tìm thấy paymentId để gửi callback.");
          setLoading(false);
          return;
        }

        // Gọi API Callback báo hủy thanh toán
        await paymentCallbackApi(`paymentId=${paymentId}&status=Failed&message=CancelledByUser`);
        
        // Xóa ID khỏi localStorage sau khi xử lý xong
        localStorage.removeItem("pending_payment_id");
        toast.info("Đã ghi nhận giao dịch bị hủy.");
      } catch (err) {
        console.error("Lỗi khi gửi callback báo hủy:", err);
        setError("Không thể cập nhật trạng thái giao dịch lên hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    notifyBackendCancel();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-secondary border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-[40px] pointer-events-none" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mb-4 text-destructive">
            <XCircle className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Thanh Toán Bị Hủy</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4 pb-6">
          <p className="text-muted-foreground">
            Giao dịch mua gói credit của bạn đã bị hủy hoặc không thành công. Không có khoản tiền nào bị trừ khỏi tài khoản của bạn.
          </p>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary animate-pulse mt-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang cập nhật trạng thái giao dịch...
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-8 px-6">
          <Button
            className="w-full sm:flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
          <Button
            className="w-full sm:flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            onClick={() => navigate("/membership")}
          >
            Thử lại
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
