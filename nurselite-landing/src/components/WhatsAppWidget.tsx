"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_NUMBER = "51923018997";
const DEFAULT_MESSAGE = "Hola, me gustaria recibir mas informacion sobre los servicios de enfermeria a domicilio.";

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  message?: string;
  showAfterMs?: number;
}

export function WhatsAppWidget({
  phoneNumber = WHATSAPP_NUMBER,
  message = DEFAULT_MESSAGE,
  showAfterMs = 3000,
}: WhatsAppWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfterMs);

    return () => clearTimeout(timer);
  }, [showAfterMs]);

  useEffect(() => {
    if (isVisible && !hasInteracted) {
      const tooltipTimer = setTimeout(() => {
        setIsTooltipVisible(true);
      }, 2000);

      const hideTooltipTimer = setTimeout(() => {
        setIsTooltipVisible(false);
      }, 7000);

      return () => {
        clearTimeout(tooltipTimer);
        clearTimeout(hideTooltipTimer);
      };
    }
  }, [isVisible, hasInteracted]);

  const handleClick = () => {
    setHasInteracted(true);
    setIsTooltipVisible(false);
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDismissTooltip = () => {
    setIsTooltipVisible(false);
    setHasInteracted(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-[#e2e8f0] dark:border-[#334155] p-4 max-w-[280px]"
          >
            <button
              onClick={handleDismissTooltip}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#64748b] text-white flex items-center justify-center hover:bg-[#475569] transition-colors"
              aria-label="Cerrar mensaje"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-sm text-[#1a1a2e] dark:text-white font-medium mb-1">
              ¿Necesitas ayuda?
            </p>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
              Chatea con nosotros por WhatsApp. Respondemos en minutos.
            </p>
            {/* Tooltip arrow */}
            <div className="absolute bottom-0 right-6 translate-y-full">
              <div className="w-3 h-3 bg-white dark:bg-[#1e293b] border-r border-b border-[#e2e8f0] dark:border-[#334155] transform rotate-45 -translate-y-1.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        onClick={handleClick}
        className="group relative w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label="Contactar por WhatsApp"
      >
        {/* Pulse animation ring */}
        {!hasInteracted && !shouldReduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366]"
            animate={{
              scale: [1, 1.2, 1.4],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.35, 1],
              repeatDelay: 0.5,
            }}
          />
        )}

        {/* Icon container with hover effect */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10"
        >
          <MessageCircle className="w-7 h-7" fill="currentColor" />
        </motion.div>

        {/* Hover tooltip for desktop */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
          WhatsApp
        </span>
      </motion.button>
    </div>
  );
}
