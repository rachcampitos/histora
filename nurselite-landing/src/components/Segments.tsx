"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatedSection } from "./ui/AnimatedSection";
import { segments } from "@/data/segments";

export function Segments() {
  return (
    <section
      id="segmentos"
      className="bg-white dark:bg-[#0f172a] relative overflow-hidden"
      aria-labelledby="segments-title"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4a9d9a]/5 dark:bg-[#4a9d9a]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            Soluciones para Ti
          </span>
          <h2
            id="segments-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6"
          >
            ¿Quien necesita NurseLite?
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Tenemos enfermeras especializadas para cada situacion.
            Encuentra la atencion perfecta para tus necesidades.
          </p>
        </AnimatedSection>

        {/* Segments Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {segments.map((segment, index) => (
            <AnimatedSection key={segment.id} delay={index * 0.15}>
              <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-2xl p-8 border border-[#e2e8f0] dark:border-[#334155] hover:shadow-lg transition-shadow h-full flex flex-col">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center mb-6">
                  <segment.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-3">
                  {segment.title}
                </h3>

                {/* Description */}
                <p className="text-[#64748b] dark:text-[#94a3b8] mb-6">
                  {segment.description}
                </p>

                {/* Services List */}
                <ul className="space-y-2 mb-6 flex-1">
                  {segment.services.map((service) => (
                    <li
                      key={service}
                      className="flex items-center gap-2 text-sm text-[#64748b] dark:text-[#94a3b8]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4a9d9a]" />
                      {service}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={segment.ctaLink}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#4a9d9a] focus:ring-offset-2 dark:focus:ring-offset-[#1e293b]"
                >
                  {segment.cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
