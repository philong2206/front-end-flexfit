import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, LayoutDashboard, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getMyCreditApi } from "@/api/payment";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [credit, setCredit] = useState<number | null>(null);

  useEffect(() => {
    // Xóa pending payment ID - webhook PayOS đã xử lý cộng credit server-to-server
    localStorage.removeItem("pending_payment_id");

    // Lấy thông tin từ URL params do PayOS trả về
    const orderCode = searchParams.get("orderCode") || searchParams.get("code") || "";
    
    toast.success("Thanh toán thành công! Credit sẽ được cập nhật tự động.");
    console.log("[PaymentSuccess] PayOS order completed:", orderCode);

    // Fetch credit mới nhất để hiển thị
    const fetchCredit = async () => {
      try {
        const data = await getMyCreditApi();
        setCredit(data.balance ?? data.Balance ?? 0);
      } catch {
        // Không cần xử lý lỗi, chỉ là hiển thị phụ
      }
    };

    // Delay nhẹ để webhook kịp xử lý
    const timer = setTimeout(fetchCredit, 1500);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-secondary border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 relative">
            <CheckCircle2 className="w-11 h-11 text-emerald-400 animate-bounce" />
            <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Thanh Toán Thành Công!</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4 pb-6">
          <p className="text-muted-foreground">
            Cảm ơn bạn đã tin tưởng dịch vụ của FlexFit. Giao dịch đã hoàn tất và số credit tương ứng sẽ được cập nhật vào ví của bạn.
          </p>

          {/* Webhook confirmation badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Đã xác nhận bởi PayOS
          </div>
          
          {/* Hiển thị credit nếu có */}
          {credit !== null && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4">
              <p className="text-xs text-muted-foreground mb-1">Số dư ví hiện tại</p>
              <p className="text-3xl font-bold text-primary">{credit.toLocaleString("vi-VN")} <span className="text-base font-normal text-muted-foreground">Credits</span></p>
            </div>
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
