import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } }
};

export default function PageTransition({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
