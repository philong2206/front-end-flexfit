import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Cơ bản",
    priceMonthly: 49,
    priceAnnual: 39,
    credits: 25,
    features: ["Truy cập phòng gym tiêu chuẩn", "Gợi ý AI cơ bản", "Hủy bất kỳ lúc nào"],
    popular: false,
  },
  {
    name: "Nâng cao",
    priceMonthly: 99,
    priceAnnual: 79,
    credits: 60,
    features: ["Truy cập các studio cao cấp", "Theo dõi AI chuyên sâu", "Ưu tiên đặt chỗ", "2 vé mời bạn bè / tháng"],
    popular: true,
  },
  {
    name: "Thượng lưu",
    priceMonthly: 199,
    priceAnnual: 159,
    credits: 150,
    features: ["Truy cập không giới hạn", "Lộ trình tập cá nhân hóa", "Mở đặt chỗ sớm VIP", "Vé mời bạn bè không giới hạn"],
    popular: false,
  }
];

export default function MembershipPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Chọn gói thành viên</h1>
        <p className="text-muted-foreground text-lg mb-8">Các gói tín dụng linh hoạt cho mọi nhu cầu tập luyện. Không phí ẩn.</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center p-1 bg-secondary border border-white/5 rounded-full relative">
          <button 
            className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-muted-foreground hover:text-white'}`}
            onClick={() => setIsAnnual(false)}
          >
            Hàng tháng
          </button>
          <button 
            className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-muted-foreground hover:text-white'}`}
            onClick={() => setIsAnnual(true)}
          >
            Hàng năm <span className="text-primary text-xs ml-1">-20%</span>
          </button>
          <motion.div 
            className="absolute top-1 bottom-1 w-1/2 bg-white/10 rounded-full border border-white/10"
            animate={{ left: isAnnual ? "50%" : "4px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: "calc(50% - 4px)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative h-full flex"
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-primary/20">
                  <Zap className="h-3 w-3" /> Phổ biến nhất
                </span>
              </div>
            )}
            <Card 
              className={`w-full flex flex-col relative overflow-hidden transition-all duration-300 cursor-pointer ${
                plan.popular ? 'border-primary bg-secondary/80 shadow-[0_0_30px_rgba(249,115,22,0.15)] scale-105 z-10' : 'bg-secondary border-white/5 hover:border-white/20 hover:bg-secondary'
              } ${selectedPlan === plan.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
              )}
              <CardHeader className="text-center pt-10 pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                <div className="flex justify-center items-end gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-white">
                    ${isAnnual ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-muted-foreground mb-1">/tháng</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-primary font-medium">Thanh toán ${plan.priceAnnual * 12} mỗi năm</p>
                )}
                <div className="inline-block bg-white/5 rounded-full px-4 py-1.5 text-white font-medium mt-4 text-sm border border-white/5">
                  <span className="text-primary font-bold">{plan.credits}</span> Credit / tháng
                </div>
              </CardHeader>
              <CardContent className="flex-1 mt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-muted-foreground text-sm">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${plan.popular ? 'text-primary' : 'text-gray-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pb-8 pt-4">
                <Button 
                  className={`w-full h-12 text-base font-semibold ${plan.popular ? 'glow-btn' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`} 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {selectedPlan === plan.name ? 'Đã chọn' : `Chọn gói ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

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
            <p className="text-muted-foreground">Thiếu credit trong tháng này? Nạp ngay các gói tín dụng lẻ để không gián đoạn lịch tập.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
          <Button variant="outline" className="border-white/10 hover:border-primary/50 text-white h-12 px-6 bg-secondary">
            10 Credit - $20
          </Button>
          <Button variant="outline" className="border-white/10 hover:border-primary/50 text-white h-12 px-6 bg-secondary">
            25 Credit - $45
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
