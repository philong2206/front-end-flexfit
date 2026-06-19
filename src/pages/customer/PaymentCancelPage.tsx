import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, Home, AlertTriangle } from "lucide-react";
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
    const handleCancel = async () => {
      try {
        const paymentId =
          localStorage.getItem("pending_payment_id") ||
          searchParams.get("paymentId") ||
          searchParams.get("id");

        if (paymentId) {
          // Báo backend đánh dấu giao dịch là Failed/Cancelled
          await paymentCallbackApi(`paymentId=${paymentId}&status=Failed&message=CancelledByUser`);
        }

        // Dọn dẹp localStorage
        localStorage.removeItem("pending_payment_id");
        toast.info("Giao dịch đã bị hủy.");
      } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái hủy:", err);
        setError("Không thể cập nhật trạng thái. Giao dịch sẽ tự động hết hạn.");
      } finally {
        setLoading(false);
      }
    };

    handleCancel();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-secondary border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-destructive/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/8 rounded-full blur-[40px] pointer-events-none" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-20 h-20 bg-destructive/15 rounded-full flex items-center justify-center mb-4 relative">
            <XCircle className="w-11 h-11 text-destructive" />
            <AlertTriangle className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Thanh Toán Bị Hủy</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4 pb-6">
          <p className="text-muted-foreground">
            Giao dịch mua gói credit của bạn đã bị hủy hoặc không thành công. Không có khoản tiền nào bị trừ khỏi tài khoản của bạn.
          </p>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse mt-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang cập nhật trạng thái...
            </div>
          )}

          {error && (
            <p className="text-xs text-amber-400 mt-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              {error}
            </p>
          )}

          {/* Reassurance message */}
          {!loading && !error && (
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-muted-foreground">
              Bạn có thể thử lại bất cứ lúc nào
            </div>
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
