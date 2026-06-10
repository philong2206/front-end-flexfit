import { type LucideIcon } from "lucide-react";
import { Button } from "./button";
import { motion } from "framer-motion";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-white/5 bg-black/20"
    >
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(34,197,94,0.3)]">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
