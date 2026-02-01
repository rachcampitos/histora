"use client";

import { motion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { NurseSearchResult } from "@/lib/api";
import { District } from "@/data/districts";
import { NursePreviewCard } from "./NursePreviewCard";

interface SearchResultsProps {
  results: NurseSearchResult[];
  total: number;
  district: District;
  category?: string;
  loading?: boolean;
}

export function SearchResults({
  results,
  total,
  district,
  category,
  loading,
}: SearchResultsProps) {
  // Build app URL with search params
  const getAppSearchUrl = () => {
    const params = new URLSearchParams({
      lat: district.lat.toString(),
      lng: district.lng.toString(),
      district: district.name,
      utm_source: "landing",
      utm_medium: "search_widget",
    });
    if (category) {
      params.append("category", category);
    }
    return `https://app.nurse-lite.com/patient/nurses?${params}`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1e293b] rounded-xl p-4 border border-[#e2e8f0] dark:border-[#334155] animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-[#f1f5f9] dark:bg-[#334155]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f1f5f9] dark:bg-[#334155] rounded w-24" />
                  <div className="h-3 bg-[#f1f5f9] dark:bg-[#334155] rounded w-16" />
                  <div className="h-3 bg-[#f1f5f9] dark:bg-[#334155] rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-center py-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f1f5f9] dark:bg-[#334155] flex items-center justify-center">
          <Users className="w-8 h-8 text-[#64748b]" />
        </div>
        <h4 className="text-lg font-semibold text-[#1a1a2e] dark:text-white mb-2">
          No encontramos enfermeras en esta zona
        </h4>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-4">
          Prueba con otro distrito o tipo de servicio
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-8"
    >
      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
          <span className="font-semibold text-[#1a1a2e] dark:text-white">
            {total}
          </span>{" "}
          enfermeras disponibles en{" "}
          <span className="font-medium">{district.name}</span>
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {results.map((nurse, index) => (
          <NursePreviewCard key={nurse.id} nurse={nurse} index={index} />
        ))}
      </div>

      {/* CTA to App */}
      {total > results.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <Link
            href={getAppSearchUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            Ver las {total} enfermeras disponibles
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-xs text-[#94a3b8] dark:text-[#64748b]">
            Continua en la app para contactar enfermeras
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
