"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatedSection } from "./ui/AnimatedSection";
import { SearchForm } from "./SearchForm";
import { NursePreviewCard } from "./NursePreviewCard";
import { District } from "@/data/districts";
import { searchNurses, NurseSearchResult } from "@/lib/api";

export function SearchSection() {
  const [district, setDistrict] = useState<District | null>(null);
  const [category, setCategory] = useState<string>("");
  const [results, setResults] = useState<NurseSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!district) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await searchNurses({
        lat: district.lat,
        lng: district.lng,
        category: category || undefined,
        limit: 6,
      });

      setResults(data.nurses);
      setTotal(data.total);

      // Open drawer on mobile, smooth scroll on desktop
      if (window.innerWidth < 1024) {
        setMobileDrawerOpen(true);
      } else {
        // Smooth scroll to results after a short delay for animation
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDistrict(null);
    setCategory("");
    setResults([]);
    setTotal(0);
    setHasSearched(false);
    setMobileDrawerOpen(false);
  };

  const getAppSearchUrl = () => {
    if (!district) return "https://app.nurse-lite.com/patient/nurses";
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

  const showResults = hasSearched && results.length > 0;

  return (
    <section
      id="buscar"
      className="py-16 md:py-24 relative z-20"
      aria-labelledby="search-title"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b]" />

      {/* Decorative elements */}
      <div className="absolute top-10 left-0 w-64 h-64 bg-[#4a9d9a]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#1e3a5f]/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#4a9d9a]/10 dark:bg-[#4a9d9a]/20 text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            <Search className="w-4 h-4" />
            Busqueda Inteligente
          </span>
          <h2
            id="search-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-4"
          >
            Encuentra tu enfermera ideal{" "}
            <span className="gradient-text">en minutos</span>
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Busca entre 500+ profesionales verificados CEP cerca de tu ubicacion.
          </p>
        </AnimatedSection>

        {/* Side-by-side layout for Desktop */}
        <AnimatedSection delay={0.2}>
          <LayoutGroup>
            <motion.div
              layout
              transition={{
                layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
              }}
              className={`grid gap-8 ${
                showResults
                  ? "lg:grid-cols-[380px_1fr] items-start"
                  : "lg:grid-cols-1 max-w-xl mx-auto"
              }`}
            >
              {/* Form - Sticky on desktop when results shown */}
              <motion.div
                layout
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <SearchForm
                  district={district}
                  setDistrict={setDistrict}
                  category={category}
                  setCategory={setCategory}
                  onSearch={handleSearch}
                  onClear={handleClear}
                  loading={loading}
                  hasSearched={hasSearched}
                  className={showResults ? "lg:sticky lg:top-24" : ""}
                />
              </motion.div>

              {/* Results - Desktop only (hidden on mobile, shown in drawer) */}
              <AnimatePresence mode="wait">
                {showResults && (
                  <motion.div
                    ref={resultsRef}
                    layout
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.98 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { duration: 0.3 }
                    }}
                    className="hidden lg:block"
                  >
                    {/* Results Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="flex items-center justify-between mb-4"
                    >
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                        <span className="font-semibold text-[#1a1a2e] dark:text-white">
                          {total}
                        </span>{" "}
                        enfermeras disponibles en{" "}
                        <span className="font-medium">{district?.name}</span>
                      </p>
                    </motion.div>

                    {/* Results Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                      {results.map((nurse, index) => (
                        <motion.div
                          key={nurse.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.1 + index * 0.08,
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1]
                          }}
                        >
                          <NursePreviewCard nurse={nurse} index={index} />
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA */}
                    {total > results.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="text-center pt-4"
                      >
                        <Link
                          href={getAppSearchUrl()}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02]"
                        >
                          Ver las {total} enfermeras
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </AnimatedSection>

        {/* Mobile Results Indicator */}
        {showResults && (
          <div className="lg:hidden mt-4 text-center">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl"
            >
              Ver {total} enfermeras encontradas
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e293b] rounded-t-3xl z-50 lg:hidden max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-[#1a1a2e] dark:text-white">
                    {total} enfermeras disponibles
                  </h3>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                    en {district?.name}
                  </p>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 hover:bg-[#f1f5f9] dark:hover:bg-[#334155] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#64748b]" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((nurse, index) => (
                    <NursePreviewCard key={nurse.id} nurse={nurse} index={index} />
                  ))}
                </div>

                {/* CTA */}
                {total > results.length && (
                  <div className="mt-6 text-center pb-4">
                    <Link
                      href={getAppSearchUrl()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl w-full justify-center"
                    >
                      Ver las {total} enfermeras en la app
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      Continua en la app para contactar
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
