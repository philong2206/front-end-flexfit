import { lazy, Suspense, useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";

const AiChatBot = lazy(() =>
  import("./AiChatBot").then((module) => ({ default: module.AiChatBot }))
);
const AiCoachBubble = lazy(() =>
  import("./AiCoachBubble").then((module) => ({ default: module.AiCoachBubble }))
);

export function AiCoachGlobal() {
  const { role, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);


  // Listen for custom event to open chat (e.g., from other parts of the app)
  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("flexfit:open-ai-chat", openChat);
    return () => window.removeEventListener("flexfit:open-ai-chat", openChat);
  }, []);

  // Only show for members who are authenticated
  if (!isAuthenticated || role !== "member") {
    return null;
  }

  return (
    <>
      {isOpen && (
        <Suspense fallback={null}>
          <AiChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}

      <AnimatePresence>
        {!isOpen && (
          <Suspense fallback={null}>
            <AiCoachBubble onClick={() => setIsOpen(true)} unreadCount={1} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
