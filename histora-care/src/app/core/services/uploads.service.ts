import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ApiService } from './api.service';

export interface UploadResponse {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  publicId?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadsService {
  private api = inject(ApiService);

  /**
   * Upload profile photo for the current user
   * @param imageData Base64 encoded image data
   * @param mimeType Optional MIME type
   */
  uploadProfilePhoto(imageData: string, mimeType?: string): Observable<UploadResponse> {
    return this.api.post<UploadResponse>('/uploads/profile-photo', {
      imageData,
      mimeType
    });
  }

  /**
   * Take a photo using the camera
   * @returns Promise with base64 image data
   */
  async takePhoto(): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 500,
        height: 500,
        correctOrientation: true
      });

      if (image.base64String) {
        return {
          base64: image.base64String,
          mimeType: `image/${image.format || 'jpeg'}`
        };
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  /**
   * Select a photo from the gallery
   * @returns Promise with base64 image data
   */
  async selectFromGallery(): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 500,
        height: 500,
        correctOrientation: true
      });

      if (image.base64String) {
        return {
          base64: image.base64String,
          mimeType: `image/${image.format || 'jpeg'}`
        };
      }
      return null;
    } catch (error) {
      console.error('Error selecting photo:', error);
      return null;
    }
  }

  /**
   * Prompt user to choose photo source and upload
   * Uses Camera Capacitor plugin with prompt for source selection
   */
  async promptAndGetPhoto(): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Seleccionar foto',
        promptLabelPhoto: 'Galería',
        promptLabelPicture: 'Tomar foto',
        promptLabelCancel: 'Cancelar',
        width: 500,
        height: 500,
        correctOrientation: true
      });

      if (image.base64String) {
        return {
          base64: image.base64String,
          mimeType: `image/${image.format || 'jpeg'}`
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting photo:', error);
      return null;
    }
  }
}
