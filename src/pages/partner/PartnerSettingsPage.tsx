import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerSettingsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cài đặt</h1>
        <p className="text-muted-foreground text-lg">Cấu hình và tùy chỉnh hệ thống</p>
      </div>

      <Card className="bg-secondary border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Cài đặt chung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Trang cài đặt đang được phát triển</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
