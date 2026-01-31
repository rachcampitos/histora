import { UserRound, Stethoscope, Baby } from "lucide-react";
import { Segment } from "@/types";

export const segments: Segment[] = [
  {
    id: "elderly",
    icon: UserRound,
    title: "Cuidadores de Adultos Mayores",
    description:
      "Cuida a tus padres sin sacrificar tu trabajo. Enfermeras especializadas en geriatria que brindan atencion integral, control de signos vitales y companía.",
    services: [
      "Control de signos vitales",
      "Administracion de medicamentos",
      "Aseo y cuidado personal",
      "Acompanamiento y compania",
    ],
    cta: "Ver enfermeras",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=elderly",
  },
  {
    id: "postop",
    icon: Stethoscope,
    title: "Recuperacion Post-Operatoria",
    description:
      "Recuperate en la comodidad de tu hogar con atencion profesional. Curaciones, retiro de puntos y control post-quirurgico sin el riesgo de infecciones hospitalarias.",
    services: [
      "Curacion de heridas",
      "Retiro de puntos",
      "Control post-quirurgico",
      "Inyecciones y medicamentos",
    ],
    cta: "Agendar cuidado",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=postop",
  },
  {
    id: "newmom",
    icon: Baby,
    title: "Nuevas Mamas",
    description:
      "Apoyo profesional en tus primeras semanas. Enfermeras especializadas en neonatologia y lactancia materna para que te sientas acompanada y segura.",
    services: [
      "Apoyo en lactancia materna",
      "Cuidados del recien nacido",
      "Control de la mama",
      "Orientacion y acompanamiento",
    ],
    cta: "Ver especialistas",
    ctaLink: "https://app.nurse-lite.com/auth/register?type=patient&segment=newmom",
  },
];
