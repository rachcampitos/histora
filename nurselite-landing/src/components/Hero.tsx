"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Heart,
  Star,
  ChevronRight,
  Stethoscope,
  CheckCircle2,
  Play,
  ShieldCheck,
  Clock,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Audience } from "@/types";

const audiences = {
  patient: {
    badge: "Enfermeras CEP Verificadas",
    title: "Cuida a tu familia",
    highlight: "sin culpa ni preocupacion",
    subtitle:
      "Conectamos familias con enfermeras verificadas por CEP + RENIEC + Biometria IA. Seguimiento en tiempo real para tu completa tranquilidad.",
    cta: "Encontrar enfermera verificada",
    ctaLink: "https://care.historahealth.com/auth/register?type=patient",
    microCopy: "Sin registro previo. Proceso en menos de 3 minutos.",
    benefits: [
      { icon: ShieldCheck, text: "Triple Verificacion: CEP + RENIEC + IA" },
      { icon: Clock, text: "Enfermeras disponibles hoy" },
      { icon: Star, text: "4.9/5 de calificacion promedio" },
    ],
  },
  nurse: {
    badge: "Unete a NurseLite",
    title: "Haz crecer tu carrera",
    highlight: "como enfermera independiente",
    subtitle:
      "Unete a la red de profesionales de salud mas confiable. Tu defines tu horario, tus precios, y te quedas con el 100% de tus ingresos.",
    cta: "Comenzar a ganar mas",
    ctaLink: "https://care.historahealth.com/auth/register?type=nurse",
    microCopy: "Registro gratuito. Sin comisiones por servicio.",
    benefits: [
      { icon: DollarSign, text: "100% de tus ingresos son tuyos" },
      { icon: Calendar, text: "Tu defines tu disponibilidad" },
      { icon: Users, text: "500+ enfermeras activas" },
    ],
  },
};

export function Hero() {
  const [audience, setAudience] = useState<Audience>("patient");
  const content = audiences[audience];
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-white to-white dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#0f172a]" />

      {/* Decorative Elements */}
      <div className="absolute top-40 right-0 w-96 h-96 bg-[#4a9d9a]/5 dark:bg-[#4a9d9a]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="max-w-xl min-h-[600px]">
            {/* Audience Selector */}
            <AnimatedSection delay={0.1}>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-3">
                ¿Que buscas?
              </p>
              <div
                className="inline-flex bg-[#f1f5f9] dark:bg-[#334155] p-1.5 rounded-full mb-8"
                role="tablist"
                aria-label="Seleccionar tipo de usuario"
              >
                <button
                  onClick={() => setAudience("patient")}
                  role="tab"
                  aria-selected={audience === "patient"}
                  aria-controls="hero-content"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    audience === "patient"
                      ? "bg-white dark:bg-[#1e293b] text-[#1e3a5f] dark:text-white shadow-md"
                      : "text-[#64748b] hover:text-[#1e3a5f] dark:hover:text-white"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Busco enfermera
                </button>
                <button
                  onClick={() => setAudience("nurse")}
                  role="tab"
                  aria-selected={audience === "nurse"}
                  aria-controls="hero-content"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    audience === "nurse"
                      ? "bg-white dark:bg-[#1e293b] text-[#1e3a5f] dark:text-white shadow-md"
                      : "text-[#64748b] hover:text-[#1e3a5f] dark:hover:text-white"
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Soy enfermera
                </button>
              </div>
            </AnimatedSection>

            {/* Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                id="hero-content"
                key={audience}
                role="tabpanel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Badge */}
                <span className="inline-block px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
                  {content.badge}
                </span>

                {/* Headline */}
                <h1
                  id="hero-title"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a2e] dark:text-white leading-tight mb-2"
                >
                  {content.title}
                </h1>
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text leading-tight mb-6">
                  {content.highlight}
                </p>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-[#64748b] dark:text-[#94a3b8] mb-8 leading-relaxed">
                  {content.subtitle}
                </p>

                {/* Benefits Pills */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {content.benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.text}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-4 py-2.5 rounded-full shadow-sm border border-[#e2e8f0] dark:border-[#334155]"
                    >
                      <benefit.icon className="w-4 h-4 text-[#4a9d9a]" />
                      <span className="text-sm font-medium text-[#1a1a2e] dark:text-white">
                        {benefit.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-3">
                  <Link
                    href={content.ctaLink}
                    className="btn-primary flex items-center justify-center gap-2 text-base"
                  >
                    {content.cta}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="btn-secondary flex items-center justify-center gap-2 text-base"
                  >
                    <Play className="w-5 h-5" />
                    Ver como funciona
                  </Link>
                </div>

                {/* Micro-copy */}
                <p className="text-sm text-[#94a3b8] dark:text-[#64748b]">
                  {content.microCopy}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Trust Indicators */}
            <AnimatedSection delay={0.6} className="mt-10 pt-8 border-t border-[#e2e8f0] dark:border-[#334155]">
              <p className="text-xs text-[#94a3b8] dark:text-[#64748b] uppercase tracking-wider mb-4">
                Confian en nosotros
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] border-2 border-white dark:border-[#0f172a] flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-bold">
                          {String.fromCharCode(64 + i)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                    <strong className="text-[#1a1a2e] dark:text-white">500+</strong> enfermeras verificadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-[#fbbf24]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                    <strong className="text-[#1a1a2e] dark:text-white">4.9/5</strong> calificacion promedio
                  </span>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Content - Hero Image/Illustration */}
          <AnimatedSection direction="right" delay={0.3} className="hidden lg:block pt-16">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl p-8 border border-[#e2e8f0] dark:border-[#334155]">
                {/* Mock App Interface */}
                <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/nurselite.png"
                        alt="NurseLite logo"
                        width={48}
                        height={48}
                        className="rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-bold text-[#1a1a2e] dark:text-white">NurseLite</p>
                        <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">Tu enfermera a un toque</p>
                      </div>
                    </div>
                    <div className="trust-badge">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      CEP
                    </div>
                  </div>

                  {/* Search Preview */}
                  <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-sm mb-4">
                    <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-3">Enfermeras disponibles hoy</p>
                    <div className="space-y-3">
                      {[
                        { name: "Maria C.", rating: 4.9, specialty: "Geriatria", verified: true },
                        { name: "Ana L.", rating: 4.8, specialty: "Curaciones", verified: true },
                        { name: "Rosa M.", rating: 5.0, specialty: "Inyecciones", verified: true },
                      ].map((nurse, i) => (
                        <motion.div
                          key={nurse.name}
                          initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.15 }}
                          className="flex items-center gap-3 p-3 bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f]" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">
                                {nurse.name}
                              </p>
                              {nurse.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">{nurse.specialty}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-current" aria-hidden="true" />
                            <span className="text-sm font-medium dark:text-white">{nurse.rating}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Preview */}
                  <div className="w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl text-center">
                    Solicitar Servicio
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg p-4 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Triple Verificacion</p>
                    <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">CEP + RENIEC + IA</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg p-4 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex text-[#fbbf24]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">"Excelente servicio!"</p>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
