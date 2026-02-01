"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Star,
  MessageCircle,
  Wallet,
  ClipboardList,
  Smartphone,
} from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import Image from "next/image";

const features = [
  {
    id: "cep-verification",
    icon: ShieldCheck,
    title: "Verificacion CEP",
    description:
      "Todos los profesionales validados por el Colegio de Enfermeros del Peru",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    delay: 0,
  },
  {
    id: "gps-tracking",
    icon: MapPin,
    title: "GPS en tiempo real",
    description:
      "Sigue la ubicacion de tu profesional desde que acepta hasta que llega",
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    delay: 0.1,
  },
  {
    id: "reviews",
    icon: Star,
    title: "Sistema de resenas",
    description:
      "Miles de familias comparten su experiencia para ayudarte a elegir",
    color: "from-amber-500 to-yellow-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    delay: 0.2,
  },
  {
    id: "chat",
    icon: MessageCircle,
    title: "Chat en tiempo real",
    description:
      "Comunicacion directa con tu profesional antes, durante y despues",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    delay: 0.3,
  },
  {
    id: "payments",
    icon: Wallet,
    title: "Pagos seguros",
    description: "Paga con Yape, Plin o efectivo. Sin complicaciones",
    color: "from-teal-500 to-cyan-600",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    delay: 0.4,
  },
  {
    id: "history",
    icon: ClipboardList,
    title: "Historial completo",
    description: "Accede a todos tus servicios anteriores cuando lo necesites",
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    iconColor: "text-slate-600 dark:text-slate-400",
    delay: 0.5,
  },
];

// Animated icon component with Lottie-like effects
function AnimatedIcon({
  icon: Icon,
  color,
  bgColor,
  iconColor,
  featureId,
}: {
  icon: typeof ShieldCheck;
  color: string;
  bgColor: string;
  iconColor: string;
  featureId: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  // Different animations for different icons
  const getAnimation = (): { scale?: number[]; y?: number[]; x?: number[]; rotate?: number[]; opacity?: number[]; transition?: object } => {
    if (shouldReduceMotion) return {};

    const easeInOut = [0.4, 0, 0.2, 1] as const;

    switch (featureId) {
      case "cep-verification":
        return {
          scale: [1, 1.1, 1],
          transition: { duration: 2, repeat: Infinity, ease: easeInOut },
        };
      case "gps-tracking":
        return {
          y: [0, -4, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: easeInOut },
        };
      case "reviews":
        return {
          rotate: [0, 10, -10, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: easeInOut },
        };
      case "chat":
        return {
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
          transition: { duration: 1.8, repeat: Infinity, ease: easeInOut },
        };
      case "payments":
        return {
          x: [0, 2, -2, 0],
          transition: { duration: 2, repeat: Infinity, ease: easeInOut },
        };
      case "history":
        return {
          y: [0, 2, 0],
          transition: { duration: 2.2, repeat: Infinity, ease: easeInOut },
        };
      default:
        return {};
    }
  };

  return (
    <div className={`relative w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
      {/* Pulse ring for verification */}
      {featureId === "cep-verification" && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-green-500/20"
          animate={{
            scale: [1, 1.15, 1.3],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.3, 1],
            repeatDelay: 0.5,
          }}
        />
      )}

      {/* GPS ping effect */}
      {featureId === "gps-tracking" && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-blue-500/20"
          animate={{
            scale: [1, 1.2, 1.4],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.3, 1],
            repeatDelay: 0.3,
          }}
        />
      )}

      <motion.div animate={getAnimation()}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </motion.div>
    </div>
  );
}

// Feature card component
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: feature.delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm hover:shadow-lg border border-[#e2e8f0] dark:border-[#334155] transition-all duration-300"
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />

      <AnimatedIcon
        icon={feature.icon}
        color={feature.color}
        bgColor={feature.bgColor}
        iconColor={feature.iconColor}
        featureId={feature.id}
      />

      <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mt-4 mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}

export function AppFeatures() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="tecnologia"
      className="pt-12 pb-12 md:pt-16 md:pb-16 relative overflow-hidden"
      aria-labelledby="features-title"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-white dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]" />

      {/* Decorative blurs */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-[#4a9d9a]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-[#1e3a5f]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            <Smartphone className="w-4 h-4" />
            Tecnologia de Confianza
          </span>
          <h2
            id="features-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6"
          >
            Una app disenada para{" "}
            <span className="gradient-text">tu tranquilidad</span>
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Tecnologia que pone tu bienestar primero. Desde la verificacion
            hasta el seguimiento en tiempo real.
          </p>
        </AnimatedSection>

        {/* Features Grid with Phone Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
          {/* Left column - 3 features */}
          <div className="space-y-6 order-2 lg:order-1">
            {features.slice(0, 3).map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>

          {/* Center - Phone mockup */}
          <div className="order-1 lg:order-2 flex justify-center py-8 lg:py-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Phone frame */}
              <div className="relative w-[280px] h-[560px] bg-[#1a1a2e] rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-gradient-to-b from-[#f8fafc] to-white dark:from-[#1e293b] dark:to-[#0f172a] rounded-[2.5rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="h-12 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-20 h-6 bg-black rounded-full" />
                  </div>

                  {/* App content mockup */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-[#64748b]">Hola, Maria</p>
                        <p className="text-sm font-bold text-[#1a1a2e] dark:text-white">
                          Buscar profesional
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f]" />
                    </div>

                    {/* Map placeholder with animated marker */}
                    <div className="relative h-40 bg-[#e2e8f0] dark:bg-[#334155] rounded-2xl mb-4 overflow-hidden">
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-[#4a9d9a] rounded-full" />
                        <div className="absolute top-1/2 right-1/3 w-12 h-12 border-2 border-[#4a9d9a] rounded-full" />
                      </div>
                      {/* Animated marker */}
                      <motion.div
                        animate={
                          shouldReduceMotion
                            ? {}
                            : {
                                y: [0, -8, 0],
                              }
                        }
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      >
                        <div className="w-8 h-8 bg-[#4a9d9a] rounded-full flex items-center justify-center shadow-lg">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="w-2 h-2 bg-[#4a9d9a] rotate-45 mx-auto -mt-1" />
                      </motion.div>
                    </div>

                    {/* Professional card */}
                    <div className="bg-white dark:bg-[#0f172a] rounded-xl p-3 shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">
                              Ana M.
                            </p>
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                          </div>
                          <p className="text-xs text-[#64748b]">
                            En camino - 5 min
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span className="text-sm font-medium">4.9</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat button */}
                    <motion.div
                      animate={
                        shouldReduceMotion
                          ? {}
                          : {
                              scale: [1, 1.05, 1],
                            }
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white text-sm font-semibold rounded-xl text-center"
                    >
                      Enviar mensaje
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [0, -5, 0],
                      }
                }
                transition={{
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute -right-4 top-32 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg p-3 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a2e] dark:text-white">
                      CEP Verificado
                    </p>
                    <p className="text-[10px] text-[#64748b]">100% confiable</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating rating */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [0, 5, 0],
                      }
                }
                transition={{
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                }}
                className="absolute -left-4 bottom-40 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg p-3 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a2e] dark:text-white">
                    4.9
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right column - 3 features */}
          <div className="space-y-6 order-3">
            {features.slice(3, 6).map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                index={index + 3}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
