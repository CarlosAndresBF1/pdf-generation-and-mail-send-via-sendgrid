import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CertificatesController } from './certificates.controller';
import { CertificatesService } from '../services/certificates.service';
import { DesignImageService } from '../services/design-image.service';
import { UploadDesignImageDto } from '../dto/upload-design-image.dto';

describe('CertificatesController - Upload Design Image', () => {
  let controller: CertificatesController;

  const mockCertificatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDesignImageService = {
    uploadDesignImage: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        {
          provide: CertificatesService,
          useValue: mockCertificatesService,
        },
        {
          provide: DesignImageService,
          useValue: mockDesignImageService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CertificatesController>(CertificatesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDesignImage', () => {
    const mockFile = {
      originalname: 'test-design.jpg',
      mimetype: 'image/jpeg',
      size: 1024000,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const mockUploadData: UploadDesignImageDto = {
      name: 'Test Design',
      description: 'Test description for design',
      client: 'TestClient',
    };

    it('should upload design image successfully', async () => {
      const expectedResult = {
        url: 'https://cdn.example.com/certificates/design_images/testclient_2025/test-design_12345678.jpg',
        key: 'certificates/design_images/testclient_2025/test-design_12345678.jpg',
        originalName: 'test-design.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      };

      mockDesignImageService.uploadDesignImage.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.uploadDesignImage(
        mockFile,
        mockUploadData,
      );

      expect(result).toEqual(expectedResult);

      expect(mockDesignImageService.uploadDesignImage).toHaveBeenCalledWith(
        mockFile,
        mockUploadData,
      );
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Error al subir la imagen';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.uploadDesignImage(mockFile, mockUploadData),
      ).rejects.toThrow(BadRequestException);

      expect(mockDesignImageService.uploadDesignImage).toHaveBeenCalledWith(
        mockFile,
        mockUploadData,
      );
    });

    it('should handle missing file', async () => {
      const errorMessage = 'No se proporcionó ningún archivo';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.uploadDesignImage(null as never, mockUploadData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid file type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      const errorMessage = 'Formato de archivo no soportado';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.uploadDesignImage(invalidFile, mockUploadData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle file too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      };

      const errorMessage = 'El archivo es demasiado grande';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.uploadDesignImage(largeFile, mockUploadData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should work without client parameter', async () => {
      const uploadDataWithoutClient = {
        name: 'Test Design',
        description: 'Test description',
      };

      const expectedResult = {
        url: 'https://cdn.example.com/certificates/design_images/general_2025/test-design_12345678.jpg',
        key: 'certificates/design_images/general_2025/test-design_12345678.jpg',
        originalName: 'test-design.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      };

      mockDesignImageService.uploadDesignImage.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.uploadDesignImage(
        mockFile,
        uploadDataWithoutClient,
      );

      expect(result).toEqual(expectedResult);
    });
  });
});
