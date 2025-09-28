import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { ExcelService } from '../../shared/services/excel.service';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let generatedCertificateRepository: Repository<GeneratedCertificate>;

  const mockGeneratedCertificates = [
    {
      id: 1,
      certificateId: 1,
      attendeeId: 1,
      s3Url: 'https://s3.amazonaws.com/cert1.pdf',
      generatedAt: new Date('2024-01-15'),
      isSent: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      job: null,
      attendee: {
        id: 1,
        fullName: 'John Doe',
        country: 'Colombia',
        email: 'john@example.com',
        documentType: 'CC',
        documentNumber: '12345678',
        gender: 'M',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      certificate: {
        id: 1,
        name: 'Test Certificate',
        client: 'Test Client',
        eventName: 'Test Event',
        baseDesignUrl: 'https://s3.amazonaws.com/template.jpg',
        pdfTemplate: 'template1',
        sendgridTemplateId: 'sg-123',
        eventLink: 'https://event.com',
        isActive: true,
        senderFromName: 'Test Sender',
        senderEmail: 'sender@test.com',
        emailSubject: 'Test Subject',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    },
    {
      id: 2,
      certificateId: 1,
      attendeeId: 2,
      s3Url: 'https://s3.amazonaws.com/cert2.pdf',
      generatedAt: new Date('2024-01-20'),
      isSent: false,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      job: null,
      attendee: {
        id: 2,
        fullName: 'Jane Smith',
        country: 'México',
        email: 'jane@example.com',
        documentType: 'PP',
        documentNumber: 'AB123456',
        gender: 'F',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      certificate: {
        id: 1,
        name: 'Test Certificate',
        client: 'Test Client',
        eventName: 'Test Event',
        baseDesignUrl: 'https://s3.amazonaws.com/template.jpg',
        pdfTemplate: 'template1',
        sendgridTemplateId: 'sg-123',
        eventLink: 'https://event.com',
        isActive: true,
        senderFromName: 'Test Sender',
        senderEmail: 'sender@test.com',
        emailSubject: 'Test Subject',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
    },
  ] as GeneratedCertificate[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        ExcelService,
        {
          provide: getRepositoryToken(GeneratedCertificate),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    generatedCertificateRepository = module.get<
      Repository<GeneratedCertificate>
    >(getRepositoryToken(GeneratedCertificate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCertificateReport', () => {
    it('should generate Excel report for certificate', async () => {
      jest
        .spyOn(generatedCertificateRepository, 'find')
        .mockResolvedValue(mockGeneratedCertificates);

      const result = await service.generateCertificateReport(1);

      expect(result).toBeInstanceOf(Buffer);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(generatedCertificateRepository.find).toHaveBeenCalledWith({
        where: { certificateId: 1 },
        relations: ['certificate', 'attendee'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw error if no certificates found', async () => {
      jest.spyOn(generatedCertificateRepository, 'find').mockResolvedValue([]);

      await expect(service.generateCertificateReport(999)).rejects.toThrow(
        'No se encontraron certificados generados para este ID',
      );
    });
  });

  describe('getCertificateStats', () => {
    it('should return certificate statistics', async () => {
      jest
        .spyOn(generatedCertificateRepository, 'find')
        .mockResolvedValue(mockGeneratedCertificates);

      const stats = await service.getCertificateStats(1);

      expect(stats).toEqual({
        totalGenerated: 2,
        totalSent: 1,
        totalPending: 1,
        successRate: 50,
        totalByCountry: {
          Colombia: 1,
          México: 1,
        },
        lastGenerated: new Date('2024-01-20'),
      });
    });

    it('should throw error if no certificates found for stats', async () => {
      jest.spyOn(generatedCertificateRepository, 'find').mockResolvedValue([]);

      await expect(service.getCertificateStats(999)).rejects.toThrow(
        'No se encontraron certificados generados para este ID',
      );
    });

    it('should handle empty country correctly', async () => {
      const certificatesWithoutCountry = [
        {
          ...mockGeneratedCertificates[0],
          attendee: {
            ...mockGeneratedCertificates[0].attendee,
            country: 'No especificado',
          },
        },
      ] as GeneratedCertificate[];

      jest
        .spyOn(generatedCertificateRepository, 'find')
        .mockResolvedValue(certificatesWithoutCountry);

      const stats = await service.getCertificateStats(1);

      expect(stats.totalByCountry).toEqual({
        'No especificado': 1,
      });
    });

    it('should calculate success rate correctly for 100% success', async () => {
      const allSentCertificates = mockGeneratedCertificates.map((cert) => ({
        ...cert,
        isSent: true,
      })) as GeneratedCertificate[];

      jest
        .spyOn(generatedCertificateRepository, 'find')
        .mockResolvedValue(allSentCertificates);

      const stats = await service.getCertificateStats(1);

      expect(stats.successRate).toBe(100);
      expect(stats.totalSent).toBe(2);
      expect(stats.totalPending).toBe(0);
    });

    it('should calculate success rate correctly for 0% success', async () => {
      const noSentCertificates = mockGeneratedCertificates.map((cert) => ({
        ...cert,
        isSent: false,
      })) as GeneratedCertificate[];

      jest
        .spyOn(generatedCertificateRepository, 'find')
        .mockResolvedValue(noSentCertificates);

      const stats = await service.getCertificateStats(1);

      expect(stats.successRate).toBe(0);
      expect(stats.totalSent).toBe(0);
      expect(stats.totalPending).toBe(2);
    });
  });
});
