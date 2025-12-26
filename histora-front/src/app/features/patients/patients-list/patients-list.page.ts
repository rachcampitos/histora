import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, personOutline, searchOutline } from 'ionicons/icons';
import { PatientsService, PatientsResponse } from '../patients.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonMenuButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Pacientes</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/patients/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar pacientes..."
          [debounce]="300"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (isLoading() && patients().length === 0) {
        <ion-list>
          @for (item of [1, 2, 3, 4, 5]; track item) {
            <ion-item>
              <ion-avatar slot="start">
                <ion-skeleton-text animated></ion-skeleton-text>
              </ion-avatar>
              <ion-label>
                <ion-skeleton-text animated style="width: 60%;"></ion-skeleton-text>
                <ion-skeleton-text animated style="width: 40%;"></ion-skeleton-text>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      } @else if (patients().length === 0) {
        <div class="empty-state">
          <ion-icon name="person-outline"></ion-icon>
          <h3>No hay pacientes</h3>
          <p>Agrega tu primer paciente para comenzar</p>
          <ion-button routerLink="/patients/new">
            <ion-icon slot="start" name="add-outline"></ion-icon>
            Agregar Paciente
          </ion-button>
        </div>
      } @else {
        <ion-list>
          @for (patient of patients(); track patient._id) {
            <ion-item button detail routerLink="/patients/{{ patient._id }}">
              <ion-avatar slot="start">
                <div class="avatar-placeholder">
                  {{ getInitials(patient) }}
                </div>
              </ion-avatar>
              <ion-label>
                <h2>{{ patient.firstName }} {{ patient.lastName }}</h2>
                <p>{{ patient.email || patient.phone || 'Sin contacto' }}</p>
              </ion-label>
              @if (patient.bloodType) {
                <ion-badge slot="end" color="primary">{{ patient.bloodType }}</ion-badge>
              }
            </ion-item>
          }
        </ion-list>

        <ion-infinite-scroll (ionInfinite)="loadMore($event)">
          <ion-infinite-scroll-content></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/patients/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      ion-searchbar {
        --background: var(--ion-color-light);
        --border-radius: 8px;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ion-color-primary);
        color: white;
        font-weight: 600;
        font-size: 14px;
        border-radius: 50%;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        text-align: center;
        padding: 24px;
      }

      .empty-state ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      .empty-state h3 {
        margin: 0 0 8px;
        color: var(--ion-color-dark);
      }

      .empty-state p {
        margin: 0 0 24px;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class PatientsListPage implements OnInit {
  private patientsService = inject(PatientsService);

  patients = signal<Patient[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  offset = signal(0);
  total = signal(0);
  limit = 20;

  constructor() {
    addIcons({ addOutline, personOutline, searchOutline });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  async handleRefresh(event: CustomEvent): Promise<void> {
    this.offset.set(0);
    await this.loadPatients(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  onSearch(event: CustomEvent): void {
    this.searchQuery.set(event.detail.value || '');
    this.offset.set(0);
    this.loadPatients(true);
  }

  async loadMore(event: CustomEvent): Promise<void> {
    if (this.patients().length >= this.total()) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    this.offset.update((v) => v + this.limit);
    await this.loadPatients();
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }

  getInitials(patient: Patient): string {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
  }

  private loadPatients(reset = false): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading.set(true);

      this.patientsService
        .getPatients({
          search: this.searchQuery(),
          limit: this.limit,
          offset: this.offset(),
        })
        .subscribe({
          next: (response: PatientsResponse) => {
            if (reset) {
              this.patients.set(response.data);
            } else {
              this.patients.update((current) => [...current, ...response.data]);
            }
            this.total.set(response.total);
            this.isLoading.set(false);
            resolve();
          },
          error: () => {
            this.isLoading.set(false);
            resolve();
          },
        });
    });
  }
}
