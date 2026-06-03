import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Star, Loader2, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllGymsApi } from "@/api/gyms";
import { getGymReviewsApi, type ReviewDto } from "@/api/reviews";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function StaffSupportPage() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low">("all");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Since there is no "get all reviews" for staff, we fetch all gyms and get reviews for the first gym (or all of them)
        // For performance, we'll just get reviews for the first active gym as an example for the staff module
        const gyms = await getAllGymsApi();
        if (gyms.length > 0) {
          const gymId = gyms[0].gymId;
          const reviewsData = await getGymReviewsApi(gymId);
          setReviews(reviewsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch {
        toast.error("Lỗi tải danh sách đánh giá");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const displayReviews = filter === "low" 
    ? reviews.filter(r => r.rating <= 2) 
    : reviews;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hỗ trợ & Đánh giá</h1>
          <p className="text-muted-foreground">Lắng nghe phản hồi từ hội viên</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "all" ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
          >
            Tất cả phản hồi
          </button>
          <button 
            onClick={() => setFilter("low")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filter === "low" ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-muted-foreground hover:text-amber-400'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Chú ý (1-2 sao)
          </button>
        </div>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Danh sách Phản hồi</CardTitle>
          <CardDescription>Các đánh giá gần đây về chất lượng phòng tập và lớp học</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : displayReviews.length === 0 ? (
            <EmptyState 
              icon={MessageSquare} 
              title="Chưa có đánh giá nào" 
              description={filter === "low" ? "Tuyệt vời! Không có đánh giá 1-2 sao nào." : "Phòng tập chưa nhận được phản hồi nào từ hội viên."} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayReviews.map((review) => (
                <div key={review.reviewId} className="bg-black/30 border border-white/5 p-5 rounded-2xl space-y-3 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">{review.memberName || "Hội viên ẩn danh"}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                      <span className="font-bold text-white text-xs">{review.rating}</span>
                      <Star className={`w-3.5 h-3.5 ${review.rating >= 4 ? 'text-emerald-400 fill-emerald-400' : review.rating <= 2 ? 'text-amber-400 fill-amber-400' : 'text-primary fill-primary'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                    "{review.comment}"
                  </p>
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-primary hover:bg-primary/10">Phản hồi</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
