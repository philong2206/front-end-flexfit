import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info"
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 text-white"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full flex-shrink-0 ${
                type === "danger" ? "bg-red-500/10 text-red-400" :
                type === "warning" ? "bg-amber-500/10 text-amber-400" :
                "bg-primary/10 text-primary"
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10 rounded-xl px-4 h-10 text-sm"
              >
                {cancelText}
              </Button>
              <Button
                onClick={onConfirm}
                className={`rounded-xl px-5 h-10 text-sm font-semibold transition-all ${
                  type === "danger" ? "bg-red-600 hover:bg-red-500 text-white" :
                  type === "warning" ? "bg-amber-500 hover:bg-amber-400 text-black" :
                  "bg-primary hover:bg-primary/95 text-white"
                }`}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
