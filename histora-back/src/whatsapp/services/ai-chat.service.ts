import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIResponse } from '../dto/message.dto';

interface MessageHistory {
  direction: 'inbound' | 'outbound';
  text: string;
}

interface SessionData {
  capturedData?: Record<string, string>;
  userType?: string;
}

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-20250514';

  constructor(private readonly configService: ConfigService) {
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
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(session);
    const messages = this.formatMessages(history, userMessage);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });

      const assistantMessage =
        response.content[0].type === 'text' ? response.content[0].text : '';

      this.logger.debug(`AI Response generated (${response.usage?.output_tokens} tokens)`);

      return this.parseResponse(assistantMessage);
    } catch (error) {
      this.logger.error('Claude API Error:', error.message);
      return {
        text: 'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?',
      };
    }
  }

  /**
   * Build the system prompt with context
   */
  private buildSystemPrompt(session: SessionData): string {
    const capturedInfo = session.capturedData
      ? Object.entries(session.capturedData)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')
      : 'Sin datos capturados aun';

    return `
Eres el asistente virtual de NurseLite, plataforma de enfermeras a domicilio en Lima, Peru.

## REGLAS DE RESPUESTA
- Respuestas CORTAS (max 3-4 oraciones)
- Español peruano, tono amable y profesional
- Si ofreces opciones, usa el formato: [Opcion 1] [Opcion 2] [Opcion 3]
- Maximo 3 opciones por mensaje
- NO uses emojis excesivos (maximo 1 por mensaje si es necesario)

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
- 100% de ingresos para la enfermera (sin comision)
- Seguimiento GPS en tiempo real

## LINKS IMPORTANTES
- Registro paciente: https://app.nurse-lite.com/auth/register?type=patient
- Registro enfermera: https://app.nurse-lite.com/auth/register?type=nurse
- Ver enfermeras: https://app.nurse-lite.com

## DATOS DEL USUARIO ACTUAL
${capturedInfo}

## INSTRUCCIONES ESPECIALES
1. Si preguntan por emergencias medicas: sugiere llamar al 106 (SAMU) o ir a emergencias
2. Si piden agendar directamente: envia link de la app
3. Intenta capturar naturalmente: nombre, distrito, tipo de servicio que necesita
4. Si capturas datos, incluyelos asi al FINAL de tu respuesta:
   [CAPTURED:nombre=X,distrito=Y,servicio=Z]
   (esto sera procesado internamente y no se mostrara al usuario)
5. Si el usuario parece frustrado o pide hablar con humano, responde con:
   [ESCALATE:razon aqui]
6. NUNCA inventes nombres de enfermeras especificas
7. NUNCA des consejos medicos ni diagnosticos
8. Si no entiendes algo, pide aclaracion de forma amable
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
