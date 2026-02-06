import { Component, EventEmitter, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { VerificationContextService } from '../../../../core/services/verification-context.service';

@Component({
  selector: 'app-verification-complete',
  templateUrl: './verification-complete.component.html',
  standalone: false,
  styleUrls: ['./verification-complete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationCompleteComponent {
  @Output() continue = new EventEmitter<void>();
  @Output() viewProfile = new EventEmitter<void>();

  private contextService = inject(VerificationContextService);

  get hasContext(): boolean {
    return this.contextService.hasContext();
  }

  get ctaText(): string {
    return this.contextService.getCTAText();
  }

  onContinue() {
    this.continue.emit();
  }

  goToProfile() {
    this.viewProfile.emit();
  }
}
