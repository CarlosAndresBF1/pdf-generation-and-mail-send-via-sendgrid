import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { DesignImageService } from './design-image.service';
import { S3Service } from '../../shared/services/s3.service';

describe('DesignImageService', () => {
  let service: DesignImageService;

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    extractKeyFromUrl: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignImageService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DesignImageService>(DesignImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDesignImage', () => {
    const mockFile = {
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024000, // 1MB
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('https://cdn.example.com');
    });

    it('should upload image successfully', async () => {
      const s3Url =
        'https://my-bucket.s3.amazonaws.com/certificates/design_images/design_12345678.jpg';
      const expectedCdnUrl =
        'https://cdn.example.com/certificates/design_images/design_12345678.jpg';
      mockS3Service.uploadFile.mockResolvedValue(s3Url);

      const result = await service.uploadDesignImage(mockFile);

      expect(result.url).toBe(expectedCdnUrl);
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.stringMatching(
          /^certificates\/design_images\/design_[a-f0-9]{8}\.jpg$/,
        ),
        mockFile.buffer,
        'image/jpeg',
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadDesignImage(null as never)).rejects.toThrow(
        'No se proporcionó ningún archivo',
      );
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const unsupportedFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      await expect(service.uploadDesignImage(unsupportedFile)).rejects.toThrow(
        'Formato de archivo no soportado',
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      };

      await expect(service.uploadDesignImage(largeFile)).rejects.toThrow(
        'El archivo es demasiado grande',
      );
    });

    it('should handle S3 upload error', async () => {
      mockS3Service.uploadFile.mockRejectedValue(new Error('S3 Error'));

      await expect(service.uploadDesignImage(mockFile)).rejects.toThrow(
        'Error al subir la imagen',
      );
    });
  });

  describe('deleteDesignImage', () => {
    it('should delete image successfully', async () => {
      const key = 'certificates/design_images/client_2025/test.jpg';
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await service.deleteDesignImage(key);

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(key);
    });

    it('should handle deletion error', async () => {
      const key = 'certificates/design_images/client_2025/test.jpg';
      mockS3Service.deleteFile.mockRejectedValue(new Error('Delete error'));

      await expect(service.deleteDesignImage(key)).rejects.toThrow(
        'Error al eliminar la imagen',
      );
    });
  });
});
