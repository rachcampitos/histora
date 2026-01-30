"use client";

import { motion } from "framer-motion";
import { Heart, Stethoscope, ArrowRight, Download, CheckCircle } from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-white py-0">
      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] via-[#2d5f8a] to-[#4a9d9a]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-10 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm"
            />
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm"
            />

            <div className="relative z-10 py-16 md:py-24 px-6 md:px-12">
              <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm font-medium mb-8"
                >
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Descarga gratis en App Store y Google Play
                </motion.div>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
                >
                  Comienza a cuidar mejor a tu familia hoy
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
                >
                  Unete a miles de familias en Lima que confian en NurseLite para
                  recibir atencion de enfermeria profesional y verificada.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                >
                  <Link
                    href="https://care.historahealth.com/auth/register?type=patient"
                    className="flex items-center gap-2 px-8 py-4 bg-white text-[#1e3a5f] font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                  >
                    <Heart className="w-5 h-5" />
                    Soy Paciente
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="https://care.historahealth.com/auth/register?type=nurse"
                    className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 transition-colors"
                  >
                    <Stethoscope className="w-5 h-5" />
                    Soy Enfermera
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>

                {/* Trust Points */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm"
                >
                  {[
                    "100% Enfermeras Verificadas",
                    "Sin costos ocultos",
                    "Soporte 24/7",
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {point}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
