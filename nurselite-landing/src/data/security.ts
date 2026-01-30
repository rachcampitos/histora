import { ShieldCheck, Fingerprint, MapPin, Bell, Star, FileCheck } from "lucide-react";
import { SecurityFeature } from "@/types";

export const securityFeatures: SecurityFeature[] = [
  {
    icon: ShieldCheck,
    title: "Triple Verificacion",
    description: "CEP + RENIEC + Biometria con IA para garantizar identidad",
  },
  {
    icon: Fingerprint,
    title: "Biometria Avanzada",
    description: "Verificacion facial con inteligencia artificial",
  },
  {
    icon: MapPin,
    title: "Seguimiento GPS",
    description: "Ubicacion en tiempo real durante el servicio",
  },
  {
    icon: Bell,
    title: "Boton de Panico",
    description: "Alerta inmediata integrada en la app",
  },
  {
    icon: Star,
    title: "Calificaciones Bidireccionales",
    description: "Sistema de resenas para pacientes y enfermeras",
  },
  {
    icon: FileCheck,
    title: "Historial Digital",
    description: "Registro completo de todos los servicios",
  },
];
