import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { RequestPage } from './request.page';

export const unsavedChangesGuard: CanDeactivateFn<RequestPage> = async (component) => {
  if (!component.formDirty()) return true;

  const alertCtrl = inject(AlertController);
  const alert = await alertCtrl.create({
    header: 'Cambios sin guardar',
    message: 'Seguro que deseas salir? Los datos del formulario se perderan.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Salir', role: 'confirm' }
    ]
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'confirm';
};
