import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastController = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';

      if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Solicitud inválida';
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permiso para realizar esta acción';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto con el recurso existente';
      } else if (error.status >= 500) {
        errorMessage = 'Error del servidor. Intenta de nuevo más tarde';
      }

      // Show toast for errors (except 401 which is handled by auth interceptor)
      if (error.status !== 401) {
        showErrorToast(toastController, errorMessage);
      }

      return throwError(() => error);
    })
  );
};

async function showErrorToast(toastController: ToastController, message: string): Promise<void> {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
    color: 'danger',
    buttons: [
      {
        text: 'Cerrar',
        role: 'cancel',
      },
    ],
  });
  await toast.present();
}
