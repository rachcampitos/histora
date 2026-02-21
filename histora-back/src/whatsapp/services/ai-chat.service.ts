import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIResponse } from '../dto/message.dto';
import { ToolHandlerService } from './tool-handler.service';

interface MessageHistory {
  direction: 'inbound' | 'outbound';
  text: string;
}

interface SessionData {
  capturedData?: Record<string, string>;
  userType?: string;
}

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'buscar_enfermeras',
    description:
      'Busca enfermeras disponibles por distrito y categoria de servicio en Lima. Usa esta herramienta cuando el usuario quiera encontrar enfermeras cercanas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        distrito: {
          type: 'string',
          description:
            'Distrito de Lima (ej: Miraflores, San Isidro, Surco, La Molina, San Borja, etc.)',
        },
        categoria: {
          type: 'string',
          description:
            'Categoria del servicio: elderly_care, injection, vital_signs, wound_care, catheter, iv_therapy, blood_draw, medication, post_surgery',
          enum: [
            'elderly_care',
            'injection',
            'vital_signs',
            'wound_care',
            'catheter',
            'iv_therapy',
            'blood_draw',
            'medication',
            'post_surgery',
          ],
        },
      },
      required: ['distrito'],
    },
  },
  {
    name: 'ver_servicios',
    description:
      'Lista todos los servicios de enfermeria disponibles con precios y duracion. Usa esta herramienta cuando el usuario pregunte que servicios ofrecemos.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'crear_solicitud',
    description:
      'Crea una solicitud de servicio de enfermeria a domicilio. Solo usar cuando el usuario ha confirmado enfermera, servicio, distrito y fecha.',
    input_schema: {
      type: 'object' as const,
      properties: {
        telefono_usuario: {
          type: 'string',
          description: 'Numero de telefono del usuario (proporcionado por el sistema)',
        },
        nurse_id: {
          type: 'string',
          description: 'ID de la enfermera seleccionada',
        },
        service_id: {
          type: 'string',
          description: 'ID del servicio seleccionado',
        },
        distrito: {
          type: 'string',
          description: 'Distrito donde se realizara el servicio',
        },
        direccion: {
          type: 'string',
          description: 'Direccion exacta (opcional)',
        },
        fecha: {
          type: 'string',
          description: 'Fecha del servicio en formato YYYY-MM-DD',
        },
        horario: {
          type: 'string',
          description: 'Horario preferido: morning, afternoon, evening, asap',
          enum: ['morning', 'afternoon', 'evening', 'asap'],
        },
        notas: {
          type: 'string',
          description: 'Notas adicionales del paciente',
        },
      },
      required: ['telefono_usuario', 'nurse_id', 'service_id', 'distrito'],
    },
  },
  {
    name: 'ver_estado_solicitud',
    description:
      'Consulta el estado de las solicitudes activas del usuario. Usa cuando el usuario pregunte por el estado de su servicio.',
    input_schema: {
      type: 'object' as const,
      properties: {
        telefono_usuario: {
          type: 'string',
          description: 'Numero de telefono del usuario (proporcionado por el sistema)',
        },
      },
      required: ['telefono_usuario'],
    },
  },
];

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-20250514';

  constructor(
    private readonly configService: ConfigService,
    private readonly toolHandler: ToolHandlerService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Process a message and generate an AI response
   */
  async chat(
    userMessage: string,
    history: MessageHistory[],
    session: SessionData,
    phoneNumber?: string,
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(session, phoneNumber);
    const messages = this.formatMessages(history, userMessage);

    try {
      const assistantMessage = await this.runWithTools(systemPrompt, messages);

      this.logger.debug('AI Response generated with tool support');

      return this.parseResponse(assistantMessage);
    } catch (error) {
      this.logger.error('Claude API Error:', error.message);
      return {
        text: 'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?',
      };
    }
  }

  /**
   * Run Claude with tool calling loop
   * Handles tool_use → tool_result → text response cycle
   */
  private async runWithTools(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant'; content: string | Anthropic.ContentBlockParam[] }[],
  ): Promise<string> {
    const maxIterations = 5;
    let currentMessages = [...messages];

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages: currentMessages,
      });

      // If the response is a normal text, return it
      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((block) => block.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
      }

      // If the model wants to use a tool
      if (response.stop_reason === 'tool_use') {
        // Add the assistant's response (with tool_use blocks) to messages
        currentMessages.push({
          role: 'assistant',
          content: response.content as Anthropic.ContentBlockParam[],
        });

        // Execute each tool call and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            this.logger.log(`Tool call: ${block.name}`);
            const result = await this.toolHandler.executeTool(
              block.name,
              block.input as Record<string, any>,
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Add tool results as user message
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop so Claude can process the tool results
        continue;
      }

      // Fallback: extract any text from the response
      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : '';
    }

    // Safety: if we exceed max iterations
    this.logger.warn('Exceeded max tool iterations');
    return 'Disculpa, no pude completar tu solicitud. ¿Puedes intentar de nuevo?';
  }

  /**
   * Build the system prompt with context
   */
  private buildSystemPrompt(session: SessionData, phoneNumber?: string): string {
    const capturedInfo = session.capturedData
      ? Object.entries(session.capturedData)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')
      : 'Sin datos capturados aun';

    const phoneContext = phoneNumber
      ? `\n## TELEFONO DEL USUARIO\n${phoneNumber}\nIMPORTANTE: Cuando uses las herramientas crear_solicitud o ver_estado_solicitud, pasa este numero como telefono_usuario.\n`
      : '';

    return `
Eres el asistente virtual de NurseLite, plataforma de enfermeras a domicilio en Lima, Peru.
Operado por Code Media EIRL (RUC 20615496074).

## REGLAS DE RESPUESTA
- Respuestas CORTAS (max 3-4 oraciones)
- Español peruano, tono amable y profesional
- Si ofreces opciones, usa el formato: [Opcion 1] [Opcion 2] [Opcion 3]
- Maximo 3 opciones por mensaje
- NO uses emojis excesivos (maximo 1 por mensaje si es necesario)

## HERRAMIENTAS DISPONIBLES
Tienes acceso a herramientas para buscar enfermeras, ver servicios, crear solicitudes y consultar estados.

### Cuando usar las herramientas:
- **buscar_enfermeras**: Cuando el usuario mencione que necesita una enfermera, especifique un distrito, o pregunte por disponibilidad
- **ver_servicios**: Cuando pregunte que servicios ofrecemos, precios o duracion
- **crear_solicitud**: SOLO cuando el usuario haya confirmado: enfermera, servicio, distrito y fecha. Siempre confirma antes de crear
- **ver_estado_solicitud**: Cuando pregunte por el estado de un servicio pendiente

### Flujo de reserva:
1. Pregunta que necesita (servicio) y donde (distrito)
2. Usa buscar_enfermeras para mostrar opciones
3. El usuario elige una enfermera
4. Confirma fecha y horario
5. Usa crear_solicitud para crear la reserva
6. Si el usuario no tiene cuenta, indicale que se registre primero

## SERVICIOS
1. Cuidado Adulto Mayor - Desde S/.120 (2-12h)
   - Aseo personal, alimentacion, acompañamiento, supervision
2. Inyecciones a Domicilio - Desde S/.30 (10-30min)
   - Intramuscular, subcutanea, endovenosa
3. Control Signos Vitales - Desde S/.35 (15-30min)
   - Presion arterial, temperatura, frecuencia cardiaca
4. Curacion de Heridas - Desde S/.60 (30-45min)
   - Limpieza, desinfeccion, vendaje post-operatorio

## COBERTURA
Lima Metropolitana: Miraflores, San Isidro, San Borja, Surco, La Molina, Barranco, Chorrillos, Jesus Maria, Lince, Magdalena, Pueblo Libre, San Miguel, Ate, Santa Anita, La Victoria, Breña, Lima Centro, y mas.

## DIFERENCIACION
- Enfermeras verificadas por el CEP (Colegio de Enfermeros del Peru)
- Verificacion de identidad con RENIEC
- Sin comision por servicio: la enfermera recibe el 100% del pago del paciente
- Modelo de suscripcion mensual para enfermeras (Plan Basico gratis, Plan Pro S/39/mes, Plan Premium S/79/mes)
- Seguimiento GPS en tiempo real

## LINKS IMPORTANTES
- Registro paciente: https://app.nurse-lite.com/auth/register?type=patient
- Registro enfermera: https://app.nurse-lite.com/auth/register?type=nurse
- Ver enfermeras: https://app.nurse-lite.com
- Libro de Reclamaciones: https://app.nurse-lite.com/legal/complaints

## CONTACTO
- Email: admin@nurselite.com
- WhatsApp soporte: +51 939 175 392
- Horario de atencion: Lunes a Sabado, 8:00 a.m. - 8:00 p.m.
- Domicilio fiscal: Cal. Tiahuanaco 145, Dpto 201, Urb. Portada del Sol Et. Dos, La Molina, Lima
${phoneContext}
## DATOS DEL USUARIO ACTUAL
${capturedInfo}

## INSTRUCCIONES ESPECIALES
1. Si preguntan por emergencias medicas: sugiere llamar al 106 (SAMU) o ir a emergencias
2. Intenta capturar naturalmente: nombre, distrito, tipo de servicio que necesita
3. Si capturas datos, incluyelos asi al FINAL de tu respuesta:
   [CAPTURED:nombre=X,distrito=Y,servicio=Z]
   (esto sera procesado internamente y no se mostrara al usuario)
4. Si el usuario parece frustrado o pide hablar con humano, responde con:
   [ESCALATE:razon aqui]
5. NUNCA des consejos medicos ni diagnosticos
6. Si no entiendes algo, pide aclaracion de forma amable
7. Si el usuario quiere presentar un reclamo, indicale que puede hacerlo desde la app en el Libro de Reclamaciones o enviar un correo a admin@nurselite.com
8. Cuando muestres enfermeras del resultado de buscar_enfermeras, presenta la info de forma clara y concisa
`;
  }

  /**
   * Format message history for Claude API
   */
  private formatMessages(
    history: MessageHistory[],
    currentMessage: string,
  ): { role: 'user' | 'assistant'; content: string }[] {
    // Take last 6 messages for context (to manage tokens)
    const recentHistory = history.slice(-6);

    const formattedHistory = recentHistory.map((msg) => ({
      role: (msg.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    }));

    return [...formattedHistory, { role: 'user' as const, content: currentMessage }];
  }

  /**
   * Parse AI response to extract buttons, captured data, etc.
   */
  private parseResponse(response: string): AIResponse {
    let text = response;
    let buttons: string[] = [];
    let capturedData: Record<string, string> = {};
    let shouldEscalate = false;
    let escalationReason: string | undefined;

    // Extract escalation request [ESCALATE:reason]
    const escalateMatch = text.match(/\[ESCALATE:([^\]]+)\]/);
    if (escalateMatch) {
      text = text.replace(escalateMatch[0], '').trim();
      shouldEscalate = true;
      escalationReason = escalateMatch[1].trim();
    }

    // Extract captured data [CAPTURED:key=value,key2=value2]
    const capturedMatch = text.match(/\[CAPTURED:([^\]]+)\]/);
    if (capturedMatch) {
      text = text.replace(capturedMatch[0], '').trim();
      const pairs = capturedMatch[1].split(',');
      pairs.forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) {
          capturedData[key.trim()] = value.trim();
        }
      });
    }

    // Extract buttons [Option Text]
    const buttonMatches = text.match(/\[([^\]]+)\]/g);
    if (buttonMatches && buttonMatches.length > 1) {
      buttons = buttonMatches
        .map((b) => b.slice(1, -1))
        .filter((b) => !b.includes(':')) // Exclude special tags
        .slice(0, 3); // Max 3 buttons

      // Remove button text from response if we have multiple
      if (buttons.length > 1) {
        buttons.forEach((btn) => {
          text = text.replace(`[${btn}]`, '');
        });
        text = text.trim();
      } else {
        buttons = []; // Single bracket is probably part of text
      }
    }

    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return {
      text: text || 'Gracias por tu mensaje. ¿En que puedo ayudarte?',
      buttons: buttons.length > 0 ? buttons : undefined,
      capturedData: Object.keys(capturedData).length > 0 ? capturedData : undefined,
      shouldEscalate,
      escalationReason,
    };
  }
}
