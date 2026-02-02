import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { VerificationStatus } from '../../../../core/services/patient-verification.service';

@Component({
  selector: 'app-verification-complete',
  templateUrl: './verification-complete.component.html',
  standalone: false,
  styleUrls: ['./verification-complete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationCompleteComponent {
  @Input() status: VerificationStatus | null = null;
  @Output() continue = new EventEmitter<void>();

  get verificationLevel(): number {
    return this.status?.verificationLevel ?? 1;
  }

  get trustScore(): number {
    return this.status?.trustScore ?? 50;
  }

  get badgeName(): string {
    const level = this.verificationLevel;
    if (level >= 2) return 'Verificado Premium';
    if (level >= 1) return 'Verificado';
    return 'Basico';
  }

  get badgeColor(): string {
    const level = this.verificationLevel;
    if (level >= 2) return 'gold';
    if (level >= 1) return 'success';
    return 'medium';
  }

  onContinue() {
    this.continue.emit();
  }
}
