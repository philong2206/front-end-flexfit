import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Shield, MapPin } from "lucide-react";

export default function StaffSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Cài đặt Tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và phiên đăng nhập</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/40 to-emerald-500/20" />
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-secondary object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-secondary bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
                    {user?.fullName?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-xl text-white">{user?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs mt-2">
                  <Shield className="w-3.5 h-3.5" />
                  Staff
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={logout}
            variant="destructive"
            className="w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
          </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-secondary border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Thông tin cá nhân</CardTitle>
              <CardDescription>Các thông tin liên hệ nội bộ của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Họ và tên</label>
                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white">
                    <User className="w-4 h-4 text-primary" />
                    <span>{user?.fullName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Chi nhánh công tác</label>
                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>FlexFit Center (Mặc định)</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Để thay đổi thông tin cá nhân hoặc cấp lại mật khẩu, vui lòng liên hệ với Quản lý hệ thống (Admin) theo quy định nội bộ của Câu lạc bộ.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
