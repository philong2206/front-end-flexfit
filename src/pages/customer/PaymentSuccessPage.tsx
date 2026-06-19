import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentCallbackApi } from "@/api/payment";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notifyBackendSuccess = async () => {
      try {
const paymentId =
  localStorage.getItem("pending_payment_id") ||
  searchParams.get("paymentId") ||
  searchParams.get("id");        
        if (!paymentId) {
          console.warn("Không tìm thấy paymentId để gửi callback.");
          setLoading(false);
          return;
        }

        // Lấy mã giao dịch từ cổng thanh toán nếu có
        const code = searchParams.get("code") || searchParams.get("orderCode") || "";

        // Gọi API Callback báo thanh toán thành công
        await paymentCallbackApi(`paymentId=${paymentId}&status=Success&providerTransactionCode=${code}`);
        
        // Xóa ID khỏi localStorage
        localStorage.removeItem("pending_payment_id");
        toast.success("Thanh toán thành công! Credit đã được cộng vào tài khoản của bạn.");
      } catch (err) {
        console.error("Lỗi khi gửi callback báo thành công:", err);
        setError("Giao dịch thành công nhưng gặp lỗi đồng bộ số dư. Vui lòng liên hệ Admin.");
      } finally {
        setLoading(false);
      }
    };

    notifyBackendSuccess();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-secondary border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mb-4 text-primary">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Thanh Toán Thành Công!</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4 pb-6">
          <p className="text-muted-foreground">
            Cảm ơn bạn đã tin tưởng dịch vụ của FlexFit. Giao dịch đã hoàn tất và số credit tương ứng sẽ được cập nhật vào ví của bạn ngay lập tức.
          </p>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary animate-pulse mt-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang xác thực giao dịch...
            </div>
          )}

          {error && (
            <p className="text-xs text-amber-400 mt-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-8 px-6">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-11"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Vào bảng điều khiển
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-white"
            onClick={() => navigate("/membership")}
          >
            Mua thêm Credit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
