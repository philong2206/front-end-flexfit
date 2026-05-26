import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllGymsApi, type GymDto } from "@/api/gyms";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function PartnerGymsPage() {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.userId) {
        setGyms([]);
        setError("Không xác định được tài khoản đối tác");
        return;
      }
      const data = await getAllGymsApi();
      setGyms(data.filter((gym) => gym.ownerId === user.userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách phòng tập";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quản lý cơ sở</h1>
          <p className="text-muted-foreground text-lg">Danh sách các phòng tập thuộc quyền quản lý</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phòng tập mới
        </Button>
      </div>

      {loading ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải danh sách phòng tập...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={fetchGyms} variant="outline">Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      ) : gyms.length === 0 ? (
        <Card className="bg-secondary border-white/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Chưa có phòng tập nào</p>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Tạo phòng tập đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gyms.map((gym, index) => (
            <motion.div
              key={gym.gymId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-secondary border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    {gym.gymName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {gym.description && (
                      <p className="text-muted-foreground line-clamp-2">{gym.description}</p>
                    )}
                    {gym.status && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        gym.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {gym.status}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
