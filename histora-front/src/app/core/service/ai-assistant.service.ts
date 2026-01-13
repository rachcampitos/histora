import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  action?: AIAction;
}

export interface AIAction {
  type: 'navigate' | 'call' | 'open_modal' | 'none';
  target?: string;
  params?: Record<string, any>;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
  intent?: string;
  confidence?: number;
  action?: AIAction;
}

export interface PreTriageResult {
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  recommendation: string;
  suggestedServices: string[];
}

export type AssistantState = 'inactive' | 'listening' | 'processing' | 'speaking';

@Injectable({
  providedIn: 'root'
})
export class AIAssistantService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/ai-assistant`;

  private messagesSubject = new BehaviorSubject<AIMessage[]>([]);
  private stateSubject = new BehaviorSubject<AssistantState>('inactive');
  private isOpenSubject = new BehaviorSubject<boolean>(false);

  messages$ = this.messagesSubject.asObservable();
  state$ = this.stateSubject.asObservable();
  isOpen$ = this.isOpenSubject.asObservable();

  // Voice recognition
  private recognition: any = null;
  private isListening = false;
  onVoiceResult = new Subject<string>();
  onVoiceEnd = new Subject<void>();

  // Action events
  onNavigate = new Subject<string>();
  onAction = new Subject<AIAction>();

  constructor() {
    this.initVoiceRecognition();
  }

  private initVoiceRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition ||
                                 (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-PE';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        this.onVoiceResult.next(transcript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onVoiceEnd.next();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        this.isListening = false;
      };
    }
  }

  open(): void {
    this.isOpenSubject.next(true);
    this.stateSubject.next('listening');
  }

  close(): void {
    this.stateSubject.next('inactive');
    setTimeout(() => {
      this.isOpenSubject.next(false);
    }, 300);
  }

  startVoiceInput(): boolean {
    if (!this.recognition) {
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.stateSubject.next('listening');

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      return false;
    }
  }

  stopVoiceInput(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async sendMessage(content: string, serviceContext?: any): Promise<AIResponse> {
    // Add user message to history
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    const messages = [...this.messagesSubject.value, userMessage];
    this.messagesSubject.next(messages);

    this.stateSubject.next('processing');

    try {
      const response = await this.http.post<AIResponse>(`${this.apiUrl}/chat`, {
        message: content,
        language: 'es',
        serviceContext
      }).toPromise();

      // Add assistant response
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response!.text,
        timestamp: new Date(),
        suggestions: response!.suggestions,
        action: response!.action
      };

      this.messagesSubject.next([...this.messagesSubject.value, assistantMessage]);
      this.stateSubject.next('listening');

      // Speak response if enabled
      this.speak(response!.text);

      // Handle action if present
      if (response!.action) {
        this.handleAction(response!.action);
      }

      return response!;
    } catch (error) {
      // Fallback response when API is unavailable
      const fallbackResponse = this.getLocalFallbackResponse(content);

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse.text,
        timestamp: new Date(),
        suggestions: fallbackResponse.suggestions,
        action: fallbackResponse.action
      };

      this.messagesSubject.next([...this.messagesSubject.value, assistantMessage]);
      this.stateSubject.next('listening');

      // Speak response
      this.speak(fallbackResponse.text);

      if (fallbackResponse.action) {
        this.handleAction(fallbackResponse.action);
      }

      return fallbackResponse;
    }
  }

  private getLocalFallbackResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Greeting
    if (/^(hola|hey|buenas|buenos días|buenas tardes)/.test(lowerMessage)) {
      return {
        text: '¡Hola! Soy Hana, tu asistente de salud. ¿En qué puedo ayudarte hoy?',
        suggestions: ['Agendar cita', 'Ver mis citas', 'Ver servicios'],
        intent: 'greeting',
        confidence: 0.9
      };
    }

    // Schedule
    if (lowerMessage.includes('agendar') || lowerMessage.includes('cita') || lowerMessage.includes('reservar')) {
      return {
        text: '¡Perfecto! Te ayudo a agendar una cita. Puedes ver los servicios disponibles y elegir el que necesites.',
        suggestions: ['Ver servicios', 'Control de signos vitales', 'Curaciones'],
        intent: 'schedule_appointment',
        confidence: 0.9,
        action: { type: 'navigate', target: '/patient/request' }
      };
    }

    // View appointments
    if (lowerMessage.includes('mis citas') || lowerMessage.includes('próximas citas')) {
      return {
        text: 'Te muestro tus próximas citas. También puedes ver el historial de servicios anteriores.',
        suggestions: ['Agendar nueva cita', 'Ver historial'],
        intent: 'view_appointments',
        confidence: 0.9,
        action: { type: 'navigate', target: '/patient/history' }
      };
    }

    // Services
    if (lowerMessage.includes('servicios') || lowerMessage.includes('qué ofrecen')) {
      return {
        text: 'Ofrecemos servicios de enfermería a domicilio: control de signos vitales, curaciones, inyectables, toma de muestras, cuidado de adulto mayor y más.',
        suggestions: ['Ver catálogo', 'Precios', 'Agendar cita'],
        intent: 'services_info',
        confidence: 0.9,
        action: { type: 'navigate', target: '/patient/request' }
      };
    }

    // Emergency
    if (lowerMessage.includes('emergencia') || lowerMessage.includes('urgente')) {
      return {
        text: '🚨 Si es una emergencia médica, llama al 911 o SAMU inmediatamente. Tu seguridad es lo primero.',
        suggestions: ['Llamar 911', 'No es emergencia'],
        intent: 'emergency',
        confidence: 0.95,
        action: { type: 'call', target: '911' }
      };
    }

    // Help
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('cómo')) {
      return {
        text: '¡Con gusto te ayudo! Puedo asistirte con: agendar citas, ver tus próximas citas, información sobre servicios, y responder preguntas.',
        suggestions: ['Agendar cita', 'Ver servicios', 'Contactar soporte'],
        intent: 'help',
        confidence: 0.9
      };
    }

    // Thanks
    if (lowerMessage.includes('gracias')) {
      return {
        text: '¡De nada! Estoy aquí para lo que necesites.',
        suggestions: ['Agendar cita', 'Ver servicios', 'Eso es todo'],
        intent: 'thanks',
        confidence: 0.9
      };
    }

    // Goodbye
    if (lowerMessage.includes('adiós') || lowerMessage.includes('chao') || lowerMessage.includes('hasta luego')) {
      return {
        text: '¡Hasta pronto! Cuídate mucho.',
        suggestions: [],
        intent: 'goodbye',
        confidence: 0.9
      };
    }

    // Default
    return {
      text: 'Hmm, no estoy segura de entender. ¿Puedo ayudarte a agendar una cita, ver servicios, o tienes otra consulta?',
      suggestions: ['Agendar cita', 'Ver servicios', 'Ayuda', 'Hablar con soporte'],
      intent: 'general',
      confidence: 0.5
    };
  }

  handleAction(action: AIAction): void {
    this.onAction.next(action);

    switch (action.type) {
      case 'navigate':
        if (action.target) {
          // Close assistant and navigate
          setTimeout(() => {
            this.close();
            this.router.navigate([action.target]);
          }, 1500);
        }
        break;

      case 'call':
        if (action.target) {
          window.location.href = `tel:${action.target}`;
        }
        break;

      case 'open_modal':
        // Emit event for component to handle
        break;

      default:
        break;
    }
  }

  executeAction(action: AIAction): void {
    this.handleAction(action);
  }

  async preTriage(symptoms: string, patientInfo: {
    age?: number;
    gender?: string;
    conditions?: string[];
  }): Promise<PreTriageResult> {
    try {
      return await this.http.post<PreTriageResult>(`${this.apiUrl}/pre-triage`, {
        symptoms,
        ...patientInfo
      }).toPromise() as PreTriageResult;
    } catch {
      // Local fallback triage
      const lowerSymptoms = symptoms.toLowerCase();

      if (['no respira', 'inconsciente', 'desmayo', 'convulsión'].some(k => lowerSymptoms.includes(k))) {
        return {
          urgency: 'emergency',
          recommendation: '🚨 Llama al 911 inmediatamente.',
          suggestedServices: ['emergencia_911']
        };
      }

      if (['fiebre alta', 'dolor intenso', 'dificultad para respirar'].some(k => lowerSymptoms.includes(k))) {
        return {
          urgency: 'high',
          recommendation: 'Estos síntomas requieren atención pronto.',
          suggestedServices: ['evaluacion_urgente']
        };
      }

      return {
        urgency: 'medium',
        recommendation: 'Te recomendamos agendar una evaluación.',
        suggestedServices: ['evaluacion_general']
      };
    }
  }

  clearConversation(): void {
    this.messagesSubject.next([]);
    this.http.delete(`${this.apiUrl}/conversation`).subscribe({
      error: () => {} // Ignore errors
    });
  }

  speak(text: string): void {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-PE';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.stateSubject.next('speaking');
      };

      utterance.onend = () => {
        this.stateSubject.next('listening');
      };

      speechSynthesis.speak(utterance);
    }
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      this.stateSubject.next('listening');
    }
  }

  get isVoiceSupported(): boolean {
    return this.recognition !== null;
  }

  get isSpeechSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}
