import { Component, forwardRef, input, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import {
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/angular/standalone';

export interface Country {
  code: string;      // ISO 3166-1 alpha-2 (PE, US, etc.)
  name: string;      // Country name
  dialCode: string;  // +51, +1, etc.
  flag: string;      // Emoji flag
}

// Lista de países de Latinoamérica y algunos importantes
export const COUNTRIES: Country[] = [
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'DO', name: 'Rep. Dominicana', dialCode: '+1809', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1787', flag: '🇵🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonIcon,
  ],
  template: `
    <div class="phone-input-container">
      <button
        type="button"
        class="country-selector"
        (click)="openCountrySelect()"
        [attr.aria-label]="'Código de país: ' + selectedCountry().name + ' ' + selectedCountry().dialCode"
        aria-haspopup="listbox"
      >
        <span class="flag" aria-hidden="true">{{ selectedCountry().flag }}</span>
        <span class="dial-code" aria-hidden="true">{{ selectedCountry().dialCode }}</span>
        <ion-icon name="chevron-down-outline" class="chevron" aria-hidden="true"></ion-icon>
      </button>

      <ion-input
        type="tel"
        [label]="label()"
        [labelPlacement]="labelPlacement()"
        [placeholder]="placeholder()"
        [value]="phoneNumber()"
        (ionInput)="onPhoneChange($event)"
        class="phone-number-input"
        [attr.aria-label]="label() + ', número de teléfono'"
      ></ion-input>

      <!-- Hidden select for country picker -->
      <ion-select
        #countrySelect
        [value]="selectedCountry().code"
        (ionChange)="onCountryChange($event)"
        interface="action-sheet"
        [interfaceOptions]="{ header: 'Seleccionar País' }"
        class="hidden-select"
        aria-label="Seleccionar código de país"
      >
        @for (country of countries; track country.code) {
          <ion-select-option [value]="country.code">
            {{ country.flag }} {{ country.name }} ({{ country.dialCode }})
          </ion-select-option>
        }
      </ion-select>
    </div>
  `,
  styles: [`
    .phone-input-container {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }

    .country-selector {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--ion-color-light);
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      border: 2px solid var(--ion-color-medium);
      border-right: none;
      min-width: 100px;
      height: 56px;
      font: inherit;
      transition: border-color 0.2s, background-color 0.2s;
    }

    .country-selector:hover {
      background: var(--ion-color-light-shade);
      border-color: var(--ion-color-primary);
    }

    .country-selector:focus {
      outline: 3px solid var(--ion-color-primary);
      outline-offset: 2px;
    }

    .flag {
      font-size: 1.5rem;
    }

    .dial-code {
      font-size: 0.9rem;
      color: var(--ion-color-dark);
      font-weight: 500;
    }

    .chevron {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin-left: 2px;
    }

    .phone-number-input {
      flex: 1;
      --padding-start: 12px;
    }

    .hidden-select {
      position: absolute;
      left: 0;
      top: 0;
      width: 100px;
      height: 56px;
      opacity: 0;
      cursor: pointer;
    }

    ion-input {
      --border-radius: 0 8px 8px 0;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit {
  label = input<string>('Teléfono');
  labelPlacement = input<'floating' | 'stacked' | 'fixed'>('floating');
  placeholder = input<string>('999 999 999');
  defaultCountry = input<string>('PE');

  countries = COUNTRIES;
  selectedCountry = signal<Country>(COUNTRIES[0]); // Peru by default
  phoneNumber = signal<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    // Set default country
    const defaultC = this.countries.find(c => c.code === this.defaultCountry());
    if (defaultC) {
      this.selectedCountry.set(defaultC);
    }
  }

  // Full phone number with country code
  fullPhoneNumber = computed(() => {
    const phone = this.phoneNumber();
    if (!phone) return '';
    return `${this.selectedCountry().dialCode} ${phone}`;
  });

  openCountrySelect(): void {
    // The hidden select will handle this via CSS positioning
  }

  onCountryChange(event: CustomEvent): void {
    const country = this.countries.find(c => c.code === event.detail.value);
    if (country) {
      this.selectedCountry.set(country);
      this.emitValue();
    }
  }

  onPhoneChange(event: CustomEvent): void {
    const value = event.detail.value || '';
    // Remove non-numeric characters except spaces
    const cleaned = value.replace(/[^\d\s]/g, '');
    this.phoneNumber.set(cleaned);
    this.emitValue();
  }

  private emitValue(): void {
    const fullNumber = this.fullPhoneNumber();
    this.onChange(fullNumber);
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (!value) {
      this.phoneNumber.set('');
      return;
    }

    // Try to parse the phone number
    // Check if it starts with a dial code
    for (const country of this.countries) {
      if (value.startsWith(country.dialCode)) {
        this.selectedCountry.set(country);
        const phone = value.slice(country.dialCode.length).trim();
        this.phoneNumber.set(phone);
        return;
      }
    }

    // If no dial code found, just set the number
    this.phoneNumber.set(value.replace(/^\+\d+\s*/, ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
