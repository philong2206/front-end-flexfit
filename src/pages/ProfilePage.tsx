import { motion } from "framer-motion";
import { User, Mail, Phone, LogOut, Camera, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { updateUserApi } from "@/api/users";
import { parseJwt } from "@/lib/utils";

export default function ProfilePage() {
  const { logout, user, login } = useAuth();
  const navigate = useNavigate();

  const nameParts = user?.fullName?.split(' ') || [];
  const initialTen = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
  const initialHo = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || "";

  const [ho, setHo] = useState(initialHo);
  const [ten, setTen] = useState(initialTen);
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const parts = user.fullName?.split(' ') || [];
      const timer = setTimeout(() => {
        setTen(parts.length > 0 ? parts[parts.length - 1] : "");
        setHo(parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || "");
        setPhone(user.phoneNumber || "");
        setAvatarUrl(user.avatar || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setMessage({ text: "Lỗi: Kích thước ảnh tối đa là 2MB", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let activeUserId = user?.userId;
    if (!activeUserId) {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = parseJwt(token);
        activeUserId = payload?.sub;
      }
    }
    if (!activeUserId) {
      setMessage({ text: "Lỗi: Không tìm thấy ID người dùng", type: "error" });
      return;
    }
    try {
      setIsUpdating(true);
      setMessage(null);
      const fullName = `${ho} ${ten}`.trim();
      await updateUserApi(activeUserId, {
        fullName,
        phoneNumber: phone,
        avatarUrl: avatarUrl
      });
      // Cập nhật state nội bộ
      login({
        ...user,
        fullName,
        phoneNumber: phone,
        avatar: avatarUrl
      });
      setMessage({ text: "Cập nhật thành công!", type: "success" });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Cập nhật thất bại";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setIsUpdating(false);
    }
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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                className="relative mb-4 group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-1">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"
                    )}
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
                {message && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Họ và đệm</label>
                    <Input value={ho} onChange={e => setHo(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tên</label>
                    <Input value={ten} onChange={e => setTen(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
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
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Chưa cập nhật" className="pl-10 bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                </div>
                <div className="space-y-2 hidden">
                  <label className="text-sm font-medium text-muted-foreground">Đường dẫn ảnh đại diện (URL)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className="pl-10 bg-black/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isUpdating} className="glow-btn mt-4">
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
