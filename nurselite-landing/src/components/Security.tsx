"use client";

import { Shield } from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import { securityFeatures } from "@/data/security";

export function Security() {
  return (
    <section
      id="seguridad"
      className="bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] relative overflow-hidden"
      aria-labelledby="security-title"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            Tu Seguridad es Nuestra Prioridad
          </span>
          <h2
            id="security-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Tecnologia que cuida de ti
          </h2>
          <p className="text-lg text-white/80">
            NurseLite utiliza la tecnologia mas avanzada para garantizar tu seguridad
            y la de tu familia durante cada servicio.
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.1}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm flex-1">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Trust Badge */}
        <AnimatedSection delay={0.6} className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">
              Primera plataforma en Peru con verificacion oficial CEP integrada
            </span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
