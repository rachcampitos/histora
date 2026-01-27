import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';

type ExpirationReason = 'inactivity' | 'token_expired' | 'user_logout' | 'timeout';

interface ReasonConfig {
  icon: string;
  title: string;
  message: string;
}

@Component({
  selector: 'app-session-expired',
  templateUrl: './session-expired.page.html',
  standalone: false,
  styleUrls: ['./session-expired.page.scss'],
})
export class SessionExpiredPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storage = inject(StorageService);

  reason: ExpirationReason = 'inactivity';
  reasonConfig: ReasonConfig = this.getReasonConfig('inactivity');

  private readonly reasonConfigs: Record<ExpirationReason, ReasonConfig> = {
    inactivity: {
      icon: 'time-outline',
      title: 'Sesion cerrada por inactividad',
      message: 'Tu sesion se cerro automaticamente por seguridad debido a inactividad prolongada.'
    },
    token_expired: {
      icon: 'shield-outline',
      title: 'Sesion expirada',
      message: 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente para continuar.'
    },
    user_logout: {
      icon: 'log-out-outline',
      title: 'Sesion cerrada',
      message: 'Has cerrado tu sesion exitosamente.'
    },
    timeout: {
      icon: 'hourglass-outline',
      title: 'Tiempo de sesion agotado',
      message: 'Tu sesion ha expirado por tiempo. Por favor, inicia sesion nuevamente.'
    }
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const reason = params['reason'] as ExpirationReason;
      if (reason && this.reasonConfigs[reason]) {
        this.reason = reason;
        this.reasonConfig = this.getReasonConfig(reason);
      }
    });
  }

  private getReasonConfig(reason: ExpirationReason): ReasonConfig {
    return this.reasonConfigs[reason] || this.reasonConfigs.inactivity;
  }

  async goToLogin() {
    // Check if there's a return URL stored
    const returnUrl = await this.storage.get<string>('return_url');

    if (returnUrl) {
      // Store it temporarily so login page can use it after successful login
      await this.storage.set('post_login_redirect', returnUrl);
      await this.storage.remove('return_url');
    }

    this.router.navigate(['/auth/login']);
  }
}
