import { Stethoscope, Syringe, Heart, UserRound } from "lucide-react";
import { ServiceCategory, ServicesByCategory } from "@/types";

export const serviceCategories: ServiceCategory[] = [
  {
    id: "basic",
    name: "Procedimientos Básicos",
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

export const services: ServicesByCategory = {
  basic: [
    {
      name: "Control de Signos Vitales",
      description: "Presión arterial, temperatura, frecuencia cardíaca y respiratoria",
      duration: "15-30 min",
      price: "Desde S/. 35",
    },
    {
      name: "Toma de Glucosa",
      description: "Medición de nivel de azúcar en sangre con glucómetro",
      duration: "10-15 min",
      price: "Desde S/. 25",
    },
    {
      name: "Nebulización",
      description: "Administración de medicamentos por vía respiratoria",
      duration: "20-30 min",
      price: "Desde S/. 45",
    },
  ],
  injections: [
    {
      name: "Inyección Intramuscular",
      description: "Aplicación de medicamentos por vía intramuscular",
      duration: "10-15 min",
      price: "Desde S/. 30",
    },
    {
      name: "Inyección Subcutánea",
      description: "Aplicación de insulina u otros medicamentos subcutáneos",
      duration: "10-15 min",
      price: "Desde S/. 30",
    },
    {
      name: "Inyección Endovenosa",
      description: "Administración de medicamentos por vía intravenosa",
      duration: "15-30 min",
      price: "Desde S/. 50",
    },
  ],
  care: [
    {
      name: "Curación de Heridas",
      description: "Limpieza, desinfección y vendaje de heridas",
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
      name: "Colocación de Sonda",
      description: "Sonda vesical o nasogástrica según indicación médica",
      duration: "30-45 min",
      price: "Desde S/. 80",
    },
  ],
  elderly: [
    {
      name: "Cuidado Integral",
      description: "Aseo personal, alimentación y acompañamiento",
      duration: "2-4 horas",
      price: "Desde S/. 120",
    },
    {
      name: "Acompañamiento Hospitalario",
      description: "Cuidado y supervisión durante hospitalización",
      duration: "12 horas",
      price: "Desde S/. 250",
    },
    {
      name: "Terapia Física Básica",
      description: "Ejercicios de movilidad y rehabilitación",
      duration: "45-60 min",
      price: "Desde S/. 80",
    },
  ],
};
