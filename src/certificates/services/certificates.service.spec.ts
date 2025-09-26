import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { CertificatesService } from './certificates.service';
import { Certificate } from '../entities/certificate.entity';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { EmailService } from '../../shared/services/email.service';
import { TestCertificateDto } from '../dto/test-certificate.dto';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certificateRepository: Repository<Certificate>;
  let pdfGeneratorService: PdfGeneratorService;
  let emailService: EmailService;

  const mockCertificateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPdfGeneratorService = {
    generateCertificatePdf: jest.fn(),
  };

  const mockEmailService = {
    sendCertificateEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: getRepositoryToken(Certificate),
          useValue: mockCertificateRepository,
        },
        {
          provide: PdfGeneratorService,
          useValue: mockPdfGeneratorService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    certificateRepository = module.get<Repository<Certificate>>(
      getRepositoryToken(Certificate),
    );
    pdfGeneratorService = module.get<PdfGeneratorService>(PdfGeneratorService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAndSendTestCertificate', () => {
    const mockCertificate = {
      id: 1,
      client: 'TestClient',
      name: 'Test Certificate',
      eventName: 'Test Event',
      baseDesignUrl: 'https://example.com/design.jpg',
      pdfTemplate: 'summit-2025-template-17',
      senderFromName: 'Test Team',
      sendgridTemplateId: 'template-123',
      eventLink: 'https://example.com/event',
      senderEmail: 'admin@testclient.com',
      emailSubject: '📧 Test Certificate Subject',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testCertificateDto: TestCertificateDto = {
      certificateId: 1,
      fullName: 'Juan Carlos Pérez',
      documentType: 'CC',
      documentNumber: '12345678',
      email: 'juan@example.com',
    };

    beforeEach(() => {
      mockCertificateRepository.findOne.mockResolvedValue(mockCertificate);
      mockPdfGeneratorService.generateCertificatePdf.mockResolvedValue(
        Buffer.from('mock-pdf'),
      );
      mockEmailService.sendCertificateEmail.mockResolvedValue(undefined);
    });

    it('should generate and send test certificate successfully', async () => {
      const result =
        await service.generateAndSendTestCertificate(testCertificateDto);

      expect(mockCertificateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(
        mockPdfGeneratorService.generateCertificatePdf,
      ).toHaveBeenCalledWith(
        {
          fullName: 'Juan Carlos Pérez',
          certificateName: 'Test Certificate',
          eventName: 'Test Event',
          baseDesignUrl: 'https://example.com/design.jpg',
          country: 'Test',
          documentType: 'CC',
          documentNumber: '12345678',
        },
        'summit-2025-template-17',
      );

      expect(mockEmailService.sendCertificateEmail).toHaveBeenCalledWith(
        'juan@example.com',
        'Juan Carlos Pérez',
        'Test Certificate',
        'Test Event',
        'https://example.com/event',
        '#',
        'template-123',
        Buffer.from('mock-pdf'),
        'TestClient_Juan_Carlos_Pérez_certificate.pdf',
        'admin@testclient.com',
        '📧 Test Certificate Subject',
        'Test Team',
      );

      expect(result).toEqual({
        message:
          'Certificado de prueba enviado exitosamente a juan@example.com',
        email: 'juan@example.com',
        certificateId: 1,
        sentAt: expect.any(Date) as Date,
      });
    });

    it('should throw NotFoundException when certificate does not exist', async () => {
      mockCertificateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generateAndSendTestCertificate(testCertificateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle PDF generation error', async () => {
      mockPdfGeneratorService.generateCertificatePdf.mockRejectedValue(
        new Error('PDF generation failed'),
      );

      await expect(
        service.generateAndSendTestCertificate(testCertificateDto),
      ).rejects.toThrow('PDF generation failed');
    });

    it('should handle email sending error', async () => {
      mockEmailService.sendCertificateEmail.mockRejectedValue(
        new Error('Email sending failed'),
      );

      await expect(
        service.generateAndSendTestCertificate(testCertificateDto),
      ).rejects.toThrow('Email sending failed');
    });
  });
});
