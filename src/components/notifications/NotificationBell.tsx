import { useState, useEffect, useRef } from "react";
import { Bell, AlertCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getMyNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
} from "@/api/notifications";
import type { AppNotification } from "@/api/notifications";

interface NotificationBellProps {
  placement?: "bottom-end" | "right-start";
}

export function NotificationBell({ placement = "bottom-end" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyNotificationsApi();
      // Sort by createdAt descending
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount to get the badge count
    fetchNotifications();

    const handleRefresh = () => fetchNotifications();
    window.addEventListener("notifications:refresh", handleRefresh);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, []);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await markAsReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadApi();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          "relative group p-2 rounded-full transition-colors",
          isOpen ? "bg-white/10" : "hover:bg-white/5"
        )}
      >
        <Bell className={cn("w-5 h-5 transition-colors", isOpen ? "text-white" : "group-hover:text-white text-muted-foreground")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-x-4 top-20 z-[9999] overflow-hidden flex flex-col",
              "bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl",
              placement === "right-start" 
                ? "sm:absolute sm:inset-auto sm:left-full sm:top-0 sm:ml-4 sm:w-[340px]" 
                : "sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] sm:origin-top-right"
            )}
            style={{ maxHeight: "420px" }}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 bg-white/5">
              <h3 className="font-bold text-white text-base">Thông báo</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-primary hover:text-primary/80 transition-colors font-semibold"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {isLoading && notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Đang tải thông báo...</p>
                </div>
              ) : error ? (
                <div className="p-6 flex flex-col items-center justify-center text-red-400 text-center">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="mt-4 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors text-white"
                  >
                    Thử lại
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-muted-foreground text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">Không có thông báo mới</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={(e) => !notification.isRead && handleMarkAsRead(e, notification.id)}
                      className={cn(
                        "p-4 transition-colors relative group",
                        notification.isRead
                          ? "hover:bg-white/5 cursor-default"
                          : "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                      )}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className={cn("text-sm font-medium", notification.isRead ? "text-white" : "text-primary")}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className={cn("text-xs leading-relaxed", notification.isRead ? "text-muted-foreground" : "text-white/80")}>
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
