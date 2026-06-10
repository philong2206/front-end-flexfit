import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiCoachBubbleProps {
  onClick: () => void;
  unreadCount?: number;
}

export function AiCoachBubble({ onClick, unreadCount = 1 }: AiCoachBubbleProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-6 right-6 z-[70] md:bottom-6 md:right-6 pb-safe"
    >
      <div className="relative group">
        {/* Unread Pulse Indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/50">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
          </div>
        )}

        {/* AI Badge */}
        <div className="absolute -bottom-2 -left-2 z-20 flex h-5 items-center justify-center rounded-full bg-[#22c55e] px-2 text-[9px] font-bold text-black shadow-lg uppercase tracking-wider">
          AI
        </div>

        {/* Premium Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-[#22c55e]/40 blur-xl group-hover:bg-[#22c55e]/60 transition-colors" />
        
        {/* Bubble Button */}
        <Button
          type="button"
          className="relative h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(34,197,94,0.3)] bg-gradient-to-br from-[#121212] to-black text-[#22c55e] border border-[#22c55e]/50 hover:border-[#22c55e] transition-all duration-300 hover:scale-105 p-0 overflow-hidden"
          onClick={onClick}
          aria-label="Open AI Coach"
        >
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] opacity-20 group-hover:opacity-40 animate-spin-slow" />
          <Sparkles className="h-6 w-6 relative z-10" />
        </Button>
      </div>
    </motion.div>
  );
}
