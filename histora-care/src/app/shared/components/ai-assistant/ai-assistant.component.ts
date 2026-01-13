import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../../../core/services/storage.service';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface AIAction {
  type: 'navigate' | 'call' | 'none';
  target?: string;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
  intent?: string;
  action?: AIAction;
}

type AssistantState = 'inactive' | 'listening' | 'processing' | 'speaking';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss'],
})
export class AIAssistantComponent implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContent!: ElementRef;

  isOpen = false;
  state: AssistantState = 'inactive';
  messages: AIMessage[] = [];
  currentMessage = '';
  isListening = false;

  private apiUrl = `${environment.apiUrl}/ai-assistant`;
  private recognition: any = null;
  private destroy$ = new Subject<void>();

  suggestedActions = [
    { icon: 'calendar-outline', label: 'Agendar', command: 'quiero agendar un servicio' },
    { icon: 'medkit-outline', label: 'Síntomas', command: 'tengo algunos síntomas' },
    { icon: 'help-circle-outline', label: 'Ayuda', command: 'necesito ayuda' },
    { icon: 'information-circle-outline', label: 'Servicios', command: 'qué servicios ofrecen' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    this.initVoiceRecognition();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopVoiceInput();
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
        this.currentMessage = transcript;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.currentMessage.trim()) {
          this.sendMessage();
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
      };
    }
  }

  openAssistant(): void {
    this.isOpen = true;
    this.state = 'listening';
  }

  closeAssistant(): void {
    this.isOpen = false;
    this.state = 'inactive';
    this.stopVoiceInput();
  }

  toggleVoiceInput(): void {
    if (this.isListening) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  private startVoiceInput(): void {
    if (!this.recognition) return;

    try {
      this.recognition.start();
      this.isListening = true;
      this.state = 'listening';

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error starting voice:', error);
    }
  }

  private stopVoiceInput(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async sendMessage(message?: string): Promise<void> {
    const text = message || this.currentMessage.trim();
    if (!text || this.state === 'processing') return;

    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.currentMessage = '';
    this.state = 'processing';
    this.scrollToBottom();

    try {
      // Try API first
      const response = await this.http.post<AIResponse>(`${this.apiUrl}/chat`, {
        message: text,
        language: 'es'
      }).toPromise();

      this.handleResponse(response!);
    } catch {
      // Fallback to local responses
      const fallback = this.getLocalFallback(text);
      this.handleResponse(fallback);
    }
  }

  private handleResponse(response: AIResponse): void {
    const assistantMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.text,
      timestamp: new Date(),
      suggestions: response.suggestions
    };

    this.messages.push(assistantMessage);
    this.state = 'listening';
    this.scrollToBottom();

    // Speak response
    this.speak(response.text);

    // Handle action
    if (response.action?.type === 'navigate' && response.action.target) {
      setTimeout(() => {
        this.closeAssistant();
        this.router.navigate([response.action!.target]);
      }, 2000);
    } else if (response.action?.type === 'call' && response.action.target) {
      window.location.href = `tel:${response.action.target}`;
    }
  }

  private getLocalFallback(message: string): AIResponse {
    const lower = message.toLowerCase();

    if (/^(hola|hey|buenas)/.test(lower)) {
      return {
        text: '¡Hola! Soy Hana, tu asistente de salud. ¿En qué puedo ayudarte hoy?',
        suggestions: ['Agendar servicio', 'Ver mis citas', 'Servicios disponibles'],
        intent: 'greeting'
      };
    }

    if (lower.includes('agendar') || lower.includes('cita') || lower.includes('servicio')) {
      return {
        text: '¡Perfecto! Te ayudo a solicitar un servicio. Te llevo a la sección de solicitudes.',
        suggestions: ['Control de signos', 'Curaciones', 'Inyectables'],
        intent: 'schedule',
        action: { type: 'navigate', target: '/patient/tabs/home' }
      };
    }

    if (lower.includes('mis citas') || lower.includes('historial')) {
      return {
        text: 'Te muestro tu historial de servicios.',
        suggestions: ['Agendar nuevo', 'Ver detalles'],
        intent: 'history',
        action: { type: 'navigate', target: '/patient/history' }
      };
    }

    if (lower.includes('síntoma') || lower.includes('duele') || lower.includes('mal')) {
      return {
        text: 'Lamento que no te sientas bien. Cuéntame más sobre tus síntomas para orientarte mejor.',
        suggestions: ['Solicitar evaluación', 'Es urgente', 'Ver servicios'],
        intent: 'symptoms'
      };
    }

    if (lower.includes('emergencia') || lower.includes('urgente')) {
      return {
        text: '🚨 Si es una emergencia médica, llama al 911 inmediatamente. Tu seguridad es lo primero.',
        suggestions: ['Llamar 911', 'No es emergencia'],
        intent: 'emergency',
        action: { type: 'call', target: '911' }
      };
    }

    if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto')) {
      return {
        text: 'Los precios varían según el servicio:\n• Control de signos: desde S/. 35\n• Curaciones: desde S/. 45\n• Inyectables: desde S/. 30',
        suggestions: ['Ver servicios', 'Agendar'],
        intent: 'pricing'
      };
    }

    if (lower.includes('servicios') || lower.includes('ofrecen')) {
      return {
        text: 'Ofrecemos: control de signos vitales, curaciones, inyectables, toma de muestras, cuidado de adulto mayor, y más.',
        suggestions: ['Ver catálogo', 'Agendar', 'Precios'],
        intent: 'services',
        action: { type: 'navigate', target: '/patient/tabs/home' }
      };
    }

    if (lower.includes('ayuda') || lower.includes('cómo')) {
      return {
        text: 'Puedo ayudarte con: agendar servicios, ver tus citas, información sobre precios, y responder preguntas.',
        suggestions: ['Agendar', 'Ver servicios', 'Contactar'],
        intent: 'help'
      };
    }

    if (lower.includes('gracias')) {
      return {
        text: '¡De nada! Estoy aquí para lo que necesites.',
        suggestions: ['Agendar servicio', 'Eso es todo'],
        intent: 'thanks'
      };
    }

    if (lower.includes('adiós') || lower.includes('chao')) {
      return {
        text: '¡Hasta pronto! Cuídate mucho.',
        suggestions: [],
        intent: 'goodbye'
      };
    }

    return {
      text: 'No estoy segura de entender. ¿Puedo ayudarte con agendar un servicio, ver información, o tienes otra consulta?',
      suggestions: ['Agendar', 'Ver servicios', 'Ayuda'],
      intent: 'general'
    };
  }

  private speak(text: string): void {
    // Voice output disabled for now - will enable in future release
    // if ('speechSynthesis' in window) {
    //   speechSynthesis.cancel();
    //   const utterance = new SpeechSynthesisUtterance(text);
    //   utterance.lang = 'es-PE';
    //   utterance.rate = 1.0;
    //   utterance.onstart = () => this.state = 'speaking';
    //   utterance.onend = () => this.state = 'listening';
    //   speechSynthesis.speak(utterance);
    // }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContent?.nativeElement) {
        this.chatContent.nativeElement.scrollTop = this.chatContent.nativeElement.scrollHeight;
      }
    }, 100);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  get showVoiceButton(): boolean {
    // Disabled for now - will enable in future release
    return false;
    // return this.recognition !== null;
  }

  trackByMessageId(index: number, message: AIMessage): string {
    return message.id;
  }
}
