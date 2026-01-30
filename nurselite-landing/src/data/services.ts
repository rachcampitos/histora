import { Stethoscope, Syringe, Heart, UserRound } from "lucide-react";
import { ServiceCategory, ServicesByCategory } from "@/types";

export const serviceCategories: ServiceCategory[] = [
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

export const services: ServicesByCategory = {
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
      description: "Aseo personal, alimentacion y acompanamiento",
      duration: "2-4 horas",
      price: "Desde S/. 120",
    },
    {
      name: "Acompanamiento Hospitalario",
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
