import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { driver, DriveStep, Config, Driver } from 'driver.js';
import { AuthService } from './auth.service';

export type TourType =
  | 'patient_home'
  | 'patient_map'
  | 'patient_settings'
  | 'nurse_dashboard'
  | 'nurse_profile'
  | 'nurse_requests'
  | 'nurse_services'
  | 'nurse_earnings'
  | 'admin_verifications';

interface TourConfig {
  steps: DriveStep[];
  config?: Partial<Config>;
  nextTour?: TourType; // Chain to another tour after this one
}

/**
 * Product Tour Service
 *
 * Implements guided tours using Driver.js to highlight UI elements
 * and explain features to new users after completing onboarding.
 *
 * Features:
 * - Multi-page tour support with navigation prompts
 * - Tours are shown once per user per section (user-specific keys)
 * - Can be replayed from settings
 * - Chained tours for comprehensive onboarding
 */
@Injectable({
  providedIn: 'root',
})
export class ProductTourService {
  private readonly STORAGE_KEY_PREFIX = 'nurselite-tour-completed-';
  private readonly PENDING_TOUR_KEY = 'nurselite-pending-tour';
  private authService = inject(AuthService);

  // Active driver instance
  private driverInstance: Driver | null = null;

  // Signal to track if a tour is currently active
  isTourActive = signal(false);

  // Track which tour is currently active (to prevent duplicates)
  private activeTourType: TourType | null = null;

  // Flag to track if the app is initializing (first load after registration)
  private isFirstLoad = true;

  /**
   * Get user-specific storage key for a tour
   * This ensures each user has their own tour completion state
   */
  private getStorageKey(tourType: TourType): string {
    const userId = this.authService.user()?.id;
    if (userId) {
      return `${this.STORAGE_KEY_PREFIX}${userId}-${tourType}`;
    }
    // Fallback for cases where user is not yet loaded (shouldn't happen in practice)
    return `${this.STORAGE_KEY_PREFIX}${tourType}`;
  }

  /**
   * Check if a specific tour has been completed
   */
  async isTourCompleted(tourType: TourType): Promise<boolean> {
    const { value } = await Preferences.get({
      key: this.getStorageKey(tourType),
    });
    return value === 'true';
  }

  /**
   * Mark a tour as completed
   */
  async markTourCompleted(tourType: TourType): Promise<void> {
    await Preferences.set({
      key: this.getStorageKey(tourType),
      value: 'true',
    });
  }

  /**
   * Reset a tour to be shown again
   */
  async resetTour(tourType: TourType): Promise<void> {
    await Preferences.remove({
      key: this.getStorageKey(tourType),
    });
  }

  /**
   * Reset all tours for a specific role (for current user)
   */
  async resetToursByRole(role: 'patient' | 'nurse' | 'admin'): Promise<void> {
    const tourTypes: Record<string, TourType[]> = {
      patient: ['patient_home', 'patient_map', 'patient_settings'],
      nurse: ['nurse_dashboard', 'nurse_profile', 'nurse_requests', 'nurse_services', 'nurse_earnings'],
      admin: ['admin_verifications'],
    };

    for (const type of tourTypes[role] || []) {
      await Preferences.remove({
        key: this.getStorageKey(type),
      });
    }
  }

  /**
   * Reset all tours (for current user)
   */
  async resetAllTours(): Promise<void> {
    const tourTypes: TourType[] = [
      'patient_home',
      'patient_map',
      'patient_settings',
      'nurse_dashboard',
      'nurse_profile',
      'nurse_requests',
      'nurse_services',
      'nurse_earnings',
      'admin_verifications',
    ];
    for (const type of tourTypes) {
      await Preferences.remove({
        key: this.getStorageKey(type),
      });
    }
  }

  /**
   * Set a pending tour to be shown on next page visit
   */
  async setPendingTour(tourType: TourType): Promise<void> {
    await Preferences.set({
      key: this.PENDING_TOUR_KEY,
      value: tourType,
    });
  }

  /**
   * Get and clear pending tour
   */
  async getPendingTour(): Promise<TourType | null> {
    const { value } = await Preferences.get({
      key: this.PENDING_TOUR_KEY,
    });
    if (value) {
      await Preferences.remove({ key: this.PENDING_TOUR_KEY });
      return value as TourType;
    }
    return null;
  }

  /**
   * Check if there's a pending tour and start it
   */
  async checkAndStartPendingTour(): Promise<void> {
    const pendingTour = await this.getPendingTour();
    if (pendingTour) {
      await this.startTour(pendingTour, true);
    }
  }

  /**
   * Start a tour if not completed
   * @param tourType - The type of tour to start
   * @param forceShow - Force show even if already completed
   */
  async startTour(tourType: TourType, forceShow = false): Promise<void> {
    // Guard: Don't start if another tour is already active
    if (this.isTourActive() || this.activeTourType !== null) {
      console.log(`Tour ${tourType}: Another tour (${this.activeTourType}) is already active, skipping`);
      return;
    }

    if (!forceShow) {
      const completed = await this.isTourCompleted(tourType);
      if (completed) {
        return;
      }
    }

    const tourConfig = this.getTourConfig(tourType);
    if (!tourConfig) {
      return;
    }

    // On first load after registration, wait longer for UI to stabilize
    const timeout = this.isFirstLoad ? 5000 : 3000;
    this.isFirstLoad = false;

    // Wait for DOM to be ready
    const elementsReady = await this.waitForElements(tourConfig.steps, timeout);
    if (!elementsReady) {
      console.warn(`Tour ${tourType}: Some elements not found, skipping tour`);
      return;
    }

    // Double-check we're still not in an active tour (race condition guard)
    if (this.isTourActive() || this.activeTourType !== null) {
      return;
    }

    this.isTourActive.set(true);
    this.activeTourType = tourType;

    this.driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'nurselite-tour-popover',
      overlayColor: 'rgba(30, 58, 95, 0.85)',
      stagePadding: 10,
      stageRadius: 16,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      // Disable interaction with highlighted elements to prevent accidental navigation
      disableActiveInteraction: true,
      onDestroyStarted: async () => {
        await this.markTourCompleted(tourType);
        this.isTourActive.set(false);
        this.activeTourType = null;
        this.driverInstance?.destroy();
        this.driverInstance = null;
      },
      ...tourConfig.config,
      steps: tourConfig.steps,
    });

    this.driverInstance.drive();
  }

  /**
   * Stop current tour without marking it as completed
   */
  stopTour(): void {
    if (this.driverInstance) {
      // Destroy without triggering onDestroyStarted (which marks as completed)
      this.driverInstance.destroy();
      this.driverInstance = null;
    }
    this.isTourActive.set(false);
    this.activeTourType = null;
  }

  /**
   * Force stop and cleanup any active tour - use when navigating away
   */
  forceStop(): void {
    if (this.driverInstance) {
      try {
        this.driverInstance.destroy();
      } catch {
        // Ignore errors during force stop
      }
      this.driverInstance = null;
    }
    this.isTourActive.set(false);
    this.activeTourType = null;
  }

  /**
   * Get tour configuration for a specific type
   */
  private getTourConfig(tourType: TourType): TourConfig | null {
    const configs: Record<TourType, TourConfig> = {
      // ============================================================
      // PATIENT TOURS
      // ============================================================
      patient_home: {
        steps: [
          {
            popover: {
              title: '¡Bienvenido a NurseLite!',
              description:
                'Te mostraremos cómo usar la app para solicitar enfermeras certificadas a domicilio.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-main-action',
            popover: {
              title: 'Solicitar Enfermera',
              description:
                'Este es el botón principal. Tócalo para ver el mapa y encontrar enfermeras verificadas cerca de ti.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-quick-actions',
            popover: {
              title: 'Acciones Rápidas',
              description:
                'Accede a tu historial de servicios, enfermeras favoritas y configuración desde aquí.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-map',
            popover: {
              title: 'Mapa de Enfermeras',
              description:
                'Explora el mapa para ver todas las enfermeras disponibles en tiempo real.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-settings',
            popover: {
              title: 'Tu Perfil y Ajustes',
              description:
                'Gestiona tu cuenta, notificaciones y métodos de pago aquí.',
              side: 'top',
              align: 'start',
            },
          },
        ],
      },

      patient_map: {
        steps: [
          {
            element: '#tour-map-container',
            popover: {
              title: 'Mapa Interactivo',
              description:
                'Aquí verás enfermeras disponibles cerca de ti. Los marcadores muestran su ubicación en tiempo real.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-search-filters',
            popover: {
              title: 'Filtros de Búsqueda',
              description:
                'Filtra por especialidad, calificación o distancia para encontrar la enfermera perfecta.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-nurse-list',
            popover: {
              title: 'Lista de Enfermeras',
              description:
                'Desliza hacia arriba para ver el perfil de cada enfermera, sus calificaciones y servicios.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      patient_settings: {
        steps: [
          {
            element: '#tour-profile-section',
            popover: {
              title: 'Tu Perfil',
              description:
                'Toca aquí para editar tu información personal y foto de perfil.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-theme-setting',
            popover: {
              title: 'Tema de la App',
              description:
                'Cambia entre modo claro, oscuro o automático según tus preferencias.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-replay-tutorial',
            popover: {
              title: 'Ver Tutorial',
              description:
                'Si necesitas recordar cómo usar la app, puedes repetir este tutorial desde aquí.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      // ============================================================
      // NURSE TOURS
      // ============================================================
      nurse_dashboard: {
        steps: [
          {
            popover: {
              title: '¡Bienvenida a NurseLite!',
              description:
                'Te mostraremos cómo usar la app para recibir y gestionar solicitudes de pacientes.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-availability-toggle',
            popover: {
              title: 'Tu Disponibilidad',
              description:
                'Activa este interruptor cuando estés lista para recibir solicitudes. Los pacientes solo te verán cuando esté activo.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-nurse-stats',
            popover: {
              title: 'Tus Estadísticas',
              description:
                'Ve tu calificación, total de servicios y reseñas de un vistazo.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-active-requests',
            popover: {
              title: 'Servicios Activos',
              description:
                'Los servicios que has aceptado aparecerán aquí. Podrás actualizar el estado y contactar al paciente.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-pending-requests',
            popover: {
              title: 'Solicitudes Cercanas',
              description:
                'Nuevas solicitudes de pacientes cerca de ti. Actúa rápido, otros enfermeras también las ven.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-quick-menu',
            popover: {
              title: 'Menú Rápido',
              description:
                'Accede a solicitudes, servicios completados, ganancias y tu perfil desde aquí.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-panic-button',
            popover: {
              title: 'Botón de Seguridad',
              description:
                'En caso de emergencia durante un servicio, usa este botón para alertar y pedir ayuda inmediata.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      nurse_profile: {
        steps: [
          {
            element: '#tour-profile-avatar',
            popover: {
              title: 'Tu Foto de Perfil',
              description:
                'Sube una foto profesional. Los pacientes confían más en perfiles con foto real.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-cep-section',
            popover: {
              title: 'Número CEP Verificado',
              description:
                'Tu registro del Colegio de Enfermeros del Perú. Este sello genera confianza.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-bio-section',
            popover: {
              title: 'Acerca de Ti',
              description:
                'Describe tu experiencia y enfoque. Los pacientes leen esto antes de solicitar.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-specialties-section',
            popover: {
              title: 'Especialidades',
              description:
                'Agrega tus áreas de experiencia para aparecer en búsquedas específicas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-radius-section',
            popover: {
              title: 'Radio de Servicio',
              description:
                'Define hasta qué distancia puedes desplazarte. Más radio = más solicitudes.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-schedule-section',
            popover: {
              title: 'Horario de Disponibilidad',
              description:
                'Configura tus días y horarios. Solo recibirás solicitudes en estos horarios.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-save-button',
            popover: {
              title: 'Guardar Cambios',
              description:
                '¡No olvides guardar! Los cambios se sincronizan al instante.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      nurse_requests: {
        steps: [
          {
            element: '#tour-requests-tabs',
            popover: {
              title: 'Tipos de Solicitudes',
              description:
                'Navega entre solicitudes pendientes, aceptadas y completadas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-request-card',
            popover: {
              title: 'Tarjeta de Solicitud',
              description:
                'Cada solicitud muestra el servicio, ubicación, precio y datos del paciente.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-accept-button',
            popover: {
              title: 'Aceptar Solicitud',
              description:
                'Al aceptar, te comprometes a llegar. El paciente recibirá una notificación.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      nurse_services: {
        steps: [
          {
            element: '#tour-services-filter',
            popover: {
              title: 'Filtrar Servicios',
              description:
                'Filtra por fecha, estado o tipo de servicio para encontrar lo que buscas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-service-history',
            popover: {
              title: 'Historial de Servicios',
              description:
                'Aquí verás todos los servicios que has completado con detalles y calificaciones.',
              side: 'bottom',
              align: 'center',
            },
          },
        ],
      },

      nurse_earnings: {
        steps: [
          {
            element: '#tour-earnings-summary',
            popover: {
              title: 'Resumen de Ganancias',
              description:
                'Ve cuánto has ganado esta semana, mes y en total.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-earnings-chart',
            popover: {
              title: 'Gráfico de Ingresos',
              description:
                'Visualiza la tendencia de tus ganancias a lo largo del tiempo.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-transactions',
            popover: {
              title: 'Transacciones',
              description:
                'Lista detallada de cada pago recibido por servicio.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      },

      // ============================================================
      // ADMIN TOURS
      // ============================================================
      admin_verifications: {
        steps: [
          {
            element: '#tour-verification-stats',
            popover: {
              title: 'Estado de Verificaciones',
              description:
                'Ve cuántas verificaciones están pendientes, aprobadas y rechazadas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-pending-list',
            popover: {
              title: 'Verificaciones Pendientes',
              description:
                'Lista de enfermeras esperando revisión. Haz clic para ver detalles.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-verification-filters',
            popover: {
              title: 'Filtros',
              description:
                'Filtra por estado, fecha o tipo de documento para encontrar rápidamente.',
              side: 'bottom',
              align: 'center',
            },
          },
        ],
      },
    };

    return configs[tourType] || null;
  }

  /**
   * Wait for all tour elements to be present in DOM
   * @returns true if all elements found, false if timeout
   */
  private waitForElements(steps: DriveStep[], timeout = 3000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkElements = () => {
        // Filter steps that have element selectors
        const stepsWithElements = steps.filter(
          (step) => typeof step.element === 'string' && step.element
        );

        // If no elements to check, resolve immediately
        if (stepsWithElements.length === 0) {
          setTimeout(() => resolve(true), 300);
          return;
        }

        const allPresent = stepsWithElements.every((step) => {
          const element = document.querySelector(step.element as string);
          return element !== null;
        });

        if (allPresent) {
          // Small delay to ensure elements are fully rendered
          setTimeout(() => resolve(true), 300);
        } else if (Date.now() - startTime > timeout) {
          // Timeout reached
          resolve(false);
        } else {
          // Retry after 100ms
          setTimeout(checkElements, 100);
        }
      };

      // Start checking after initial delay
      setTimeout(checkElements, 300);
    });
  }
}
