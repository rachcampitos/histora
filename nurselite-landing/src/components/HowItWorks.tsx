"use client";

import { motion } from "framer-motion";
import {
  Search,
  UserCheck,
  Calendar,
  Home,
  ArrowRight,
  Smartphone,
  Shield,
  Clock,
} from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./ui/AnimatedSection";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Busca tu enfermera",
    description:
      "Explora perfiles de enfermeras verificadas cerca de ti. Filtra por especialidad, disponibilidad y calificaciones.",
    color: "#1e3a5f",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Verifica su perfil",
    description:
      "Revisa su verificación CEP, experiencia, servicios ofrecidos y reseñas de otros pacientes.",
    color: "#2d5f8a",
  },
  {
    number: "03",
    icon: Calendar,
    title: "Agenda tu cita",
    description:
      "Selecciona el servicio que necesitas, elige fecha y hora. La enfermera confirmará tu solicitud.",
    color: "#4a9d9a",
  },
  {
    number: "04",
    icon: Home,
    title: "Recibe atención en casa",
    description:
      "La enfermera llegará a tu domicilio puntualmente. Tú y tu familia en las mejores manos.",
    color: "#6bb5b3",
  },
];

const features = [
  {
    icon: Smartphone,
    title: "Fácil de usar",
    description: "Interfaz intuitiva diseñada para todas las edades",
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Todas las enfermeras son verificadas por el CEP",
  },
  {
    icon: Clock,
    title: "Rápido",
    description: "Encuentra enfermera disponible en minutos",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#4a9d9a]/5 dark:from-[#4a9d9a]/10 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-[#4a9d9a]/10 dark:bg-[#4a9d9a]/20 text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            Simple y Rápido
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6">
            Cómo Funciona NurseLite
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            En solo 4 pasos, conecta con una enfermera profesional y recibe atención
            de calidad en la comodidad de tu hogar.
          </p>
        </AnimatedSection>

        {/* Steps */}
        <div className="relative mb-20">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1e3a5f] via-[#4a9d9a] to-[#6bb5b3] -translate-y-1/2" />

          <StaggerContainer
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            staggerDelay={0.15}
          >
            {steps.map((step, index) => (
              <StaggerItem key={step.number}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-[#e2e8f0] dark:border-[#334155] h-full"
                >
                  {/* Step Number */}
                  <div
                    className="absolute -top-4 -left-4 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: step.color }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mt-4"
                    style={{ background: `${step.color}15` }}
                  >
                    <step.icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-3">{step.title}</h3>
                  <p className="text-[#64748b] dark:text-[#94a3b8] text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1e293b] shadow-md flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-[#4a9d9a]" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Features Row */}
        <AnimatedSection delay={0.4}>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-white dark:bg-[#1e293b] rounded-xl p-5 shadow-sm border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1a1a2e] dark:text-white">{feature.title}</h4>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
