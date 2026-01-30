"use client";

import { motion } from "framer-motion";
import {
  Syringe,
  Stethoscope,
  Heart,
  UserRound,
  Clock,
  ChevronRight,
  Sparkles,
  Shield,
} from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import { AnimatedStats } from "./ui/AnimatedStats";
import Link from "next/link";

const bentoServices = [
  {
    id: "elderly",
    title: "Cuidado de Adulto Mayor",
    description: "Atencion integral: aseo personal, alimentacion, acompanamiento y supervision 24/7",
    icon: UserRound,
    price: "Desde S/. 120",
    duration: "2-12 horas",
    featured: true,
    gradient: "from-[#1e3a5f] to-[#4a9d9a]",
  },
  {
    id: "injections",
    title: "Inyecciones a Domicilio",
    description: "Intramuscular, subcutanea o endovenosa por profesionales certificados",
    icon: Syringe,
    price: "Desde S/. 30",
    duration: "10-30 min",
    featured: false,
  },
  {
    id: "vitals",
    title: "Control de Signos Vitales",
    description: "Presion arterial, temperatura, frecuencia cardiaca y respiratoria",
    icon: Stethoscope,
    price: "Desde S/. 35",
    duration: "15-30 min",
    featured: false,
  },
  {
    id: "wounds",
    title: "Curacion de Heridas",
    description: "Limpieza, desinfeccion y vendaje profesional post-operatorio",
    icon: Heart,
    price: "Desde S/. 60",
    duration: "30-45 min",
    featured: false,
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Profesionales" },
  { value: 2000, suffix: "+", label: "Servicios" },
  { value: 4.9, suffix: "/5", label: "Rating" },
];

export function Services() {
  return (
    <section
      id="servicios"
      className="relative overflow-hidden"
      aria-labelledby="services-title"
    >
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="absolute inset-0 opacity-60 dark:opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4a9d9a]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#1e3a5f]/20 rounded-full blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Nuestros Servicios
          </span>
          <h2
            id="services-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6"
          >
            Servicios de Enfermeria a Domicilio
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Atencion profesional en la comodidad de tu hogar.
            Todos nuestros profesionales estan verificados por el CEP.
          </p>
        </AnimatedSection>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Featured Card - Spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] p-8 text-white"
          >
            {/* Glass overlay pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                <UserRound className="w-8 h-8" />
              </div>

              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                {bentoServices[0].title}
              </h3>
              <p className="text-white/80 mb-6 flex-1 text-lg">
                {bentoServices[0].description}
              </p>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold whitespace-nowrap">{bentoServices[0].price}</p>
                  <p className="text-white/70 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    {bentoServices[0].duration}
                  </p>
                </div>
                <Link
                  href="https://care.historahealth.com/auth/register?type=patient"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#1e3a5f] font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Solicitar
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Glass Cards */}
          {bentoServices.slice(1).map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl p-6 flex flex-col h-full"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mb-2">
                {service.title}
              </h3>
              <p className="text-[#64748b] dark:text-[#94a3b8] text-sm mb-4 flex-1">
                {service.description}
              </p>

              <div className="pt-4 border-t border-[#e2e8f0]/50 dark:border-[#334155]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#4a9d9a]">{service.price}</p>
                    <p className="text-xs text-[#94a3b8] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration}
                    </p>
                  </div>
                  <Link
                    href="https://care.historahealth.com/auth/register?type=patient"
                    className="text-[#1e3a5f] dark:text-[#4a9d9a] hover:text-[#4a9d9a] dark:hover:text-white transition-colors"
                    aria-label={`Ver enfermeras para ${service.title}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Stats Card with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#4a9d9a]" />
              <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">
                Verificadas CEP
              </span>
            </div>
            <AnimatedStats stats={stats} variant="compact" />
          </motion.div>
        </div>

        {/* Price Disclaimer */}
        <p className="text-center text-sm text-[#94a3b8] dark:text-[#64748b]">
          * Los precios son referenciales. Cada enfermera establece sus tarifas segun experiencia y ubicacion.
        </p>

        {/* CTA */}
        <AnimatedSection delay={0.4} className="mt-10 text-center">
          <Link
            href="https://care.historahealth.com/auth/register?type=patient"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Ver Todos los Servicios
            <ChevronRight className="w-5 h-5" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
