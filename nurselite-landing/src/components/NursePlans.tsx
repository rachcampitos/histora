"use client";

import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Shield, Zap } from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "Basico",
    price: 0,
    priceLabel: "Gratis",
    icon: Shield,
    features: [
      "Hasta 10 solicitudes al mes",
      "Perfil verificado con CEP",
      "Notificaciones en tiempo real",
      "Visibilidad estandar en busquedas",
      "Soporte por chat (48h)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 39,
    priceLabel: "S/ 39",
    popular: true,
    icon: Zap,
    features: [
      "Solicitudes ilimitadas",
      'Badge "Profesional Verificado"',
      "2x mas visible en busquedas",
      "Estadisticas avanzadas de rendimiento",
      "Soporte prioritario (4h)",
    ],
    highlight: "Se paga solo con 1 servicio al mes",
  },
  {
    id: "premium",
    name: "Premium",
    price: 79,
    priceLabel: "S/ 79",
    icon: Crown,
    features: [
      "Todo del Plan Pro",
      "Perfil destacado en resultados",
      "5x mas visible en busquedas",
      "Dashboard profesional con analytics",
      "WhatsApp directo con soporte",
      "Agenda integrada con calendario",
    ],
    highlight: "Enfermeras Premium generan S/ 2,500-3,500/mes promedio",
  },
];

export function NursePlans() {
  return (
    <section
      id="planes"
      className="bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#4a9d9a]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#1e3a5f]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#4a9d9a]/10 dark:bg-[#4a9d9a]/20 text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Para Profesionales de Enfermeria
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6">
            Planes para{" "}
            <span className="gradient-text">Enfermeras</span>
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Elige el plan que mejor se adapte a tu practica profesional.
            Comienza gratis y crece a tu ritmo.
          </p>
        </AnimatedSection>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] text-white shadow-xl scale-[1.02]"
                  : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-400 text-[#1a1a2e] text-sm font-bold rounded-full whitespace-nowrap">
                  Mas popular
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.popular
                      ? "bg-white/20"
                      : "bg-gradient-to-br from-[#1e3a5f]/10 to-[#4a9d9a]/10 dark:from-[#4a9d9a]/20 dark:to-[#4a9d9a]/10"
                  }`}
                >
                  <plan.icon
                    className={`w-6 h-6 ${
                      plan.popular ? "text-white" : "text-[#4a9d9a]"
                    }`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold ${
                    plan.popular ? "text-white" : "text-[#1a1a2e] dark:text-white"
                  }`}
                >
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.popular ? "text-white" : "text-[#1e3a5f] dark:text-white"
                    }`}
                  >
                    {plan.priceLabel}
                  </span>
                  {plan.price > 0 && (
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-white/70" : "text-[#94a3b8]"
                      }`}
                    >
                      /mes
                    </span>
                  )}
                </div>
                {plan.highlight && (
                  <p
                    className={`text-sm mt-2 ${
                      plan.popular ? "text-white/80" : "text-[#64748b] dark:text-[#94a3b8]"
                    }`}
                  >
                    {plan.highlight}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-green-300" : "text-green-500 dark:text-green-400"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-white/90" : "text-[#64748b] dark:text-[#94a3b8]"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={`https://app.nurse-lite.com/auth/register?type=nurse${plan.price > 0 ? `&plan=${plan.id}` : ""}`}
                className={`block w-full py-4 text-center font-semibold rounded-xl transition-colors ${
                  plan.popular
                    ? "bg-white text-[#1e3a5f] hover:bg-white/90"
                    : plan.price === 0
                    ? "bg-[#1e3a5f] dark:bg-[#4a9d9a] text-white hover:opacity-90"
                    : "border-2 border-[#1e3a5f] dark:border-[#4a9d9a] text-[#1e3a5f] dark:text-[#4a9d9a] hover:bg-[#1e3a5f]/5 dark:hover:bg-[#4a9d9a]/10"
                }`}
              >
                {plan.price === 0 ? "Comenzar gratis" : `Elegir ${plan.name}`}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust Bar */}
        <AnimatedSection delay={0.4} className="mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-[#94a3b8] dark:text-[#64748b]">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4a9d9a]" />
              Pago seguro por Yape
            </span>
            <span className="hidden sm:block">|</span>
            <span>Activacion en max. 24h</span>
            <span className="hidden sm:block">|</span>
            <span>Cancela cuando quieras</span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
