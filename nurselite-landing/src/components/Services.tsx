"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe,
  Stethoscope,
  Heart,
  Pill,
  Activity,
  Bandage,
  Baby,
  UserRound,
  Clock,
  ChevronRight,
} from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import Link from "next/link";

const serviceCategories = [
  {
    id: "basic",
    name: "Procedimientos Basicos",
    icon: Stethoscope,
    color: "#1e3a5f",
  },
  {
    id: "injections",
    name: "Inyecciones",
    icon: Syringe,
    color: "#2d5f8a",
  },
  {
    id: "care",
    name: "Cuidados Especiales",
    icon: Heart,
    color: "#4a9d9a",
  },
  {
    id: "elderly",
    name: "Adulto Mayor",
    icon: UserRound,
    color: "#6bb5b3",
  },
];

const services = {
  basic: [
    {
      name: "Control de Signos Vitales",
      description: "Presion arterial, temperatura, frecuencia cardiaca y respiratoria",
      duration: "15-30 min",
      price: "Desde S/. 35",
    },
    {
      name: "Toma de Glucosa",
      description: "Medicion de nivel de azucar en sangre con glucometro",
      duration: "10-15 min",
      price: "Desde S/. 25",
    },
    {
      name: "Nebulizacion",
      description: "Administracion de medicamentos por via respiratoria",
      duration: "20-30 min",
      price: "Desde S/. 45",
    },
  ],
  injections: [
    {
      name: "Inyeccion Intramuscular",
      description: "Aplicacion de medicamentos por via intramuscular",
      duration: "10-15 min",
      price: "Desde S/. 30",
    },
    {
      name: "Inyeccion Subcutanea",
      description: "Aplicacion de insulina u otros medicamentos subcutaneos",
      duration: "10-15 min",
      price: "Desde S/. 30",
    },
    {
      name: "Inyeccion Endovenosa",
      description: "Administracion de medicamentos por via intravenosa",
      duration: "15-30 min",
      price: "Desde S/. 50",
    },
  ],
  care: [
    {
      name: "Curacion de Heridas",
      description: "Limpieza, desinfeccion y vendaje de heridas",
      duration: "30-45 min",
      price: "Desde S/. 60",
    },
    {
      name: "Retiro de Puntos",
      description: "Retiro profesional de suturas post-operatorias",
      duration: "20-30 min",
      price: "Desde S/. 45",
    },
    {
      name: "Colocacion de Sonda",
      description: "Sonda vesical o nasogastrica segun indicacion medica",
      duration: "30-45 min",
      price: "Desde S/. 80",
    },
  ],
  elderly: [
    {
      name: "Cuidado Integral",
      description: "Aseo personal, alimentacion y acompañamiento",
      duration: "2-4 horas",
      price: "Desde S/. 120",
    },
    {
      name: "Acompañamiento Hospitalario",
      description: "Cuidado y supervision durante hospitalizacion",
      duration: "12 horas",
      price: "Desde S/. 250",
    },
    {
      name: "Terapia Fisica Basica",
      description: "Ejercicios de movilidad y rehabilitacion",
      duration: "45-60 min",
      price: "Desde S/. 80",
    },
  ],
};

export function Services() {
  const [activeCategory, setActiveCategory] = useState("basic");

  return (
    <section id="servicios" className="bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a9d9a]/5 dark:bg-[#4a9d9a]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            Nuestros Servicios
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6">
            Servicios de Enfermeria a Domicilio
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Ofrecemos una amplia gama de servicios profesionales de enfermeria.
            Todos realizados por enfermeras CEP verificadas.
          </p>
        </AnimatedSection>

        {/* Category Tabs */}
        <AnimatedSection delay={0.2} className="mb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {serviceCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white shadow-lg"
                    : "bg-white dark:bg-[#1e293b] text-[#64748b] hover:text-[#1e3a5f] dark:hover:text-white border border-[#e2e8f0] dark:border-[#334155]"
                }`}
              >
                <category.icon className="w-5 h-5" />
                {category.name}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Services Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services[activeCategory as keyof typeof services].map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-[#e2e8f0] dark:border-[#334155] hover:shadow-md transition-shadow flex flex-col h-full"
              >
                {/* Título - altura fija para alinear entre cards */}
                <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white leading-tight min-h-[3.5rem] flex items-start">
                  {service.name}
                </h3>

                {/* Precio */}
                <span className="text-xl font-bold text-[#4a9d9a] mb-3">{service.price}</span>

                {/* Descripción - crece para llenar espacio */}
                <p className="text-[#64748b] dark:text-[#94a3b8] text-sm leading-relaxed flex-1 mb-4">
                  {service.description}
                </p>

                {/* Footer - siempre al fondo */}
                <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <div className="flex items-center gap-2 text-sm text-[#64748b] dark:text-[#94a3b8]">
                    <Clock className="w-4 h-4" />
                    {service.duration}
                  </div>
                  <Link
                    href="https://care.historahealth.com/auth/register"
                    className="flex items-center gap-1 text-sm font-semibold text-[#1e3a5f] dark:text-[#4a9d9a] hover:text-[#4a9d9a] dark:hover:text-[#6bb5b3] transition-colors"
                  >
                    Ver enfermeras
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Price Disclaimer */}
        <p className="text-center text-sm text-[#94a3b8] dark:text-[#64748b] mt-6">
          * Los precios son referenciales. Cada enfermera establece sus tarifas segun experiencia y ubicacion.
        </p>

        {/* Additional Services Note */}
        <AnimatedSection delay={0.4} className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Pill className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1a1a2e] dark:text-white">Mas servicios disponibles</p>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  Consulta con nuestras enfermeras por servicios adicionales
                </p>
              </div>
            </div>
            <Link
              href="https://care.historahealth.com/auth/register"
              className="btn-primary !py-3 !px-6 text-sm whitespace-nowrap"
            >
              Ver Todas las Enfermeras
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
