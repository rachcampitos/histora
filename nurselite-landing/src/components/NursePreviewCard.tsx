"use client";

import { motion } from "framer-motion";
import { Star, CheckCircle2, MapPin } from "lucide-react";
import Image from "next/image";
import { NurseSearchResult } from "@/lib/api";

interface NursePreviewCardProps {
  nurse: NurseSearchResult;
  index: number;
}

export function NursePreviewCard({ nurse, index }: NursePreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group relative bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-sm border border-[#e2e8f0] dark:border-[#334155] hover:shadow-md hover:border-[#4a9d9a]/30 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Photo with Badge */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#4a9d9a]/20">
            {nurse.photoUrl ? (
              <Image
                src={nurse.photoUrl}
                alt={nurse.firstName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {nurse.firstName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {/* Verified Badge - outside overflow-hidden */}
          {nurse.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e293b] z-10">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="text-sm font-semibold text-[#1a1a2e] dark:text-white truncate">
              {nurse.firstName} {nurse.lastName?.charAt(0)}.
            </h4>
            {nurse.verified && (
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                CEP Verificado
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-1.5 truncate">
            {nurse.specialty}
          </p>

          {/* Rating & Distance */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-current" />
              <span className="text-xs font-medium text-[#1a1a2e] dark:text-white">
                {nurse.rating.toFixed(1)}
              </span>
              <span className="text-xs text-[#94a3b8]">
                ({nurse.totalReviews})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4a9d9a]" />
              <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                {nurse.distance.toFixed(1)} km
              </span>
            </div>
          </div>
        </div>

        {/* Availability Indicator */}
        <div className="flex-shrink-0">
          {nurse.available ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8] rounded-full text-[10px] font-medium">
              Ocupada
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
