import { ShieldCheck, Clock, Star, Users, DollarSign, Calendar } from "lucide-react";
import { HeroContent } from "@/types";

export const heroContent: Record<"patient" | "nurse", HeroContent> = {
  patient: {
    badge: "Enfermeras CEP Verificadas",
    title: "Cuida a tu familia",
    highlight: "sin culpa ni preocupacion",
    subtitle:
      "Conectamos familias con enfermeras verificadas por CEP + RENIEC + Biometria IA. Seguimiento en tiempo real para tu completa tranquilidad.",
    cta: "Encontrar enfermera verificada",
    ctaLink: "https://care.historahealth.com/auth/register?type=patient",
    secondaryCta: "Ver como funciona",
    benefits: [
      { icon: ShieldCheck, text: "Triple Verificacion CEP + RENIEC + IA" },
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
    secondaryCta: "Ver beneficios",
    benefits: [
      { icon: DollarSign, text: "100% de tus ingresos son tuyos" },
      { icon: Calendar, text: "Tu defines tu disponibilidad" },
      { icon: Users, text: "500+ enfermeras activas" },
    ],
  },
};

export const trustStats = {
  nurses: "500+",
  nursesLabel: "Enfermeras verificadas",
  rating: "4.9",
  ratingLabel: "Calificacion promedio",
  services: "2,000+",
  servicesLabel: "Servicios este mes",
};
