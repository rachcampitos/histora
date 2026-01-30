"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTestimonial = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-advance with pause on hover
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextTestimonial]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  return (
    <section
      id="testimonios"
      className="bg-white dark:bg-[#1e293b] relative overflow-hidden"
      aria-labelledby="testimonials-title"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#4a9d9a]/10 dark:bg-[#4a9d9a]/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-4">
            Testimonios Reales
          </span>
          <h2
            id="testimonials-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6"
          >
            Lo Que Dicen Nuestros Usuarios
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Miles de familias en Lima confian en NurseLite para el cuidado de sus seres queridos.
          </p>
        </AnimatedSection>

        {/* Testimonials Carousel */}
        <div
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="relative">
            {/* Main Testimonial Card */}
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-gradient-to-br from-[#f8fafc] to-white dark:from-[#0f172a] dark:to-[#1e293b] rounded-3xl p-8 md:p-12 shadow-lg border border-[#e2e8f0] dark:border-[#334155]"
              >
                {/* Quote Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center mb-6">
                  <Quote className="w-7 h-7 text-white" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-xl md:text-2xl text-[#1a1a2e] dark:text-white font-medium leading-relaxed mb-8">
                  "{testimonials[currentIndex].text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {testimonials[currentIndex].avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1a2e] dark:text-white">
                        {testimonials[currentIndex].name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#64748b] dark:text-[#94a3b8]">
                        <MapPin className="w-3.5 h-3.5" />
                        {testimonials[currentIndex].location}
                      </div>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-[#4a9d9a]/10 dark:bg-[#4a9d9a]/20 text-[#4a9d9a] rounded-full text-sm font-medium">
                    {testimonials[currentIndex].service}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors shadow-sm"
                aria-label="Testimonio anterior"
              >
                <ChevronLeft className="w-5 h-5 text-[#1e3a5f] dark:text-white" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex
                        ? "w-8 h-2 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a]"
                        : "w-2 h-2 bg-[#e2e8f0] dark:bg-[#334155] hover:bg-[#cbd5e1] dark:hover:bg-[#475569]"
                    }`}
                    aria-label={`Ir al testimonio ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors shadow-sm"
                aria-label="Siguiente testimonio"
              >
                <ChevronRight className="w-5 h-5 text-[#1e3a5f] dark:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <AnimatedSection delay={0.4} className="mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "4.9", label: "Calificacion promedio", suffix: "/5" },
              { value: "500+", label: "Enfermeras activas", suffix: "" },
              { value: "2,000+", label: "Servicios realizados", suffix: "" },
              { value: "98%", label: "Clientes satisfechos", suffix: "" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl"
              >
                <p className="text-3xl md:text-4xl font-bold text-[#1e3a5f] dark:text-white mb-2">
                  {stat.value}
                  <span className="text-[#4a9d9a]">{stat.suffix}</span>
                </p>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
