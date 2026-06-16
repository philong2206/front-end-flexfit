import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPackagesApi, createPaymentApi, getMyPaymentHistoryApi, getPaymentStatusInfo, type PaymentHistoryDto } from "@/api/payment";
import { getUserTransactionHistoryApi, formatCreditAmount, getCreditTransactionTypeLabel, type CreditPackageResponse, type CreditTransactionResponse } from "@/api/creditPackages";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackageResponse[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<PaymentHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [creditHistory, setCreditHistory] = useState<CreditTransactionResponse[]>([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);

  useEffect(() => {
    // Handle PayOS return URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get("status");
    const cancel = searchParams.get("cancel");
    
    if (status) {
      if (status === "PAID" || status === "success" || status === "SUCCESS") {
        toast.success("Thanh toán thành công! Credit đã được cập nhật.");
      } else {
        toast.error("Thanh toán thất bại hoặc có lỗi xảy ra.");
      }
      // Clean up URL to prevent toast on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancel === "true") {
      toast.error("Giao dịch đã bị hủy.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getPackagesApi();
        setPackages(data.filter((p: CreditPackageResponse) => p.isActive).sort((a: CreditPackageResponse, b: CreditPackageResponse) => a.price - b.price));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải danh sách gói");
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      if (!user) return;
      try {
        setHistoryLoading(true);
        const data = await getMyPaymentHistoryApi();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    const fetchCreditHistory = async () => {
      if (!user?.userId) return;
      try {
        setCreditHistoryLoading(true);
        const data = await getUserTransactionHistoryApi(user.userId);
        setCreditHistory(data);
      } catch (err) {
        console.error("Failed to load credit history", err);
      } finally {
        setCreditHistoryLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPackages();
      fetchHistory();
      fetchCreditHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  const handleBuy = async (pkg: CreditPackageResponse) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện giao dịch.");
      navigate("/login");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn mua gói ${pkg.packageName} với giá ${formatPrice(pkg.price)}?`)) {
      return;
    }

    try {
      setPurchasing(pkg.packageId);
      const res = await createPaymentApi({ packageId: pkg.packageId });
      console.log("Payment API Response:", res);
      
      // Handle different possible response formats from C# backend
      const urlToRedirect = res.checkoutUrl || res.CheckoutUrl || res.url || res.Url || res.paymentUrl || res.paymentLink || (res.data && res.data.checkoutUrl) || (typeof (res as unknown) === 'string' && (res as unknown as string).startsWith('http') ? (res as unknown as string) : null);

      if (urlToRedirect) {
        toast.info("Đang chuyển hướng đến cổng thanh toán...");
        window.location.assign(urlToRedirect);
      } else {
        console.error("Could not find payment URL in response:", res);
        toast.error("Không thể lấy được đường dẫn thanh toán. Vui lòng thử lại sau.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Giao dịch thất bại. Vui lòng thử lại sau.");
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Chọn gói Credit</h1>
        <p className="text-muted-foreground text-lg mb-8">Các gói tín dụng linh hoạt cho mọi nhu cầu tập luyện. Không phí ẩn.</p>
      </div>

      {loading && <p className="text-center text-muted-foreground">Đang tải danh sách gói...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}

      {!loading && !error && packages.length === 0 && (
        <p className="text-center text-muted-foreground">Hiện chưa có gói Credit nào được bán.</p>
      )}

      {!loading && !error && packages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {packages.map((plan, i) => (
            <motion.div
              key={plan.packageId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative h-full flex"
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-primary/20">
                    <Zap className="h-3 w-3" /> Phổ biến nhất
                  </span>
                </div>
              )}
              <Card
                className={`w-full flex flex-col relative overflow-hidden transition-all duration-300 cursor-pointer ${plan.isPopular ? 'border-primary bg-secondary/80 shadow-[0_0_30px_rgba(249,115,22,0.15)] scale-105 z-10' : 'bg-secondary border-white/5 hover:border-white/20 hover:bg-secondary'
                  } ${selectedPlan === plan.packageId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => setSelectedPlan(plan.packageId)}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
                )}
                <CardHeader className="text-center pt-10 pb-4 relative z-10">
                  <CardTitle className="text-2xl font-bold text-white mb-2">{plan.packageName}</CardTitle>
                  <div className="flex justify-center items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <div className="inline-block bg-white/5 rounded-full px-4 py-1.5 text-white font-medium mt-4 text-sm border border-white/5">
                    <span className="text-primary font-bold">{plan.creditAmount}</span> Credit
                  </div>
                </CardHeader>
                <CardContent className="flex-1 mt-6 relative z-10">
                  {plan.description && (
                    <ul className="space-y-4">
                      {plan.description.split('\n').filter(Boolean).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-muted-foreground text-sm">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${plan.isPopular ? 'text-primary' : 'text-gray-500'}`} />
                          <span>{feature.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="pb-8 pt-4 relative z-10">
                  <Button
                    className={`w-full h-12 text-base font-semibold ${plan.isPopular ? 'glow-btn' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                    variant={plan.isPopular ? 'default' : 'outline'}
                    disabled={purchasing !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(plan);
                    }}
                  >
                    {purchasing === plan.packageId ? "Đang xử lý..." : "Mua gói này"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Credit Packs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16 bg-gradient-to-r from-secondary to-secondary/50 rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between shadow-xl"
      >
        <div className="flex items-start gap-4 mb-6 md:mb-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Cần thêm Credit?</h3>
            <p className="text-muted-foreground">Bạn có thể chọn bất kỳ gói nào ở trên để nạp thêm credit vào ví.</p>
          </div>
        </div>
      </motion.div>

      {/* Payment History */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-white">Lịch sử thanh toán</h3>
          </div>
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-8 text-center text-muted-foreground">Đang tải lịch sử...</div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Mã giao dịch</th>
                        <th className="px-6 py-4">Gói Credit</th>
                        <th className="px-6 py-4">Số tiền</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((item) => (
                        <tr key={item.paymentId} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-mono text-xs">{item.transactionCode || item.paymentId.slice(0, 8)}</td>
                          <td className="px-6 py-4 font-medium text-white">{item.packageName || "N/A"}</td>
                          <td className="px-6 py-4 text-primary font-bold">{formatPrice(item.amount)}</td>
                          <td className="px-6 py-4">
                            {(() => {
                              const statusInfo = getPaymentStatusInfo(item.status);
                              return (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                                  {statusInfo.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Credit Usage History */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-white">Lịch sử sử dụng credit</h3>
          </div>
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardContent className="p-0">
              {creditHistoryLoading ? (
                <div className="p-8 text-center text-muted-foreground">Đang tải lịch sử credit...</div>
              ) : creditHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch credit nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Mã GD</th>
                        <th className="px-6 py-4">Biến động</th>
                        <th className="px-6 py-4">Số dư sau GD</th>
                        <th className="px-6 py-4">Loại giao dịch</th>
                        <th className="px-6 py-4">Mô tả</th>
                        <th className="px-6 py-4">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {creditHistory.map((item) => (
                        <tr key={item.transactionId} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {(item.transactionId || "").slice(0, 8)}
                          </td>
                          <td className={`px-6 py-4 font-bold ${(item.amount || 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {formatCreditAmount(item.amount || 0)}
                          </td>
                          <td className="px-6 py-4 font-medium text-white">{item.balanceAfter || 0}</td>
                          <td className="px-6 py-4 text-white">
                            {getCreditTransactionTypeLabel(item.type || "")}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {item.description || "Không có mô tả"}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm") : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
