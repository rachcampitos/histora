"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getFeaturedProfessionals, FeaturedResponse, fallbackFeaturedData } from "./api";

interface StatsContextValue {
  stats: FeaturedResponse["stats"];
  professionals: FeaturedResponse["professionals"];
  loading: boolean;
}

const StatsContext = createContext<StatsContextValue>({
  stats: fallbackFeaturedData.stats,
  professionals: fallbackFeaturedData.professionals,
  loading: true,
});

export function StatsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FeaturedResponse>(fallbackFeaturedData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedProfessionals()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <StatsContext.Provider value={{ stats: data.stats, professionals: data.professionals, loading }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  return useContext(StatsContext);
}
