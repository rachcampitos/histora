"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Search, ChevronDown, X } from "lucide-react";
import { limaDistricts, serviceCategories, District } from "@/data/districts";

interface SearchFormProps {
  district: District | null;
  setDistrict: (district: District | null) => void;
  category: string;
  setCategory: (category: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
  hasSearched: boolean;
  className?: string;
}

export function SearchForm({
  district,
  setDistrict,
  category,
  setCategory,
  onSearch,
  onClear,
  loading,
  hasSearched,
  className = "",
}: SearchFormProps) {
  const [districtOpen, setDistrictOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");

  const districtRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        districtRef.current &&
        !districtRef.current.contains(event.target as Node)
      ) {
        setDistrictOpen(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDistricts = limaDistricts.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const selectedCategoryLabel =
    serviceCategories.find((c) => c.value === category)?.label ||
    "Todos los servicios";

  const isSearchDisabled = !district || loading;

  return (
    <div className={`glass-card rounded-2xl p-5 sm:p-6 ${className}`}>
      <p className="text-sm font-medium text-[#1a1a2e] dark:text-white mb-4">
        500+ enfermeras verificadas CEP disponibles en Lima
      </p>

      <div className="flex flex-col gap-4">
        {/* District Selector */}
        <div ref={districtRef} className="relative">
          <label className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] mb-1.5 block">
            Distrito
          </label>
          <button
            type="button"
            onClick={() => {
              setDistrictOpen(!districtOpen);
              setCategoryOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left bg-white dark:bg-[#0f172a] dropdown-trigger ${
              districtOpen ? "dropdown-trigger-active" : ""
            }`}
          >
            <MapPin className="w-5 h-5 text-[#4a9d9a] flex-shrink-0" />
            <span
              className={`flex-1 truncate ${
                district
                  ? "text-[#1a1a2e] dark:text-white font-medium"
                  : "text-[#94a3b8]"
              }`}
            >
              {district?.name || "Selecciona distrito"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#64748b] transition-transform ${
                districtOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {districtOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-3 border-b border-[#e2e8f0] dark:border-[#334155]">
                  <input
                    type="text"
                    placeholder="Buscar distrito..."
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-lg text-sm focus:outline-none focus:border-[#4a9d9a] text-[#1a1a2e] dark:text-white"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredDistricts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[#94a3b8]">
                      No se encontraron distritos
                    </p>
                  ) : (
                    filteredDistricts.map((d) => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => {
                          setDistrict(d);
                          setDistrictOpen(false);
                          setDistrictSearch("");
                        }}
                        className={`w-full px-4 py-3 text-left text-sm dropdown-item ${
                          district?.name === d.name
                            ? "dropdown-item-selected"
                            : "text-[#1a1a2e] dark:text-white"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Selector */}
        <div ref={categoryRef} className="relative">
          <label className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] mb-1.5 block">
            Tipo de servicio
          </label>
          <button
            type="button"
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setDistrictOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left bg-white dark:bg-[#0f172a] dropdown-trigger ${
              categoryOpen ? "dropdown-trigger-active" : ""
            }`}
          >
            <Briefcase className="w-5 h-5 text-[#4a9d9a] flex-shrink-0" />
            <span
              className={`flex-1 truncate ${
                category
                  ? "text-[#1a1a2e] dark:text-white font-medium"
                  : "text-[#94a3b8]"
              }`}
            >
              {category ? selectedCategoryLabel : "Todos los servicios"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#64748b] transition-transform ${
                categoryOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {categoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-lg overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        setCategoryOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm dropdown-item ${
                        category === cat.value
                          ? "dropdown-item-selected"
                          : "text-[#1a1a2e] dark:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Helper text */}
        {!district && !hasSearched && (
          <p className="text-xs text-[#94a3b8] dark:text-[#64748b] -mt-1">
            Selecciona un distrito para buscar
          </p>
        )}

        {/* Search Button */}
        <div className="flex gap-2">
          {hasSearched && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-3 bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8] rounded-xl hover:bg-[#e2e8f0] dark:hover:bg-[#475569] transition-colors"
              aria-label="Limpiar busqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearchDisabled}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
              isSearchDisabled ? "btn-search-disabled" : "btn-search-active"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Ver enfermeras</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
