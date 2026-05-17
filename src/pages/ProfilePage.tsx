import { motion } from "framer-motion";
import { User, Mail, Phone, CreditCard, Bell, Shield, LogOut, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const nameParts = user?.fullName?.split(' ') || [];
  const ten = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
  const ho = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || "";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hồ Sơ & Cài Đặt</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và tùy chọn của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Quick Links */}
        <div className="space-y-6">
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-1">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                    {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || "Người dùng"}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user?.email || "Chưa cập nhật email"}</p>
              <div className="w-full bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium border border-primary/20">
                Thành viên FLEXFIT Pro
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-white/5">
            <CardContent className="p-2">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-white bg-white/5"><User className="w-4 h-4 mr-3" /> Thông tin cá nhân</Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white"><Bell className="w-4 h-4 mr-3" /> Thông báo</Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white"><CreditCard className="w-4 h-4 mr-3" /> Thanh toán</Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white"><Shield className="w-4 h-4 mr-3" /> Bảo mật</Button>
                <div className="h-px bg-white/5 my-2 mx-4" />
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"><LogOut className="w-4 h-4 mr-3" /> Đăng xuất</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="md:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-secondary border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Họ và đệm</label>
                    <Input defaultValue={ho} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tên</label>
                    <Input defaultValue={ten} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input defaultValue={user?.email || ""} disabled className="pl-10 bg-black/20 border-white/5 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input defaultValue="+84 987 654 321" className="pl-10 bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                </div>
                <Button className="glow-btn mt-4">Lưu thay đổi</Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-secondary border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Tùy chọn thông báo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Nhắc lịch tập</p>
                    <p className="text-sm text-muted-foreground">Nhận thông báo trước buổi tập 2 tiếng</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Khuyến mãi & Cập nhật</p>
                    <p className="text-sm text-muted-foreground">Tin tức về phòng gym và các gói credit mới</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Báo cáo tiến độ</p>
                    <p className="text-sm text-muted-foreground">Tổng kết hoạt động tập luyện hàng tuần</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
