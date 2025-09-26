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
    generateAndSendTestCertificate: jest.fn(),
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

  describe('sendTestCertificate', () => {
    const testCertificateDto = {
      certificateId: 1,
      fullName: 'Juan Carlos Pérez',
      documentType: 'CC',
      documentNumber: '12345678',
      email: 'juan@example.com',
    };

    const expectedResponse = {
      message: 'Certificado de prueba enviado exitosamente a juan@example.com',
      email: 'juan@example.com',
      certificateId: 1,
      sentAt: new Date(),
    };

    it('should send test certificate successfully', async () => {
      mockCertificatesService.generateAndSendTestCertificate.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.sendTestCertificate(testCertificateDto);

      expect(result).toEqual(expectedResponse);
      expect(
        mockCertificatesService.generateAndSendTestCertificate,
      ).toHaveBeenCalledWith(testCertificateDto);
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Certificate not found';
      mockCertificatesService.generateAndSendTestCertificate.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.sendTestCertificate(testCertificateDto),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockCertificatesService.generateAndSendTestCertificate,
      ).toHaveBeenCalledWith(testCertificateDto);
    });
  });
});
