"use client";

import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Award,
  FileCheck,
  AlertCircle,
  Lock,
  UserCheck,
  BadgeCheck,
} from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./ui/AnimatedSection";
import Link from "next/link";

const verificationSteps = [
  {
    icon: FileCheck,
    title: "Registro de numero CEP",
    description: "La enfermera ingresa su numero de colegiatura oficial",
  },
  {
    icon: Shield,
    title: "Validacion en tiempo real",
    description: "Verificamos directamente con el Colegio de Enfermeros del Peru",
  },
  {
    icon: UserCheck,
    title: "Confirmacion de identidad",
    description: "Cruzamos datos: nombre completo, foto oficial y estado HABIL",
  },
  {
    icon: BadgeCheck,
    title: "Sello de verificacion",
    description: "Solo enfermeras HABILES obtienen el badge de verificacion",
  },
];

const guarantees = [
  {
    icon: Award,
    title: "Titulo profesional valido",
    description: "Licenciatura en enfermeria verificada",
  },
  {
    icon: CheckCircle2,
    title: "Colegiatura activa",
    description: "Habilitada para ejercer en Peru",
  },
  {
    icon: Lock,
    title: "Sin sanciones",
    description: "Estado HABIL sin inhabilitaciones",
  },
];

export function CEPVerification() {
  return (
    <section id="verificacion" className="bg-white dark:bg-[#1e293b] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a5f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <AnimatedSection>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" />
                Tu Seguridad es Nuestra Prioridad
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6">
                Verificacion{" "}
                <span className="gradient-text">CEP Garantizada</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-lg text-[#64748b] dark:text-[#94a3b8] mb-8 leading-relaxed">
                El <strong className="dark:text-white">Colegio de Enfermeros del Peru (CEP)</strong> es la entidad
                oficial que regula y supervisa el ejercicio profesional de enfermeria
                en el pais. En NurseLite, validamos cada enfermera directamente con el
                CEP para garantizar que estes en las mejores manos.
              </p>
            </AnimatedSection>

            {/* Guarantees */}
            <StaggerContainer className="space-y-4 mb-8" staggerDelay={0.1}>
              {guarantees.map((guarantee) => (
                <StaggerItem key={guarantee.title}>
                  <div className="flex items-start gap-4 p-4 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <guarantee.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1a1a2e] dark:text-white">{guarantee.title}</h4>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{guarantee.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <AnimatedSection delay={0.5}>
              <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Importante:</strong> Nunca contrates servicios de enfermeria
                  sin verificar la colegiatura. Tu seguridad y la de tu familia dependen
                  de ello.
                </p>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Content - Verification Process Visual */}
          <AnimatedSection direction="right" delay={0.3}>
            <div className="relative">
              {/* Main Card */}
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] rounded-3xl p-8 text-white">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Proceso de Verificacion</h3>
                  <p className="text-white/80 text-sm">
                    Asi garantizamos profesionales de confianza
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {verificationSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{step.title}</h4>
                        <p className="text-sm text-white/70">{step.description}</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="https://care.historahealth.com/auth/register"
                  className="mt-8 block w-full py-4 bg-white text-[#1e3a5f] font-semibold text-center rounded-xl hover:bg-white/90 transition-colors"
                >
                  Buscar Enfermeras Verificadas
                </Link>
              </div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl p-4 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-2">
                  <img
                    src="https://www.cep.org.pe/wp-content/uploads/2020/07/cropped-LOGO-CEP.png"
                    alt="Logo CEP"
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div>
                    <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">Verificado por</p>
                    <p className="text-sm font-bold text-[#1e3a5f] dark:text-white">CEP Peru</p>
                  </div>
                </div>
              </motion.div>

              {/* Stats Badge - Bottom right to avoid CTA overlap */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl p-4 border border-[#e2e8f0] dark:border-[#334155]"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#4a9d9a]">100%</p>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">Enfermeras Verificadas</p>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
