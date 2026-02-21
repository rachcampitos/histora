import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
  NotificationService,
  AppNotification,
  NotificationType,
} from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.page.html',
  standalone: false,
  styleUrls: ['./notifications-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsListPage implements OnInit {
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  notificationService = inject(NotificationService);

  ngOnInit() {
    this.notificationService.fetchFromServer().subscribe();
  }

  ionViewWillEnter() {
    this.notificationService.fetchFromServer().subscribe();
  }

  async handleRefresh(event: any) {
    this.notificationService.fetchFromServer().subscribe({
      complete: () => event.target.complete(),
      error: () => event.target.complete(),
    });
  }

  async onNotificationTap(notification: AppNotification) {
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }

    const route = this.getRouteForType(notification.type, notification.data);
    if (route) {
      this.router.navigate(route);
    }
  }

  async markAllRead() {
    await this.notificationService.markAllAsRead();
  }

  async deleteNotification(notification: AppNotification, event: Event) {
    event.stopPropagation();
    await this.notificationService.deleteNotification(notification.id);
  }

  async confirmClearAll() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert',
      header: 'Borrar todas',
      message: 'Se eliminaran todas las notificaciones. Esta accion no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: () => this.notificationService.clearAll(),
        },
      ],
    });
    await alert.present();
  }

  getIcon(type: NotificationType): string {
    const icons: Record<string, string> = {
      service_request: 'medkit-outline',
      service_accepted: 'checkmark-circle-outline',
      service_rejected: 'close-circle-outline',
      service_started: 'play-circle-outline',
      service_completed: 'checkmark-done-outline',
      service_cancelled: 'ban-outline',
      payment_received: 'cash-outline',
      payment_pending: 'time-outline',
      verification_approved: 'shield-checkmark-outline',
      verification_rejected: 'shield-outline',
      new_message: 'chatbubble-outline',
      chat_message: 'chatbubbles-outline',
      promotion: 'gift-outline',
      reminder: 'alarm-outline',
      system: 'information-circle-outline',
      new_nurse_review: 'star-outline',
    };
    return icons[type] || 'notifications-outline';
  }

  getIconColor(type: NotificationType): string {
    const colors: Record<string, string> = {
      service_accepted: 'success',
      service_completed: 'success',
      verification_approved: 'success',
      payment_received: 'success',
      service_rejected: 'danger',
      service_cancelled: 'danger',
      verification_rejected: 'danger',
      payment_pending: 'warning',
      reminder: 'warning',
      service_request: 'primary',
      service_started: 'tertiary',
      new_message: 'primary',
      chat_message: 'primary',
      new_nurse_review: 'warning',
    };
    return colors[type] || 'medium';
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  goToSettings() {
    this.router.navigate(['/notifications/settings']);
  }

  private getRouteForType(type: NotificationType, data?: Record<string, any>): string[] | null {
    switch (type) {
      case 'service_request':
        return ['/nurse/requests'];
      case 'service_accepted':
      case 'service_started':
      case 'service_completed':
        return data?.['requestId'] ? ['/patient/tracking', data['requestId']] : null;
      case 'payment_received':
      case 'payment_pending':
        return ['/nurse/earnings'];
      case 'verification_approved':
      case 'verification_rejected':
        return ['/nurse/verification'];
      case 'new_nurse_review':
        return ['/nurse/tabs/dashboard'];
      default:
        return null;
    }
  }
}
