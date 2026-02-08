import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn().mockResolvedValue({
      webPath: 'data:image/png;base64,abc',
      format: 'png',
    }),
    checkPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
  },
  CameraResultType: { Uri: 'uri', DataUrl: 'dataUrl', Base64: 'base64' },
  CameraSource: { Prompt: 'PROMPT', Camera: 'CAMERA', Photos: 'PHOTOS' },
  CameraDirection: { Rear: 'REAR', Front: 'FRONT' },
}));

import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';
import { Camera } from '@capacitor/camera';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        UploadsService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(UploadsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= uploadProfilePhoto =============

  describe('uploadProfilePhoto', () => {
    it('should POST imageData and mimeType to /uploads/profile-photo', () => {
      const mockResponse = { success: true, url: 'https://cdn.example.com/photo.jpg' };
      mockApi.post.mockReturnValue(of(mockResponse));

      service.uploadProfilePhoto('base64data', 'image/png').subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/uploads/profile-photo', {
        imageData: 'base64data',
        mimeType: 'image/png',
      });
    });

    it('should POST without mimeType when not provided', () => {
      mockApi.post.mockReturnValue(of({ success: true }));

      service.uploadProfilePhoto('base64data').subscribe();

      expect(mockApi.post).toHaveBeenCalledWith('/uploads/profile-photo', {
        imageData: 'base64data',
        mimeType: undefined,
      });
    });
  });

  // ============= takePhoto =============

  describe('takePhoto', () => {
    it('should call Camera.getPhoto with Camera source and return base64 + mimeType', async () => {
      (Camera.getPhoto as any).mockResolvedValue({
        base64String: 'abc123',
        format: 'jpeg',
        webPath: '',
        saved: false,
      });

      const result = await service.takePhoto();

      expect(Camera.getPhoto as any).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 80,
          resultType: 'base64',
          source: 'CAMERA',
        })
      );
      expect(result).toEqual({ base64: 'abc123', mimeType: 'image/jpeg' });
    });

    it('should return null when base64String is missing', async () => {
      (Camera.getPhoto as any).mockResolvedValue({
        base64String: undefined,
        format: 'png',
        webPath: '',
        saved: false,
      });

      const result = await service.takePhoto();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (Camera.getPhoto as any).mockRejectedValue(new Error('Camera error'));

      const result = await service.takePhoto();
      expect(result).toBeNull();
    });

    it('should default mimeType to image/jpeg when format is missing', async () => {
      (Camera.getPhoto as any).mockResolvedValue({
        base64String: 'data123',
        format: '',
        webPath: '',
        saved: false,
      });

      const result = await service.takePhoto();
      expect(result).toEqual({ base64: 'data123', mimeType: 'image/jpeg' });
    });
  });

  // ============= selectFromGallery =============

  describe('selectFromGallery', () => {
    it('should call Camera.getPhoto with Photos source and return data', async () => {
      (Camera.getPhoto as any).mockResolvedValue({
        base64String: 'gallery-data',
        format: 'png',
        webPath: '',
        saved: false,
      });

      const result = await service.selectFromGallery();

      expect(Camera.getPhoto as any).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'PHOTOS',
          resultType: 'base64',
        })
      );
      expect(result).toEqual({ base64: 'gallery-data', mimeType: 'image/png' });
    });

    it('should return null on error', async () => {
      (Camera.getPhoto as any).mockRejectedValue(new Error('Gallery error'));

      const result = await service.selectFromGallery();
      expect(result).toBeNull();
    });
  });

  // ============= promptAndGetPhoto =============

  describe('promptAndGetPhoto', () => {
    it('should call Camera.getPhoto with Prompt source and return data', async () => {
      (Camera.getPhoto as any).mockResolvedValue({
        base64String: 'prompt-data',
        format: 'jpeg',
        webPath: '',
        saved: false,
      });

      const result = await service.promptAndGetPhoto();

      expect(Camera.getPhoto as any).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'PROMPT',
          resultType: 'base64',
        })
      );
      expect(result).toEqual({ base64: 'prompt-data', mimeType: 'image/jpeg' });
    });

    it('should return null when user cancels', async () => {
      (Camera.getPhoto as any).mockRejectedValue(new Error('User cancelled'));

      const result = await service.promptAndGetPhoto();
      expect(result).toBeNull();
    });

    it('should return null when no image picked', async () => {
      (Camera.getPhoto as any).mockRejectedValue(new Error('No image picked'));

      const result = await service.promptAndGetPhoto();
      expect(result).toBeNull();
    });

    it('should throw on non-cancel errors', async () => {
      (Camera.getPhoto as any).mockRejectedValue(new Error('Hardware failure'));

      await expect(service.promptAndGetPhoto()).rejects.toThrow('Hardware failure');
    });
  });
});
