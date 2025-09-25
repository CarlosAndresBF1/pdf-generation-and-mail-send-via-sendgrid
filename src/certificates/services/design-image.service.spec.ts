import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { DesignImageService } from './design-image.service';
import { S3Service } from '../../shared/services/s3.service';
import { UploadDesignImageDto } from '../dto/upload-design-image.dto';

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
    const mockUploadData: UploadDesignImageDto = {
      name: 'Test Design',
      description: 'Test description',
      client: 'TestClient',
    };

    const mockFile = {
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024000, // 1MB
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should upload image successfully', async () => {
      const expectedUrl =
        'https://cdn.example.com/certificates/design_images/testclient_2025/test-design_12345678.jpg';
      mockS3Service.uploadFile.mockResolvedValue(expectedUrl);

      const result = await service.uploadDesignImage(mockFile, mockUploadData);

      expect(result.url).toBe(expectedUrl);
      expect(result.originalName).toBe('test-image.jpg');
      expect(result.size).toBe(1024000);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.uploadedAt).toBeInstanceOf(Date);
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('certificates/design_images/testclient_2025'),
        mockFile.buffer,
        'image/jpeg',
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        service.uploadDesignImage(null as never, mockUploadData),
      ).rejects.toThrow('No se proporcionó ningún archivo');
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const unsupportedFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      await expect(
        service.uploadDesignImage(unsupportedFile, mockUploadData),
      ).rejects.toThrow('Formato de archivo no soportado');
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      };

      await expect(
        service.uploadDesignImage(largeFile, mockUploadData),
      ).rejects.toThrow('El archivo es demasiado grande');
    });

    it('should handle S3 upload error', async () => {
      mockS3Service.uploadFile.mockRejectedValue(new Error('S3 Error'));

      await expect(
        service.uploadDesignImage(mockFile, mockUploadData),
      ).rejects.toThrow('Error al subir la imagen');
    });

    it('should generate correct key for image without client', async () => {
      const uploadDataWithoutClient = {
        name: 'Test Design',
        description: 'Test description',
      };

      mockS3Service.uploadFile.mockResolvedValue(
        'https://cdn.example.com/test.jpg',
      );

      await service.uploadDesignImage(mockFile, uploadDataWithoutClient);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.stringMatching(/^certificates\/design_images\/general_\d{4}\//),
        mockFile.buffer,
        'image/jpeg',
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

  describe('validateDesignImageUrl', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('https://cdn.example.com');
      mockS3Service.extractKeyFromUrl.mockReturnValue(
        'certificates/design_images/client_2025/test.jpg',
      );
    });

    it('should validate correct design image URL', () => {
      const url =
        'https://cdn.example.com/certificates/design_images/client_2025/test.jpg';

      const result = service.validateDesignImageUrl(url);

      expect(result).toBe(true);
    });

    it('should reject URL from wrong CDN', () => {
      const url =
        'https://wrong-cdn.com/certificates/design_images/client_2025/test.jpg';

      const result = service.validateDesignImageUrl(url);

      expect(result).toBe(false);
    });

    it('should reject URL not in design_images folder', () => {
      mockS3Service.extractKeyFromUrl.mockReturnValue(
        'certificates/other/test.jpg',
      );
      const url = 'https://cdn.example.com/certificates/other/test.jpg';

      const result = service.validateDesignImageUrl(url);

      expect(result).toBe(false);
    });

    it('should reject empty URL', () => {
      const result = service.validateDesignImageUrl('');

      expect(result).toBe(false);
    });
  });

  describe('extractImageInfo', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('https://cdn.example.com');
    });

    it('should extract image info correctly', () => {
      const url =
        'https://cdn.example.com/certificates/design_images/client_2025/test.jpg';
      mockS3Service.extractKeyFromUrl.mockReturnValue(
        'certificates/design_images/client_2025/test.jpg',
      );

      // Mock validateDesignImageUrl to return true
      jest.spyOn(service, 'validateDesignImageUrl').mockReturnValue(true);

      const result = service.extractImageInfo(url);

      expect(result).toEqual({
        client: 'client',
        year: '2025',
        filename: 'test.jpg',
      });
    });

    it('should return null for invalid URL', () => {
      const url = 'https://wrong-cdn.com/test.jpg';
      jest.spyOn(service, 'validateDesignImageUrl').mockReturnValue(false);

      const result = service.extractImageInfo(url);

      expect(result).toBeNull();
    });

    it('should handle complex client names', () => {
      const url =
        'https://cdn.example.com/certificates/design_images/multi_word_client_2025/test.jpg';
      mockS3Service.extractKeyFromUrl.mockReturnValue(
        'certificates/design_images/multi_word_client_2025/test.jpg',
      );
      jest.spyOn(service, 'validateDesignImageUrl').mockReturnValue(true);

      const result = service.extractImageInfo(url);

      expect(result).toEqual({
        client: 'multi_word_client',
        year: '2025',
        filename: 'test.jpg',
      });
    });
  });

  describe('listDesignImages', () => {
    it('should return empty array (placeholder)', async () => {
      const result = await service.listDesignImages('client');

      expect(result).toEqual([]);
    });
  });
});
