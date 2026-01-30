import { ShieldCheck, IdCard, MapPin, Bell, Star, FileCheck } from "lucide-react";
import { SecurityFeature } from "@/types";

export const securityFeatures: SecurityFeature[] = [
  {
    icon: ShieldCheck,
    title: "Verificacion CEP Oficial",
    description:
      "Validamos cada enfermera directamente con el Colegio de Enfermeros del Peru. Solo enfermeras con estado HABIL pueden atender.",
  },
  {
    icon: IdCard,
    title: "Verificacion de Identidad",
    description:
      "DNI verificado con RENIEC mas selfie de confirmacion. Ambas partes (enfermera y paciente) son verificadas.",
  },
  {
    icon: MapPin,
    title: "Seguimiento GPS",
    description:
      "Ubicacion en tiempo real durante el servicio. Comparte el link de rastreo con familiares para tu tranquilidad.",
  },
  {
    icon: Bell,
    title: "Boton de Emergencia",
    description:
      "Ante cualquier situacion de riesgo, alerta inmediata a nuestro equipo de soporte con ubicacion GPS exacta.",
  },
  {
    icon: Star,
    title: "Calificaciones Verificadas",
    description:
      "Sistema bidireccional donde pacientes y enfermeras se califican mutuamente despues de cada servicio.",
  },
  {
    icon: FileCheck,
    title: "Historial Completo",
    description:
      "Registro digital de todos los servicios, calificaciones e incidentes. Transparencia total para tu seguridad.",
  },
];
