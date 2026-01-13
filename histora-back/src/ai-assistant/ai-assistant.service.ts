import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
  intent?: string;
  confidence?: number;
  action?: {
    type: 'navigate' | 'call' | 'open_modal' | 'none';
    target?: string;
    params?: Record<string, any>;
  };
}

export interface ConversationContext {
  userId: string;
  userRole: 'patient' | 'nurse' | 'admin';
  language: string;
  serviceContext?: {
    serviceId?: string;
    patientName?: string;
    nurseName?: string;
    serviceType?: string;
  };
}

// Intent definitions for smart fallback
interface IntentPattern {
  keywords: string[];
  patterns: RegExp[];
  priority: number;
}

interface IntentResponse {
  templates: string[];
  suggestions: string[];
  action?: AIResponse['action'];
  followUp?: string[];
}

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private client: Anthropic | null = null;
  private conversationHistory: Map<string, AIMessage[]> = new Map();
  private lastIntent: Map<string, string> = new Map();

  // Comprehensive intent patterns
  private readonly intentPatterns: Record<string, IntentPattern> = {
    // Greetings
    greeting: {
      keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi', 'hello', 'qué tal', 'cómo estás'],
      patterns: [/^hola\b/i, /^hey\b/i, /^buenas?\b/i, /^saludos/i],
      priority: 1,
    },

    // Scheduling
    schedule_appointment: {
      keywords: ['agendar', 'cita', 'reservar', 'programar', 'solicitar servicio', 'quiero una cita', 'necesito enfermera'],
      patterns: [/quiero (una? )?cita/i, /agendar (una? )?(cita|servicio|visita)/i, /necesito (una? )?(enfermera|servicio)/i, /reservar/i],
      priority: 10,
    },

    // View appointments
    view_appointments: {
      keywords: ['mis citas', 'próximas citas', 'citas programadas', 'ver citas', 'cuándo es mi cita'],
      patterns: [/mis citas/i, /próximas? citas?/i, /citas? programadas?/i, /cuándo (es|tengo)/i, /ver (mis )?citas/i],
      priority: 9,
    },

    // Cancel/Reschedule
    cancel_reschedule: {
      keywords: ['cancelar', 'cambiar cita', 'reprogramar', 'mover cita', 'no puedo ir'],
      patterns: [/cancelar (mi )?(cita|servicio)/i, /cambiar (mi )?(cita|hora)/i, /reprogramar/i, /mover (la )?cita/i],
      priority: 9,
    },

    // Symptoms & Health
    symptoms: {
      keywords: ['síntomas', 'me duele', 'me siento mal', 'enfermo', 'dolor', 'fiebre', 'malestar', 'náuseas', 'mareo'],
      patterns: [/me (duele|siento|encuentro)/i, /tengo (dolor|fiebre|malestar|náuseas)/i, /síntomas?/i, /no me siento bien/i],
      priority: 8,
    },

    // Emergency
    emergency: {
      keywords: ['emergencia', 'urgente', 'grave', 'urgencia', '911', 'ambulancia', 'hospital', 'desmayo', 'no respira'],
      patterns: [/emergencia/i, /es urgente/i, /muy grave/i, /no respira/i, /desmay[oó]/i, /inconsciente/i, /mucha sangre/i],
      priority: 100,
    },

    // Services info
    services_info: {
      keywords: ['servicios', 'qué ofrecen', 'qué hacen', 'tipos de servicio', 'catálogo'],
      patterns: [/qué (servicios|ofrecen|hacen)/i, /tipos? de servicios?/i, /catálogo/i, /servicios disponibles/i],
      priority: 6,
    },

    // Pricing
    pricing: {
      keywords: ['precio', 'costo', 'cuánto cuesta', 'tarifas', 'cobran', 'pagar', 'factura'],
      patterns: [/cuánto (cuesta|cobran|vale)/i, /precio(s)?/i, /costo(s)?/i, /tarifa(s)?/i, /forma(s)? de pago/i],
      priority: 7,
    },

    // Payment
    payment: {
      keywords: ['pagar', 'pago', 'factura', 'recibo', 'historial de pagos', 'método de pago'],
      patterns: [/quiero pagar/i, /(mi )?factura/i, /historial de pagos/i, /método(s)? de pago/i, /cómo pago/i],
      priority: 7,
    },

    // Profile
    profile: {
      keywords: ['mi perfil', 'mis datos', 'cambiar datos', 'actualizar perfil', 'mi cuenta'],
      patterns: [/mi (perfil|cuenta|información)/i, /(cambiar|actualizar|editar) (mis )?datos/i],
      priority: 5,
    },

    // History
    history: {
      keywords: ['historial', 'consultas anteriores', 'servicios anteriores', 'historial médico', 'mis registros'],
      patterns: [/historial/i, /(consultas?|servicios?) anteriores?/i, /mis registros/i],
      priority: 6,
    },

    // Help
    help: {
      keywords: ['ayuda', 'no sé', 'cómo funciona', 'cómo uso', 'instrucciones', 'tutorial'],
      patterns: [/ayuda/i, /no (sé|entiendo)/i, /cómo (funciona|uso|hago)/i, /qué puedo hacer/i],
      priority: 3,
    },

    // Contact/Support
    contact: {
      keywords: ['contacto', 'teléfono', 'llamar', 'soporte', 'hablar con alguien', 'atención al cliente'],
      patterns: [/contacto/i, /teléfono/i, /hablar con (alguien|una persona)/i, /atención al cliente/i, /soporte/i],
      priority: 5,
    },

    // Nurse specific - availability
    nurse_availability: {
      keywords: ['mi horario', 'configurar disponibilidad', 'mis horas', 'disponibilidad'],
      patterns: [/mi (horario|disponibilidad)/i, /configurar (mi )?(horario|disponibilidad)/i],
      priority: 8,
    },

    // Nurse specific - earnings
    nurse_earnings: {
      keywords: ['mis ganancias', 'cuánto gané', 'mis ingresos', 'pagos recibidos'],
      patterns: [/mis (ganancias|ingresos)/i, /cuánto (gané|he ganado)/i, /pagos recibidos/i],
      priority: 8,
    },

    // Nurse specific - patients
    nurse_patients: {
      keywords: ['mis pacientes', 'lista de pacientes', 'pacientes asignados'],
      patterns: [/mis pacientes/i, /lista de pacientes/i, /pacientes asignados/i],
      priority: 8,
    },

    // Thanks
    thanks: {
      keywords: ['gracias', 'muchas gracias', 'te agradezco', 'thank you', 'thanks'],
      patterns: [/gracias/i, /te agradezco/i, /thanks?( you)?/i],
      priority: 2,
    },

    // Goodbye
    goodbye: {
      keywords: ['adiós', 'chao', 'hasta luego', 'bye', 'nos vemos'],
      patterns: [/adiós/i, /chao/i, /hasta (luego|pronto)/i, /bye/i, /nos vemos/i],
      priority: 2,
    },

    // Affirmative
    affirmative: {
      keywords: ['sí', 'si', 'claro', 'ok', 'dale', 'está bien', 'de acuerdo', 'correcto'],
      patterns: [/^sí?$/i, /^ok$/i, /^claro$/i, /^dale$/i, /de acuerdo/i, /está bien/i],
      priority: 1,
    },

    // Negative
    negative: {
      keywords: ['no', 'nope', 'no gracias', 'mejor no', 'en otro momento'],
      patterns: [/^no$/i, /no gracias/i, /mejor no/i, /en otro momento/i],
      priority: 1,
    },
  };

  // Response templates for each intent
  private readonly patientResponses: Record<string, IntentResponse> = {
    greeting: {
      templates: [
        '¡Hola! 👋 Soy Hana, tu asistente de salud. ¿En qué puedo ayudarte hoy?',
        '¡Buenos días! Soy Hana, estoy aquí para ayudarte. ¿Qué necesitas?',
        '¡Hola! Me alegra saludarte. ¿Cómo puedo asistirte hoy?',
      ],
      suggestions: ['Agendar cita', 'Ver mis citas', 'Tengo síntomas', 'Ver servicios'],
    },

    schedule_appointment: {
      templates: [
        '¡Perfecto! Te ayudo a agendar una cita. Puedes ver los servicios disponibles y elegir el que necesites.',
        'Con gusto te ayudo a agendar. ¿Qué tipo de servicio necesitas? Tenemos control de signos vitales, curaciones, inyectables y más.',
        'Vamos a programar tu cita. Te llevaré a la sección de servicios para que elijas el que mejor se adapte a tus necesidades.',
      ],
      suggestions: ['Ver servicios', 'Control de signos vitales', 'Curaciones', 'Inyectables'],
      action: { type: 'navigate', target: '/patient/request' },
    },

    view_appointments: {
      templates: [
        'Aquí puedes ver todas tus citas programadas y el estado de cada una.',
        'Te muestro tus próximas citas. También puedes ver el historial de servicios anteriores.',
        'Vamos a revisar tus citas. Desde aquí puedes ver los detalles y contactar a tu profesional asignado.',
      ],
      suggestions: ['Ver historial', 'Agendar nueva cita', 'Contactar enfermera'],
      action: { type: 'navigate', target: '/patient/history' },
    },

    cancel_reschedule: {
      templates: [
        'Entiendo que necesitas cambiar o cancelar tu cita. Ve a "Mis Citas" y selecciona la que deseas modificar.',
        'Puedo ayudarte con eso. Desde la sección de citas puedes cancelar o solicitar un cambio de horario.',
        'Sin problema. Recuerda que si cancelas con menos de 2 horas de anticipación puede aplicar un cargo.',
      ],
      suggestions: ['Ver mis citas', 'Agendar nueva cita', 'Contactar soporte'],
      action: { type: 'navigate', target: '/patient/history' },
    },

    symptoms: {
      templates: [
        'Lamento que no te sientas bien. 💙 Cuéntame más sobre tus síntomas para orientarte mejor. Recuerda que no soy médico, pero puedo ayudarte a decidir qué tipo de atención necesitas.',
        'Entiendo que tienes algunos síntomas. ¿Podrías describirlos con más detalle? Por ejemplo: ¿desde cuándo los tienes? ¿qué tan intensos son?',
        'Quiero ayudarte. Describe tus síntomas y te orientaré sobre qué servicio podría ser más adecuado para ti.',
      ],
      suggestions: ['Solicitar evaluación', 'Es urgente', 'Ver servicios disponibles'],
      followUp: ['¿Desde cuándo tienes estos síntomas?', '¿Tienes alguna condición médica previa?'],
    },

    emergency: {
      templates: [
        '🚨 Si es una emergencia médica, por favor llama al 911 o SAMU inmediatamente. Tu seguridad es lo primero.',
        '⚠️ Ante una emergencia, lo más importante es llamar a servicios de emergencia (911/SAMU). ¿Necesitas que te muestre los números de emergencia?',
        '🚨 IMPORTANTE: Si hay riesgo de vida, llama al 911 ahora. Nuestros servicios son para atención domiciliaria programada, no emergencias.',
      ],
      suggestions: ['Llamar 911', 'Ver contactos de emergencia', 'No es emergencia, solo necesito ayuda'],
      action: { type: 'call', target: '911' },
    },

    services_info: {
      templates: [
        'Ofrecemos varios servicios de enfermería a domicilio:\n\n• Control de signos vitales\n• Curaciones y cambio de vendajes\n• Aplicación de inyectables\n• Toma de muestras\n• Cuidado de adulto mayor\n• Acompañamiento hospitalario\n\n¿Cuál te interesa conocer más?',
        'Nuestros servicios incluyen control de signos vitales, curaciones, inyectables, toma de muestras, y cuidado especializado. Todos realizados por enfermeras certificadas en tu domicilio.',
        'Tenemos enfermeras profesionales que pueden atenderte en casa. Desde controles básicos hasta cuidados especializados. ¿Quieres ver el catálogo completo?',
      ],
      suggestions: ['Ver catálogo', 'Precios', 'Agendar cita'],
      action: { type: 'navigate', target: '/patient/request' },
    },

    pricing: {
      templates: [
        'Los precios varían según el servicio:\n\n• Control de signos vitales: desde S/. 35\n• Curaciones simples: desde S/. 45\n• Inyectables: desde S/. 30\n• Evaluación general: desde S/. 50\n\nEstos son precios base, pueden variar según la zona y horario.',
        'Nuestras tarifas son competitivas y transparentes. El precio final depende del servicio, ubicación y horario. ¿Quieres una cotización específica?',
        'Puedes ver los precios de cada servicio al momento de agendar. También aceptamos varios métodos de pago. ¿Te ayudo a cotizar un servicio?',
      ],
      suggestions: ['Ver servicios con precios', 'Métodos de pago', 'Agendar cita'],
    },

    payment: {
      templates: [
        'Puedes pagar con:\n• Tarjeta de crédito/débito\n• Yape/Plin\n• Transferencia bancaria\n• Efectivo (se paga a la enfermera)\n\nTodos los pagos son seguros y recibirás tu comprobante por email.',
        'El pago se realiza después del servicio. Aceptamos múltiples métodos de pago para tu comodidad.',
        'Tu historial de pagos y facturas están disponibles en la sección de pagos de tu perfil.',
      ],
      suggestions: ['Ver historial de pagos', 'Solicitar factura', 'Ver servicios'],
      action: { type: 'navigate', target: '/patient/settings' },
    },

    profile: {
      templates: [
        'Desde tu perfil puedes actualizar tu información personal, direcciones de servicio, y preferencias.',
        'Te llevo a tu perfil donde puedes editar tus datos, agregar direcciones y configurar notificaciones.',
        'En la configuración de tu cuenta puedes actualizar todos tus datos. ¿Qué deseas modificar?',
      ],
      suggestions: ['Actualizar datos', 'Agregar dirección', 'Cambiar contraseña'],
      action: { type: 'navigate', target: '/patient/settings' },
    },

    history: {
      templates: [
        'En tu historial puedes ver todos los servicios que has recibido, con fechas, profesionales y detalles de cada atención.',
        'Tu historial de servicios está disponible. Ahí encontrarás notas de las enfermeras y seguimiento de tu salud.',
        'Vamos a ver tu historial. Puedes revisar servicios pasados y descargar reportes si lo necesitas.',
      ],
      suggestions: ['Ver citas pendientes', 'Descargar historial', 'Agendar nueva cita'],
      action: { type: 'navigate', target: '/patient/history' },
    },

    help: {
      templates: [
        '¡Con gusto te ayudo! Puedo asistirte con:\n\n• Agendar citas con enfermeras\n• Ver tus próximas citas\n• Información sobre servicios\n• Responder preguntas sobre la app\n\n¿Qué necesitas?',
        'Estoy aquí para ayudarte. Puedes preguntarme sobre servicios, citas, pagos, o cómo usar la aplicación.',
        'Hana puede ayudarte con casi todo en la app. Simplemente dime qué necesitas hacer y te guío paso a paso.',
      ],
      suggestions: ['Agendar cita', 'Ver servicios', 'Cómo funciona', 'Contactar soporte'],
    },

    contact: {
      templates: [
        'Puedes contactarnos por:\n\n📞 Teléfono: 01-XXX-XXXX\n📱 WhatsApp: +51 XXX XXX XXX\n📧 Email: soporte@historacare.com\n\nHorario de atención: Lun-Sáb 7am-9pm',
        'Si prefieres hablar con una persona, nuestro equipo de soporte está disponible de lunes a sábado.',
        'Te entiendo, a veces es mejor hablar con alguien. Puedes llamar o escribir por WhatsApp a nuestro equipo.',
      ],
      suggestions: ['Llamar ahora', 'Enviar WhatsApp', 'Enviar email'],
    },

    thanks: {
      templates: [
        '¡De nada! 😊 Estoy aquí para lo que necesites.',
        '¡Con gusto! ¿Hay algo más en lo que pueda ayudarte?',
        'Es un placer ayudarte. No dudes en escribirme si necesitas algo más.',
      ],
      suggestions: ['Agendar cita', 'Ver servicios', 'Eso es todo'],
    },

    goodbye: {
      templates: [
        '¡Hasta pronto! 👋 Que te mejores y cuídate mucho.',
        '¡Adiós! Recuerda que estoy aquí cuando me necesites.',
        '¡Cuídate! No dudes en volver si tienes alguna pregunta.',
      ],
      suggestions: [],
    },

    affirmative: {
      templates: [
        '¡Perfecto! ¿En qué más puedo ayudarte?',
        '¡Genial! ¿Procedemos entonces?',
        'Entendido. ¿Necesitas algo más?',
      ],
      suggestions: ['Agendar cita', 'Ver servicios', 'Eso es todo'],
    },

    negative: {
      templates: [
        'Está bien, no hay problema. ¿Hay algo más en lo que pueda ayudarte?',
        'Entiendo. Si cambias de opinión, aquí estaré.',
        'Sin problema. ¿Necesitas ayuda con algo diferente?',
      ],
      suggestions: ['Ver servicios', 'Ayuda', 'Eso es todo'],
    },

    general: {
      templates: [
        'No estoy segura de haber entendido bien. ¿Podrías decírmelo de otra forma?',
        'Hmm, no encontré información específica sobre eso. ¿Puedo ayudarte con algo de esto?',
        'Disculpa, no entendí completamente. ¿Te ayudo con agendar citas, ver servicios, o tienes otra consulta?',
      ],
      suggestions: ['Agendar cita', 'Ver servicios', 'Ayuda', 'Hablar con soporte'],
    },
  };

  // Nurse-specific responses
  private readonly nurseResponses: Record<string, IntentResponse> = {
    greeting: {
      templates: [
        '¡Hola! 👋 Soy Hana, tu asistente. ¿En qué puedo ayudarte hoy?',
        '¡Buenos días! ¿Lista para revisar tu agenda o necesitas algo específico?',
      ],
      suggestions: ['Ver mis solicitudes', 'Mi horario', 'Mis ganancias'],
    },

    nurse_availability: {
      templates: [
        'Puedes configurar tu disponibilidad desde la sección de perfil. Define tus días y horarios de trabajo.',
        'Tu horario de disponibilidad determina cuándo los pacientes pueden solicitarte. ¿Quieres configurarlo ahora?',
      ],
      suggestions: ['Configurar horario', 'Ver mi agenda', 'Ver solicitudes'],
      action: { type: 'navigate', target: '/nurse/profile' },
    },

    nurse_earnings: {
      templates: [
        'En la sección de ganancias puedes ver tu resumen de ingresos, servicios completados y pagos pendientes.',
        'Tu balance de ganancias está actualizado. Puedes ver el detalle por período y solicitar retiros.',
      ],
      suggestions: ['Ver detalle', 'Solicitar retiro', 'Ver servicios completados'],
      action: { type: 'navigate', target: '/nurse/earnings' },
    },

    nurse_patients: {
      templates: [
        'Tu lista de pacientes incluye todos aquellos que has atendido o tienen citas programadas contigo.',
        'Puedes ver el historial de cada paciente que has atendido y notas de servicios anteriores.',
      ],
      suggestions: ['Ver pacientes activos', 'Historial de servicios', 'Buscar paciente'],
      action: { type: 'navigate', target: '/nurse/patients' },
    },

    view_appointments: {
      templates: [
        'Aquí puedes ver tus solicitudes de servicio pendientes y citas programadas.',
        'Tu agenda muestra los servicios confirmados. Las nuevas solicitudes aparecen en la sección de solicitudes.',
      ],
      suggestions: ['Ver solicitudes nuevas', 'Mi calendario', 'Historial'],
      action: { type: 'navigate', target: '/nurse/requests' },
    },

    emergency: {
      templates: [
        '🚨 Si es una emergencia con un paciente, activa el botón de pánico desde la app de seguimiento. Esto alertará a la central y contactos de emergencia.',
        '⚠️ En caso de emergencia, usa el botón de pánico o llama al 911. La seguridad del paciente y la tuya es prioridad.',
      ],
      suggestions: ['Activar pánico', 'Ver protocolos', 'Llamar central'],
      action: { type: 'navigate', target: '/nurse/safety' },
    },

    help: {
      templates: [
        'Puedo ayudarte con:\n• Ver y gestionar solicitudes\n• Tu agenda y disponibilidad\n• Ganancias y pagos\n• Información de pacientes\n• Protocolos de seguridad\n\n¿Qué necesitas?',
      ],
      suggestions: ['Ver solicitudes', 'Mi perfil', 'Ganancias', 'Soporte'],
    },

    general: {
      templates: [
        '¿En qué puedo ayudarte? Puedo asistirte con solicitudes, agenda, ganancias o información de pacientes.',
      ],
      suggestions: ['Ver solicitudes', 'Mi agenda', 'Ganancias', 'Ayuda'],
    },
  };

  // System prompts for different contexts (used with Claude API)
  private readonly systemPrompts = {
    patient: `Eres "Hana", un asistente de salud virtual amigable y profesional de Histora Care.
Tu rol es ayudar a pacientes con:
- Información sobre servicios de enfermería a domicilio
- Pre-evaluación de síntomas (sin diagnosticar)
- Recordatorios de medicación y cuidados
- Preguntas frecuentes sobre la plataforma
- Comunicación con el equipo médico

Reglas importantes:
1. NUNCA diagnostiques enfermedades - siempre recomienda consultar al profesional
2. Sé empático y cálido, muchos pacientes son adultos mayores
3. Usa lenguaje simple y claro
4. Si detectas una emergencia médica, recomienda llamar al 911/SAMU inmediatamente
5. Responde en español a menos que el usuario escriba en otro idioma
6. Mantén respuestas concisas pero completas`,

    nurse: `Eres "Hana", un asistente inteligente de Histora Care para profesionales de enfermería.
Tu rol es ayudar a enfermeras con:
- Información sobre pacientes y sus historiales
- Recordatorios de visitas y procedimientos
- Protocolos de seguridad y emergencia
- Documentación y reportes
- Preguntas sobre la plataforma

Reglas importantes:
1. Sé profesional y directo
2. Prioriza información de seguridad cuando sea relevante
3. Ayuda con eficiencia - las enfermeras tienen tiempo limitado
4. Responde en español a menos que el usuario escriba en otro idioma
5. Si hay duda sobre información médica, recomienda verificar con el sistema`,

    admin: `Eres "Hana", un asistente administrativo de Histora Care.
Tu rol es ayudar con:
- Reportes y estadísticas
- Gestión de usuarios y servicios
- Configuración de la plataforma
- Resolución de incidencias
- Preguntas operativas

Sé profesional, eficiente y preciso.`,
  };

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (apiKey && apiKey !== 'tu-api-key-aqui') {
      this.client = new Anthropic({ apiKey });
      this.logger.log('AI Assistant initialized with Claude API');
    } else {
      this.logger.log('AI Assistant running in fallback mode (no API key configured)');
    }
  }

  async chat(
    userId: string,
    message: string,
    context: ConversationContext,
  ): Promise<AIResponse> {
    const historyKey = `${userId}:${context.userRole}`;
    let history = this.conversationHistory.get(historyKey) || [];

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Limit history to last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
    }

    try {
      // Always try fallback first for faster response, unless message is complex
      const isComplexMessage = message.length > 100 || message.includes('?') && message.split(' ').length > 15;

      if (!this.client || !isComplexMessage) {
        const fallbackResponse = this.getSmartFallbackResponse(message, context, userId);

        // Add to history
        history.push({ role: 'assistant', content: fallbackResponse.text });
        this.conversationHistory.set(historyKey, history);

        return fallbackResponse;
      }

      // Use Claude for complex messages
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });
      this.conversationHistory.set(historyKey, history);

      // Analyze intent for suggestions
      const intent = this.detectIntent(message);
      const suggestions = this.generateSuggestions(intent, context);

      return {
        text: assistantMessage,
        suggestions,
        intent: intent.name,
        confidence: 0.9,
      };
    } catch (error) {
      this.logger.error('AI Assistant error:', error);
      const fallbackResponse = this.getSmartFallbackResponse(message, context, userId);

      history.push({ role: 'assistant', content: fallbackResponse.text });
      this.conversationHistory.set(historyKey, history);

      return fallbackResponse;
    }
  }

  async quickResponse(
    message: string,
    context: ConversationContext,
  ): Promise<AIResponse> {
    // Quick responses always use fallback for speed
    return this.getSmartFallbackResponse(message, context, 'quick');
  }

  async preTriage(symptoms: string, patientInfo: {
    age?: number;
    gender?: string;
    conditions?: string[];
  }): Promise<{
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    recommendation: string;
    suggestedServices: string[];
  }> {
    // Smart rule-based triage without API
    const lowercaseSymptoms = symptoms.toLowerCase();

    // Emergency keywords
    const emergencyKeywords = ['no respira', 'inconsciente', 'desmayo', 'mucha sangre', 'convulsión', 'infarto', 'derrame', 'no reacciona'];
    const highKeywords = ['fiebre alta', 'dolor intenso', 'vómito con sangre', 'dificultad para respirar', 'dolor de pecho', 'presión alta'];
    const mediumKeywords = ['fiebre', 'dolor', 'mareo', 'náuseas', 'debilidad', 'infección', 'herida'];

    // Check for emergency
    if (emergencyKeywords.some(k => lowercaseSymptoms.includes(k))) {
      return {
        urgency: 'emergency',
        recommendation: '🚨 Estos síntomas requieren atención de emergencia. Por favor llama al 911 o SAMU inmediatamente.',
        suggestedServices: ['emergencia_911'],
      };
    }

    // Check for high urgency
    if (highKeywords.some(k => lowercaseSymptoms.includes(k))) {
      return {
        urgency: 'high',
        recommendation: 'Estos síntomas requieren atención pronto. Te recomendamos solicitar una evaluación profesional hoy.',
        suggestedServices: ['evaluacion_urgente', 'control_signos_vitales'],
      };
    }

    // Check for medium urgency
    if (mediumKeywords.some(k => lowercaseSymptoms.includes(k))) {
      return {
        urgency: 'medium',
        recommendation: 'Sería bueno que un profesional te evalúe. Puedes agendar una visita en las próximas 24-48 horas.',
        suggestedServices: ['evaluacion_general', 'control_signos_vitales'],
      };
    }

    // Low urgency - general care
    return {
      urgency: 'low',
      recommendation: 'Tus síntomas parecen ser leves, pero si persisten o empeoran, agenda una evaluación.',
      suggestedServices: ['evaluacion_general', 'control_signos_vitales'],
    };
  }

  clearConversation(userId: string, userRole: string): void {
    const historyKey = `${userId}:${userRole}`;
    this.conversationHistory.delete(historyKey);
    this.lastIntent.delete(historyKey);
  }

  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = this.systemPrompts[context.userRole] || this.systemPrompts.patient;

    if (context.serviceContext) {
      prompt += `\n\nContexto actual del servicio:`;
      if (context.serviceContext.serviceId) {
        prompt += `\n- ID del servicio: ${context.serviceContext.serviceId}`;
      }
      if (context.serviceContext.patientName) {
        prompt += `\n- Paciente: ${context.serviceContext.patientName}`;
      }
      if (context.serviceContext.nurseName) {
        prompt += `\n- Enfermera: ${context.serviceContext.nurseName}`;
      }
      if (context.serviceContext.serviceType) {
        prompt += `\n- Tipo de servicio: ${context.serviceContext.serviceType}`;
      }
    }

    return prompt;
  }

  private detectIntent(message: string): { name: string; confidence: number } {
    const normalizedMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let bestMatch = { name: 'general', confidence: 0, priority: 0 };

    for (const [intentName, pattern] of Object.entries(this.intentPatterns)) {
      let score = 0;

      // Check exact patterns first (highest confidence)
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedMessage)) {
          score = Math.max(score, 0.95);
          break;
        }
      }

      // Check keywords
      if (score < 0.95) {
        const keywordMatches = pattern.keywords.filter(keyword =>
          normalizedMessage.includes(keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        );

        if (keywordMatches.length > 0) {
          // Score based on number of keyword matches and message relevance
          const keywordScore = Math.min(0.5 + (keywordMatches.length * 0.15), 0.85);
          score = Math.max(score, keywordScore);
        }
      }

      // Update best match considering priority
      if (score > 0 && (score > bestMatch.confidence || (score === bestMatch.confidence && pattern.priority > bestMatch.priority))) {
        bestMatch = { name: intentName, confidence: score, priority: pattern.priority };
      }
    }

    return { name: bestMatch.name, confidence: bestMatch.confidence };
  }

  private getSmartFallbackResponse(message: string, context: ConversationContext, userId: string): AIResponse {
    const intent = this.detectIntent(message);
    const historyKey = `${userId}:${context.userRole}`;
    const previousIntent = this.lastIntent.get(historyKey);

    // Store current intent for context
    this.lastIntent.set(historyKey, intent.name);

    // Get response templates based on role
    const responses = context.userRole === 'nurse'
      ? { ...this.patientResponses, ...this.nurseResponses }
      : this.patientResponses;

    const intentResponse = responses[intent.name] || responses.general;

    // Handle contextual follow-ups
    if (intent.name === 'affirmative' && previousIntent) {
      const prevResponse = responses[previousIntent];
      if (prevResponse?.action) {
        return {
          text: '¡Perfecto! Te llevo allí.',
          suggestions: prevResponse.suggestions || [],
          intent: previousIntent,
          confidence: 0.9,
          action: prevResponse.action,
        };
      }
    }

    // Select random template for variety
    const template = intentResponse.templates[Math.floor(Math.random() * intentResponse.templates.length)];

    return {
      text: template,
      suggestions: intentResponse.suggestions,
      intent: intent.name,
      confidence: intent.confidence,
      action: intentResponse.action,
    };
  }

  private generateSuggestions(intent: { name: string; confidence: number }, context: ConversationContext): string[] {
    const responses = context.userRole === 'nurse'
      ? { ...this.patientResponses, ...this.nurseResponses }
      : this.patientResponses;

    const intentResponse = responses[intent.name] || responses.general;
    return intentResponse.suggestions || [];
  }
}
