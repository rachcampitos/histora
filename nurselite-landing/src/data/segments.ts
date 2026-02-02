import { UserRound, Stethoscope, Baby } from "lucide-react";
import { Segment } from "@/types";

export const segments: Segment[] = [
  {
    id: "elderly",
    icon: UserRound,
    title: "Cuidadores de Adultos Mayores",
    description:
      "Cuida a tus padres sin sacrificar tu trabajo. Enfermeras especializadas en geriatría que brindan atención integral, control de signos vitales y compañía.",
    services: [
      "Control de signos vitales",
      "Administración de medicamentos",
      "Aseo y cuidado personal",
      "Acompañamiento y compañía",
    ],
    cta: "Ver enfermeras",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=elderly",
  },
  {
    id: "postop",
    icon: Stethoscope,
    title: "Recuperación Post-Operatoria",
    description:
      "Recupérate en la comodidad de tu hogar con atención profesional. Curaciones, retiro de puntos y control post-quirúrgico sin el riesgo de infecciones hospitalarias.",
    services: [
      "Curación de heridas",
      "Retiro de puntos",
      "Control post-quirúrgico",
      "Inyecciones y medicamentos",
    ],
    cta: "Agendar cuidado",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=postop",
  },
  {
    id: "newmom",
    icon: Baby,
    title: "Nuevas Mamás",
    description:
      "Apoyo profesional en tus primeras semanas. Enfermeras especializadas en neonatología y lactancia materna para que te sientas acompañada y segura.",
    services: [
      "Apoyo en lactancia materna",
      "Cuidados del recién nacido",
      "Control de la mamá",
      "Orientación y acompañamiento",
    ],
    cta: "Ver especialistas",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=newmom",
  },
];
