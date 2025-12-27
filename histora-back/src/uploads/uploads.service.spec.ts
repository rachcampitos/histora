import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FileType } from './dto/upload-file.dto';

describe('UploadsService', () => {
  let service: UploadsService;

  const mockUserId = new Types.ObjectId().toString();
  const mockClinicId = new Types.ObjectId().toString();
  const mockPatientId = new Types.ObjectId().toString();

  const mockCloudinaryProvider = {
    uploadBuffer: jest.fn().mockResolvedValue({
      success: true,
      secureUrl: 'https://example.com/image.jpg',
      publicId: 'histora/test_123',
    }),
    uploadBase64: jest.fn().mockResolvedValue({
      success: true,
      secureUrl: 'https://example.com/image.jpg',
      publicId: 'histora/test_123',
    }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    getOptimizedUrl: jest.fn().mockReturnValue('https://example.com/optimized.jpg'),
    getThumbnailUrl: jest.fn().mockReturnValue('https://example.com/thumb.jpg'),
    isConfigured: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: CloudinaryProvider,
          useValue: mockCloudinaryProvider,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadProfilePhoto', () => {
    it('should upload a profile photo', async () => {
      const dto = {
        imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
        mimeType: 'image/jpeg',
      };

      const result = await service.uploadProfilePhoto(dto, mockUserId, mockClinicId, 'user', mockUserId);

      expect(result.url).toBeDefined();
      expect(result.thumbnailUrl).toBeDefined();
      expect(result.publicId).toBeDefined();
      expect(mockCloudinaryProvider.uploadBase64).toHaveBeenCalled();
    });

    it('should throw error for oversized image', async () => {
      // Create a large base64 string that decodes to >5MB
      // Base64 is ~4/3 of original size, so 7MB base64 = ~5.25MB decoded
      const largeData = Buffer.alloc(6 * 1024 * 1024).toString('base64');
      const dto = {
        imageData: `data:image/jpeg;base64,${largeData}`,
        mimeType: 'image/jpeg',
      };

      await expect(service.uploadProfilePhoto(dto, mockUserId, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid image format', async () => {
      const dto = {
        imageData: 'data:application/pdf;base64,test',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadProfilePhoto(dto, mockUserId, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle upload failure', async () => {
      mockCloudinaryProvider.uploadBase64.mockResolvedValueOnce({
        success: false,
        error: 'Upload failed',
      });

      const dto = {
        imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
        mimeType: 'image/jpeg',
      };

      await expect(service.uploadProfilePhoto(dto, mockUserId, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadDocument', () => {
    it('should upload a document', async () => {
      const dto = {
        fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
        filename: 'lab_result.jpg',
        type: FileType.LAB_RESULT,
        patientId: mockPatientId,
      };

      const result = await service.uploadDocument(dto, mockUserId, mockClinicId);

      expect(result.url).toBeDefined();
      expect(result.publicId).toBeDefined();
      expect(mockCloudinaryProvider.uploadBase64).toHaveBeenCalled();
    });

    it('should throw error for oversized document', async () => {
      // Create a large base64 string that decodes to >10MB
      const largeData = Buffer.alloc(11 * 1024 * 1024).toString('base64');
      const dto = {
        fileData: `data:application/pdf;base64,${largeData}`,
        filename: 'large_file.pdf',
        type: FileType.PATIENT_DOCUMENT,
        patientId: mockPatientId,
      };

      await expect(service.uploadDocument(dto, mockUserId, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadClinicLogo', () => {
    it('should upload a clinic logo', async () => {
      const dto = {
        imageData: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
      };

      const result = await service.uploadClinicLogo(dto, mockClinicId, mockUserId);

      expect(result.url).toBeDefined();
      expect(result.thumbnailUrl).toBeDefined();
      expect(result.publicId).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const result = await service.deleteFile('histora/test_123');

      expect(result.success).toBe(true);
      expect(mockCloudinaryProvider.delete).toHaveBeenCalledWith('histora/test_123');
    });

    it('should throw error on delete failure', async () => {
      mockCloudinaryProvider.delete.mockResolvedValueOnce({
        success: false,
        error: 'Delete failed',
      });

      await expect(service.deleteFile('histora/test_123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getOptimizedUrl', () => {
    it('should return optimized URL', () => {
      const result = service.getOptimizedUrl('histora/test_123', 200, 200);

      expect(result).toBeDefined();
      expect(mockCloudinaryProvider.getOptimizedUrl).toHaveBeenCalled();
    });
  });

  describe('isConfigured', () => {
    it('should return configuration status', () => {
      const result = service.isConfigured();

      expect(result).toBe(true);
      expect(mockCloudinaryProvider.isConfigured).toHaveBeenCalled();
    });
  });
});
