import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { driver, DriveStep, Config } from 'driver.js';

export type TourType = 'patient_home' | 'nurse_dashboard' | 'admin_verifications';

interface TourConfig {
  steps: DriveStep[];
  config?: Partial<Config>;
}

/**
 * Product Tour Service
 *
 * Implements guided tours using Driver.js to highlight UI elements
 * and explain features to new users after completing onboarding.
 *
 * Tours are shown once per user per section and can be replayed from settings.
 */
@Injectable({
  providedIn: 'root',
})
export class ProductTourService {
  private readonly STORAGE_KEY_PREFIX = 'histora-tour-completed-';

  /**
   * Check if a specific tour has been completed
   */
  async isTourCompleted(tourType: TourType): Promise<boolean> {
    const { value } = await Preferences.get({
      key: this.STORAGE_KEY_PREFIX + tourType,
    });
    return value === 'true';
  }

  /**
   * Mark a tour as completed
   */
  async markTourCompleted(tourType: TourType): Promise<void> {
    await Preferences.set({
      key: this.STORAGE_KEY_PREFIX + tourType,
      value: 'true',
    });
  }

  /**
   * Reset a tour to be shown again
   */
  async resetTour(tourType: TourType): Promise<void> {
    await Preferences.remove({
      key: this.STORAGE_KEY_PREFIX + tourType,
    });
  }

  /**
   * Reset all tours
   */
  async resetAllTours(): Promise<void> {
    const tourTypes: TourType[] = [
      'patient_home',
      'nurse_dashboard',
      'admin_verifications',
    ];
    for (const type of tourTypes) {
      await Preferences.remove({
        key: this.STORAGE_KEY_PREFIX + type,
      });
    }
  }

  /**
   * Start a tour if not completed
   * @param tourType - The type of tour to start
   * @param forceShow - Force show even if already completed
   */
  async startTour(tourType: TourType, forceShow = false): Promise<void> {
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

    // Wait for DOM to be ready
    await this.waitForElements(tourConfig.steps);

    const driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'histora-tour-popover',
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      stagePadding: 8,
      stageRadius: 12,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: false,
      onDestroyStarted: async () => {
        await this.markTourCompleted(tourType);
        driverInstance.destroy();
      },
      ...tourConfig.config,
      steps: tourConfig.steps,
    });

    driverInstance.drive();
  }

  /**
   * Get tour configuration for a specific type
   */
  private getTourConfig(tourType: TourType): TourConfig | null {
    const configs: Record<TourType, TourConfig> = {
      patient_home: {
        steps: [
          {
            element: '#tour-main-action',
            popover: {
              title: 'Buscar Enfermera',
              description:
                'Toca aqui para ver el mapa con enfermeras verificadas cerca de ti.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-quick-actions',
            popover: {
              title: 'Acciones rapidas',
              description:
                'Accede rapidamente a tu historial de servicios y enfermeras favoritas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-map',
            popover: {
              title: 'Mapa de enfermeras',
              description:
                'Explora el mapa para ver todas las enfermeras disponibles en tu zona.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-settings',
            popover: {
              title: 'Configuracion',
              description:
                'Gestiona tu perfil, direcciones guardadas, notificaciones y preferencias.',
              side: 'top',
              align: 'start',
            },
          },
        ],
      },
      nurse_dashboard: {
        steps: [
          {
            element: '#tour-nurse-stats',
            popover: {
              title: 'Tus estadisticas',
              description:
                'Ve un resumen de tus servicios, ganancias y calificacion.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-active-requests',
            popover: {
              title: 'Solicitudes activas',
              description:
                'Las solicitudes de pacientes cerca de ti apareceran aqui.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-nurse-schedule',
            popover: {
              title: 'Tu disponibilidad',
              description:
                'Configura tus horarios y zonas de servicio para recibir solicitudes.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-requests',
            popover: {
              title: 'Solicitudes',
              description:
                'Nuevas solicitudes de pacientes esperando tu aceptacion.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-services',
            popover: {
              title: 'Mis servicios',
              description: 'Historial de todos los servicios que has realizado.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-tab-earnings',
            popover: {
              title: 'Ganancias',
              description:
                'Ve tus ganancias, retiros y facturacion en detalle.',
              side: 'top',
              align: 'start',
            },
          },
        ],
      },
      admin_verifications: {
        steps: [
          {
            element: '#tour-verification-stats',
            popover: {
              title: 'Estado de verificaciones',
              description:
                'Ve cuantas verificaciones estan pendientes, aprobadas y rechazadas.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-pending-list',
            popover: {
              title: 'Verificaciones pendientes',
              description:
                'Lista de enfermeras esperando revision. Haz clic para ver detalles.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-verification-filters',
            popover: {
              title: 'Filtros',
              description:
                'Filtra por estado, fecha o tipo de documento para encontrar rapidamente.',
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
   */
  private waitForElements(steps: DriveStep[]): Promise<void> {
    return new Promise((resolve) => {
      const checkElements = () => {
        const allPresent = steps.every((step) => {
          if (typeof step.element === 'string') {
            return document.querySelector(step.element) !== null;
          }
          return true;
        });

        if (allPresent) {
          // Small delay to ensure elements are fully rendered
          setTimeout(resolve, 300);
        } else {
          // Retry after 100ms
          setTimeout(checkElements, 100);
        }
      };

      // Start checking after initial delay
      setTimeout(checkElements, 500);
    });
  }
}
