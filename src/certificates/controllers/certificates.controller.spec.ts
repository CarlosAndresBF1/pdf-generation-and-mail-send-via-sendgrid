import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CertificatesController } from './certificates.controller';
import { CertificatesService } from '../services/certificates.service';
import { DesignImageService } from '../services/design-image.service';

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

    it('should upload design image successfully', async () => {
      const expectedResult = {
        url: 'https://cdn.example.com/certificates/design_images/design_12345678.jpg',
      };

      mockDesignImageService.uploadDesignImage.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.uploadDesignImage(mockFile);

      expect(result).toEqual(expectedResult);

      expect(mockDesignImageService.uploadDesignImage).toHaveBeenCalledWith(
        mockFile,
      );
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Error al subir la imagen';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(controller.uploadDesignImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockDesignImageService.uploadDesignImage).toHaveBeenCalledWith(
        mockFile,
      );
    });

    it('should handle missing file', async () => {
      const errorMessage = 'No se proporcionó ningún archivo';
      mockDesignImageService.uploadDesignImage.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(controller.uploadDesignImage(null as never)).rejects.toThrow(
        BadRequestException,
      );
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

      await expect(controller.uploadDesignImage(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
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

      await expect(controller.uploadDesignImage(largeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should work without client parameter', async () => {
      const expectedResult = {
        url: 'https://cdn.example.com/certificates/design_images/design_12345678.jpg',
      };

      mockDesignImageService.uploadDesignImage.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.uploadDesignImage(mockFile);

      expect(result).toEqual(expectedResult);
    });
  });
});
