import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ChatService, ChatMessage, ChatRoom, SendMessageDto } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

interface QuickReply {
  text: string;
  icon: string;
}

@Component({
  selector: 'app-chat-modal',
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatModalComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() serviceRequestId!: string;
  @Input() otherUserName!: string;
  @Input() otherUserAvatar?: string;
  @Input() otherUserRole: 'patient' | 'nurse' = 'nurse';

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  private modalCtrl = inject(ModalController);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // State
  messageText = signal('');
  isSending = signal(false);
  isLoading = signal(true);
  error = signal<string | null>(null);
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  // Computed
  messages = this.chatService.messages;
  currentRoom = this.chatService.currentRoom;
  isTyping = this.chatService.isTyping;
  isConnected = this.chatService.isConnected;
  currentUserId = computed(() => this.authService.user()?.id);

  // Quick replies
  quickReplies: QuickReply[] = [
    { text: 'Ya llegue', icon: 'location' },
    { text: 'Voy en camino', icon: 'car' },
    { text: 'Dame 5 minutos', icon: 'time' },
    { text: 'Gracias', icon: 'heart' }
  ];

  async ngOnInit() {
    await this.initializeChat();
  }

  ngAfterViewChecked() {
    // Auto-scroll when new messages arrive
    const currentCount = this.messages().length;
    if (currentCount > this.lastMessageCount || this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.lastMessageCount = currentCount;
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.leaveRoom();
  }

  private async initializeChat() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Connect to WebSocket
      await this.chatService.connect();

      // Get or check for existing room
      const room = await this.chatService.getRoomByServiceRequest(this.serviceRequestId);

      if (room) {
        // Load messages and join room
        await this.chatService.getRoom(room._id);
        await this.chatService.getMessages(room._id);
        await this.chatService.joinRoom(room._id);

        // Mark all as read
        this.chatService.markAllAsRead();
      }

      this.shouldScrollToBottom = true;

      // Listen for new messages
      this.chatService.onNewMessage()
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (message) => {
          // Haptic feedback for received messages
          if (message.senderId !== this.currentUserId() && Capacitor.isNativePlatform()) {
            await Haptics.notification({ type: NotificationType.Success });
          }
          this.shouldScrollToBottom = true;

          // Mark as read if it's from the other user
          if (message.senderId !== this.currentUserId()) {
            this.chatService.markAsRead([message._id]);
          }
        });

    } catch (err) {
      console.error('Error initializing chat:', err);
      this.error.set('No se pudo conectar al chat');
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendMessage() {
    const text = this.messageText().trim();
    if (!text || this.isSending()) return;

    this.isSending.set(true);
    this.messageText.set('');

    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    try {
      const messageDto: SendMessageDto = {
        content: text,
        type: 'text'
      };

      await this.chatService.sendMessage(messageDto);

      // Success haptic
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      }

      this.shouldScrollToBottom = true;

    } catch (err) {
      console.error('Error sending message:', err);

      // Error haptic
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Error });
      }

      // Restore message text on error
      this.messageText.set(text);
    } finally {
      this.isSending.set(false);
      this.chatService.emitTyping(false);
    }
  }

  async sendQuickReply(reply: QuickReply) {
    this.messageText.set(reply.text);
    await this.sendMessage();
  }

  onInputChange() {
    this.chatService.emitTyping(this.messageText().trim().length > 0);
  }

  onInputBlur() {
    this.chatService.emitTyping(false);
  }

  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      setTimeout(() => {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId();
  }

  getMessageStatusIcon(message: ChatMessage): string {
    switch (message.status) {
      case 'sending':
        return 'time-outline';
      case 'sent':
        return 'checkmark-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'read':
        return 'checkmark-done-outline';
      case 'failed':
        return 'alert-circle-outline';
      default:
        return 'checkmark-outline';
    }
  }

  isMessageRead(message: ChatMessage): boolean {
    return message.status === 'read';
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateDivider(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return d.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;

    const messages = this.messages();
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();

    return currentDate !== prevDate;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message._id;
  }

  async dismiss() {
    await this.modalCtrl.dismiss();
  }

  retry() {
    this.initializeChat();
  }
}
