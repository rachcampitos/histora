import { FAQItem } from "@/types";

export const faqs: FAQItem[] = [
  {
    question: "¿Cuanto cuesta el servicio?",
    answer:
      "Los precios varian segun el tipo de servicio. Por ejemplo, una inyeccion intramuscular cuesta desde S/. 30, control de signos vitales desde S/. 35, y curacion de heridas desde S/. 60. Cada enfermera establece sus propios precios, los cuales puedes ver en su perfil antes de solicitar el servicio. No hay costos ocultos ni comisiones adicionales.",
  },
  {
    question: "¿Como se que las enfermeras estan realmente verificadas?",
    answer:
      "Todas las enfermeras en NurseLite pasan por un riguroso proceso de triple verificacion: validamos su colegiatura directamente con el Colegio de Enfermeros del Peru (CEP), verificamos su identidad con RENIEC, y usamos biometria con inteligencia artificial para confirmar que la persona es quien dice ser. Solo las enfermeras que pasan esta verificacion obtienen el badge de 'CEP Verificado'.",
  },
  {
    question: "¿En que zonas de Lima estan disponibles?",
    answer:
      "Actualmente tenemos cobertura en los principales distritos de Lima Metropolitana: San Isidro, Miraflores, Surco, La Molina, San Borja, Lince, Jesus Maria, Magdalena, Pueblo Libre, entre otros. Estamos expandiendo constantemente nuestra red de enfermeras. Al buscar, te mostramos las enfermeras disponibles cerca de tu ubicacion.",
  },
  {
    question: "¿Puedo solicitar servicio de emergencia?",
    answer:
      "NurseLite esta disenado para servicios programados y no es un servicio de emergencias medicas. Si tienes una emergencia de salud, te recomendamos llamar al 106 (SAMU) o ir directamente a urgencias. Para servicios que pueden esperar algunas horas o dias, NurseLite es la opcion ideal.",
  },
  {
    question: "¿Como funciona el pago?",
    answer:
      "El pago se coordina directamente con la enfermera al finalizar el servicio. Puedes pagar en efectivo, Yape, Plin o transferencia bancaria segun lo acordado. Estamos trabajando en integrar pagos seguros dentro de la app para mayor comodidad y proteccion.",
  },
  {
    question: "¿Que pasa si no estoy satisfecho con el servicio?",
    answer:
      "Tu satisfaccion es nuestra prioridad. Si tienes algun inconveniente con el servicio, contactanos dentro de las primeras 24 horas y resolveremos el problema. Investigamos cada caso y tomamos las medidas necesarias. Las enfermeras con malas calificaciones consistentes son retiradas de la plataforma.",
  },
  {
    question: "Soy enfermera, ¿como puedo unirme a NurseLite?",
    answer:
      "Si eres enfermera colegiada con estado HABIL en el CEP, puedes registrarte en nuestra app. El proceso incluye: crear tu cuenta, ingresar tu numero CEP para verificacion automatica, completar tu perfil con servicios y precios, y empezar a recibir solicitudes. Es gratis registrarse y tu controlas tu disponibilidad.",
  },
  {
    question: "¿NurseLite tiene algun costo para las enfermeras?",
    answer:
      "El registro y la verificacion CEP son completamente gratis. Para recibir solicitudes de pacientes, NurseLite ofrece planes de suscripcion mensual accesibles. A diferencia de otras plataformas que cobran comision por cada servicio (15-30%), con NurseLite pagas una cuota fija y el 100% de tus ingresos son para ti. Esto significa que mientras mas servicios realices, mas rentable es para ti. Puedes cancelar en cualquier momento sin penalidad.",
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
