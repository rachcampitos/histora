import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { AIAssistantService, AIMessage, AssistantState } from '../../../core/service/ai-assistant.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss'],
  animations: [
    trigger('overlayAnimation', [
      state('inactive', style({
        opacity: 0,
        transform: 'scale(0.95)'
      })),
      state('active', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('inactive => active', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ]),
      transition('active => inactive', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('fabPulse', [
      transition('* => *', [
        animate('2s ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.1)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('messageSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AIAssistantComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  isOpen = false;
  state: AssistantState = 'inactive';
  messages: AIMessage[] = [];
  currentMessage = '';
  isListening = false;

  // Accessibility
  latestAIMessage = '';

  // Suggested quick actions
  suggestedActions = [
    { icon: 'calendar-outline', label: 'Agendar', command: 'quiero agendar un servicio' },
    { icon: 'medkit-outline', label: 'Síntomas', command: 'tengo algunos síntomas' },
    { icon: 'help-circle-outline', label: 'Ayuda', command: 'necesito ayuda' },
    { icon: 'information-circle-outline', label: 'Info', command: 'información sobre servicios' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private aiService: AIAssistantService) {}

  ngOnInit(): void {
    this.aiService.isOpen$.pipe(takeUntil(this.destroy$)).subscribe(isOpen => {
      this.isOpen = isOpen;
    });

    this.aiService.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.state = state;
    });

    this.aiService.messages$.pipe(takeUntil(this.destroy$)).subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });

    // Voice recognition listeners
    this.aiService.onVoiceResult.pipe(takeUntil(this.destroy$)).subscribe(transcript => {
      this.currentMessage = transcript;
    });

    this.aiService.onVoiceEnd.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isListening = false;
      if (this.currentMessage.trim()) {
        this.sendMessage();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAssistant(): void {
    this.aiService.open();
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 400);
  }

  closeAssistant(): void {
    this.aiService.close();
  }

  toggleVoiceInput(): void {
    if (this.isListening) {
      this.aiService.stopVoiceInput();
      this.isListening = false;
    } else {
      if (this.aiService.startVoiceInput()) {
        this.isListening = true;
      }
    }
  }

  async sendMessage(message?: string): Promise<void> {
    const text = message || this.currentMessage.trim();
    if (!text || this.state === 'processing') return;

    this.currentMessage = '';

    try {
      const response = await this.aiService.sendMessage(text);
      this.latestAIMessage = response.text;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }

    if (event.key === 'Escape') {
      this.closeAssistant();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closeAssistant();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  trackByMessageId(index: number, message: AIMessage): string {
    return message.id;
  }

  get showVoiceButton(): boolean {
    return this.aiService.isVoiceSupported;
  }
}
