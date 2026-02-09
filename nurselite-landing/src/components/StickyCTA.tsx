"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Users } from "lucide-react";
import Link from "next/link";
import { useStats } from "@/lib/StatsContext";

export function StickyCTA() {
  const { stats } = useStats();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (approximately 600px)
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 600 && !isDismissed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden"
        >
          <div className="relative">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#1e293b] dark:bg-white rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-[#4a9d9a]"
              aria-label="Cerrar"
            >
              <X className="w-3 h-3 text-white dark:text-[#1e293b]" />
            </button>

            {/* CTA Button */}
            <Link
              href="https://app.nurse-lite.com/auth/register?type=patient"
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-2xl shadow-2xl hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-[#4a9d9a] focus:ring-offset-2"
            >
              <span>Encontrar enfermera</span>
              <ChevronRight className="w-5 h-5" />
            </Link>

            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
              <Users className="w-3 h-3" />
              <span>{stats.totalProfessionals}+ disponibles</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
