import { User, Mail, Phone, LogOut, Camera, Heart, Save, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { updateUserApi } from "@/api/users";
import { parseJwt } from "@/lib/utils";
import { updateMyProfileApi } from "@/api/memberProfiles";
import { ApiUnauthorizedError } from "@/api/errors";
import { useMemberProfile, invalidateProfileCache } from "@/hooks/useMemberProfile";
import { useMemberWalletSnapshot } from "@/hooks/useMemberWalletSnapshot";
import { useResolvedUserId } from "@/hooks/useResolvedUserId";
import { changePasswordApi } from "@/api/auth";

type ProfileSection = "personal" | "health" | "security";

const SECTIONS: { id: ProfileSection; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Thông tin cá nhân", icon: User },
  { id: "health", label: "Sức khỏe & Mục tiêu", icon: Heart },
  { id: "security", label: "Đổi mật khẩu", icon: Lock },
];

export default function ProfilePage() {
  const { logout, user, login } = useAuth();
  const navigate = useNavigate();
  const resolvedUserId = useResolvedUserId(user);
  const handleUnauthorized = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
  const { profile, loading: profileLoading, refetch: refetchProfile } = useMemberProfile(
    resolvedUserId,
    handleUnauthorized
  );
  const { tier: membershipTier } = useMemberWalletSnapshot(resolvedUserId, "vi");
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal");

  const nameParts = user?.fullName?.split(' ') || [];
  const initialTen = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
  const initialHo = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || "";

  const [ho, setHo] = useState(initialHo);
  const [ten, setTen] = useState(initialTen);
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  
  // Health & Fitness States
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState("");
  const [bio, setBio] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    if (profile.fullName) {
      const parts = profile.fullName.split(" ");
      setTen(parts.length > 0 ? parts[parts.length - 1] : "");
      setHo(parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "");
    }
    if (profile.phoneNumber) setPhone(profile.phoneNumber);
    if (profile.gender) setGender(profile.gender);
    if (profile.dateOfBirth) setDob(profile.dateOfBirth.split("T")[0]);
    if (profile.heightCm) setHeightCm(profile.heightCm);
    if (profile.weightKg) setWeightKg(profile.weightKg);
    if (profile.fitnessGoal) setFitnessGoal(profile.fitnessGoal);
    if (profile.activityLevel) setActivityLevel(profile.activityLevel);
    if (profile.preferredWorkoutTime) setPreferredWorkoutTime(profile.preferredWorkoutTime);
    if (profile.bio) setBio(profile.bio);
  }, [profile]);

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
      
      // 1. Update basic user data (including Avatar)
      await updateUserApi(activeUserId, {
        fullName,
        phoneNumber: phone,
        avatarUrl: avatarUrl
      });

      // 2. Update health & fitness metrics in MemberProfile
      await updateMyProfileApi({
        fullName,
        phoneNumber: phone,
        dateOfBirth: dob ? dob : undefined,
        gender: gender || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        fitnessGoal: fitnessGoal || undefined,
        activityLevel: activityLevel || undefined,
        preferredWorkoutTime: preferredWorkoutTime || undefined,
        bio: bio || undefined
      });

      // Update auth context state
      if (user) {
        login({
          userId: activeUserId,
          fullName,
          email: user.email,
          role: user.role,
          phoneNumber: phone,
          avatar: avatarUrl
        });
      }
      setMessage({ text: "Cập nhật thành công!", type: "success" });
      invalidateProfileCache();
      refetchProfile();
    } catch (error: unknown) {
      if (error instanceof ApiUnauthorizedError) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      const errMsg = error instanceof Error ? error.message : "Cập nhật thất bại";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage({ text: "Vui lòng điền đầy đủ tất cả các trường mật khẩu.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Mật khẩu mới phải có ít nhất 6 ký tự.", type: "error" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ text: "Mật khẩu mới và xác nhận mật khẩu không khớp nhau.", type: "error" });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);
      await changePasswordApi({
        currentPassword,
        newPassword
      });
      setMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = `${ho} ${ten}`.trim() || user?.fullName || "Người dùng";

  return (
    <div className="max-w-6xl mx-auto pb-28 md:pb-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-hidden
      />

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">Hồ Sơ & Cài Đặt</h1>
        <p className="text-sm md:text-base text-muted-foreground">Quản lý thông tin cá nhân và tùy chọn của bạn.</p>
      </div>

      {/* Mobile: compact profile strip */}
      <div className="md:hidden flex items-center gap-4 mb-5 p-4 rounded-xl bg-secondary border border-white/5">
        <button
          type="button"
          className="relative shrink-0 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-lg font-bold text-white overflow-hidden relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-active:opacity-100 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-primary mt-1 truncate">{membershipTier}</p>
        </div>
      </div>

      {/* Mobile: section tabs */}
      <div className="md:hidden flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={cn(
              "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
              activeSection === id
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground border border-white/10"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-6 lg:gap-8 items-start">
        {/* Sidebar — sticky on desktop */}
        <div className="hidden md:block md:sticky md:top-24 space-y-4">
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <button
                type="button"
                className="relative mb-3 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-1">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl font-bold text-white overflow-hidden relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "U"
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </button>
              <h2 className="text-lg font-bold text-white leading-tight">{displayName}</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-3 truncate max-w-full">{user?.email || "Chưa cập nhật email"}</p>
              <div className="w-full bg-primary/10 text-primary px-3 py-2 rounded-lg text-xs font-medium border border-primary/20">
                {membershipTier}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-white/5">
            <CardContent className="p-2">
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "w-full justify-start",
                      activeSection === id ? "text-white bg-white/10" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    {label}
                  </Button>
                ))}
                <div className="h-px bg-white/5 my-2 mx-3" />
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Form area */}
        <div className="min-w-0 flex flex-col">
          {message && (
            <div
              className={cn(
                "mb-4 p-3 rounded-lg text-sm font-medium",
                message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}
            >
              {message.text}
            </div>
          )}

          <div className="flex-1">
            {profileLoading && !profile ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-48 rounded-xl bg-secondary/60 border border-white/5" />
                <div className="h-32 rounded-xl bg-secondary/40 border border-white/5" />
              </div>
            ) : (
            <>
            {activeSection === "personal" && (
            <Card className="bg-secondary border-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
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
              </CardContent>
            </Card>
            )}

            {activeSection === "health" && (
            <Card className="bg-secondary border-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Chỉ số sức khỏe & Mục tiêu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Chiều cao (cm)</label>
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Ví dụ: 170"
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Cân nặng (kg)</label>
                    <Input
                      type="number"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Ví dụ: 65"
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mục tiêu tập luyện</label>
                    <select
                      value={fitnessGoal}
                      onChange={e => setFitnessGoal(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    >
                      <option value="">Chọn mục tiêu</option>
                      <option value="Giảm cân">Giảm cân</option>
                      <option value="Tăng cơ">Tăng cơ (Bulking)</option>
                      <option value="Giữ dáng">Giữ dáng (Toning)</option>
                      <option value="Cải thiện sức khỏe">Cải thiện sức khỏe chung</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mức độ hoạt động</label>
                    <select
                      value={activityLevel}
                      onChange={e => setActivityLevel(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                    >
                      <option value="">Chọn mức độ</option>
                      <option value="Ít hoạt động">Ít hoạt động (Văn phòng)</option>
                      <option value="Hoạt động nhẹ">Hoạt động nhẹ (1-3 ngày/tuần)</option>
                      <option value="Hoạt động vừa phải">Hoạt động vừa phải (3-5 ngày/tuần)</option>
                      <option value="Hoạt động tích cực">Hoạt động tích cực (6-7 ngày/tuần)</option>
                      <option value="Hoạt động rất tích cực">Hoạt động rất tích cực (VĐV)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Khung giờ tập luyện ưa thích</label>
                  <select
                    value={preferredWorkoutTime}
                    onChange={e => setPreferredWorkoutTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary text-sm h-10"
                  >
                    <option value="">Chọn khung giờ</option>
                    <option value="Buổi sáng">Buổi sáng (06:00 - 11:00)</option>
                    <option value="Buổi trưa">Buổi trưa (11:00 - 14:00)</option>
                    <option value="Buổi chiều">Buổi chiều (14:00 - 17:00)</option>
                    <option value="Buổi tối">Buổi tối (17:00 - 21:00)</option>
                    <option value="Linh hoạt">Linh hoạt / Tự do</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Giới thiệu bản thân (Bio)</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Chia sẻ một chút về hành trình fitness của bạn..."
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {activeSection === "security" && (
            <Card className="bg-secondary border-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Đổi mật khẩu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mật khẩu hiện tại</label>
                  <Input 
                    type="password"
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="Nhập mật khẩu hiện tại"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mật khẩu mới</label>
                  <Input 
                    type="password"
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Xác nhận mật khẩu mới</label>
                  <Input 
                    type="password"
                    value={confirmNewPassword} 
                    onChange={e => setConfirmNewPassword(e.target.value)} 
                    placeholder="Xác nhận lại mật khẩu mới"
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary h-10" 
                  />
                </div>
              </CardContent>
            </Card>
            )}
            </>
            )}
          </div>
 
          {/* Sticky save — always reachable */}
          <div className="fixed bottom-0 left-0 right-0 z-40 md:sticky md:bottom-4 md:mt-6 p-4 md:p-0 border-t md:border-t-0 border-white/10 bg-background/95 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none">
            <div className="max-w-6xl mx-auto md:max-w-none flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="md:hidden shrink-0 border-white/10 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                onClick={activeSection === "security" ? handlePasswordChange : handleSave}
                disabled={isUpdating}
                className="glow-btn flex-1 h-12 md:h-11 text-base font-semibold"
              >
                <Save className="w-4 h-4 mr-2 shrink-0" />
                {activeSection === "security" 
                  ? (isUpdating ? "Đang đổi mật khẩu..." : "Đổi mật khẩu") 
                  : (isUpdating ? "Đang lưu..." : "Lưu thay đổi")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
