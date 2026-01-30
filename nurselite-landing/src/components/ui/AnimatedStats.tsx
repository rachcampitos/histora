"use client";

import { useRef } from "react";
import CountUp from "react-countup";
import { motion, useInView } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: LucideIcon;
}

interface AnimatedStatsProps {
  stats: Stat[];
  className?: string;
  variant?: "default" | "compact" | "hero";
}

export function AnimatedStats({
  stats,
  className = "",
  variant = "default",
}: AnimatedStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (variant === "hero") {
    return (
      <div ref={ref} className={`flex flex-wrap items-center gap-8 ${className}`}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-bold text-[#1a1a2e] dark:text-white">
                {stat.prefix}
                {isInView ? (
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    separator=","
                    useEasing
                  />
                ) : (
                  "0"
                )}
              </span>
              {stat.suffix && (
                <span className="text-2xl md:text-3xl font-bold text-[#4a9d9a]">
                  {stat.suffix}
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div ref={ref} className={`space-y-3 ${className}`}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex items-baseline justify-between"
          >
            <span className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
              {stat.prefix}
              {isInView ? (
                <CountUp
                  end={stat.value}
                  duration={2}
                  separator=","
                  useEasing
                />
              ) : (
                "0"
              )}
              {stat.suffix && (
                <span className="text-[#4a9d9a]">{stat.suffix}</span>
              )}
            </span>
            <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: index * 0.15, duration: 0.6 }}
          className="text-center p-6 rounded-2xl bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-sm border border-[#e2e8f0] dark:border-[#334155]"
        >
          {stat.icon && (
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center">
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl md:text-5xl font-bold text-[#1e3a5f] dark:text-white">
              {stat.prefix}
              {isInView ? (
                <CountUp
                  end={stat.value}
                  duration={2.5}
                  separator=","
                  useEasing
                />
              ) : (
                "0"
              )}
            </span>
            {stat.suffix && (
              <span className="text-2xl md:text-3xl font-bold text-[#4a9d9a]">
                {stat.suffix}
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-2">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
