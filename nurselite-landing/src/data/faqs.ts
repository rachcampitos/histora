import { FAQItem } from "@/types";

export const faqs: FAQItem[] = [
  {
    question: "¿Cuánto cuesta el servicio?",
    answer:
      "Los precios varían según el tipo de servicio y la experiencia de cada profesional. La mayoría de servicios básicos como inyecciones o control de signos vitales cuestan menos de S/. 50. Cada enfermera establece sus propios precios, los cuales puedes ver en su perfil antes de solicitar el servicio. No hay costos ocultos ni comisiones adicionales.",
  },
  {
    question: "¿Cómo sé que las enfermeras están realmente verificadas?",
    answer:
      "Todas las enfermeras en NurseLite pasan por un riguroso proceso de triple verificación: validamos su colegiatura directamente con el Colegio de Enfermeros del Perú (CEP), verificamos su identidad con RENIEC, y usamos biometría con inteligencia artificial para confirmar que la persona es quien dice ser. Solo las enfermeras que pasan esta verificación obtienen el badge de 'CEP Verificado'.",
  },
  {
    question: "¿En qué zonas de Lima están disponibles?",
    answer:
      "Actualmente tenemos cobertura en los principales distritos de Lima Metropolitana: San Isidro, Miraflores, Surco, La Molina, San Borja, Lince, Jesús María, Magdalena, Pueblo Libre, entre otros. Estamos expandiendo constantemente nuestra red de enfermeras. Al buscar, te mostramos las enfermeras disponibles cerca de tu ubicación.",
  },
  {
    question: "¿Puedo solicitar servicio de emergencia?",
    answer:
      "NurseLite está diseñado para servicios programados y no es un servicio de emergencias médicas. Si tienes una emergencia de salud, te recomendamos llamar al 106 (SAMU) o ir directamente a urgencias. Para servicios que pueden esperar algunas horas o días, NurseLite es la opción ideal.",
  },
  {
    question: "¿Cómo funciona el pago?",
    answer:
      "Todos los pagos se procesan de forma segura dentro de la app a través de Culqi, la pasarela de pagos líder en Perú. Puedes pagar con tarjeta Visa o Mastercard, o directamente con Yape. El cobro se realiza al confirmar el servicio y tu información financiera está protegida con encriptación SSL en todo momento.",
  },
  {
    question: "¿Qué pasa si no estoy satisfecho con el servicio?",
    answer:
      "Tu satisfacción es nuestra prioridad. Si tienes algún inconveniente con el servicio, contáctanos dentro de las primeras 24 horas y resolveremos el problema. Investigamos cada caso y tomamos las medidas necesarias. Las enfermeras con malas calificaciones consistentes son retiradas de la plataforma.",
  },
  {
    question: "Soy enfermera, ¿cómo puedo unirme a NurseLite?",
    answer:
      "Si eres enfermera colegiada con estado HÁBIL en el CEP, puedes registrarte en nuestra app. El proceso incluye: crear tu cuenta, ingresar tu número CEP para verificación automática, completar tu perfil con servicios y precios, y empezar a recibir solicitudes. Es gratis registrarse y tú controlas tu disponibilidad.",
  },
  {
    question: "¿NurseLite tiene algún costo para las enfermeras?",
    answer:
      "El registro y la verificación CEP son completamente gratis. Para recibir solicitudes de pacientes, NurseLite ofrece planes de suscripción mensual accesibles. Con nuestra suscripción mensual fija, el 100% de tus ingresos son para ti - mientras más servicios realices, más rentable es para ti. Puedes cancelar en cualquier momento sin penalidad.",
  },
];

// FAQ Schema for SEO
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};
