import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { FileProcessingService } from './file-processing.service';
import { Attendee } from '../entities/attendee.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';

describe('FileProcessingService', () => {
  let service: FileProcessingService;

  const mockAttendeeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockCertificateRepository = {
    find: jest.fn(),
  };

  const mockGeneratedCertificateRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingService,
        {
          provide: getRepositoryToken(Attendee),
          useValue: mockAttendeeRepository,
        },
        {
          provide: getRepositoryToken(Certificate),
          useValue: mockCertificateRepository,
        },
        {
          provide: getRepositoryToken(GeneratedCertificate),
          useValue: mockGeneratedCertificateRepository,
        },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processFile', () => {
    it('should throw BadRequestException when file is not provided', async () => {
      await expect(service.processFile(null as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unsupported file format', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(service.processFile(mockFile)).rejects.toThrow(
        'Formato de archivo no soportado. Use CSV, XLS o XLSX',
      );
    });

    it('should process CSV file successfully', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender
Juan Pérez,juan@example.com,Colombia,CC,12345678,M`;

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from(csvContent),
      } as Express.Multer.File;

      // Mock repositories
      mockCertificateRepository.find.mockResolvedValue([]);
      mockAttendeeRepository.findOne.mockResolvedValue(null);
      mockAttendeeRepository.create.mockReturnValue({
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        country: 'Colombia',
        documentType: 'CC',
        documentNumber: '12345678',
        gender: 'M',
      });
      mockAttendeeRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockAttendeeRepository.create).toHaveBeenCalled();
      expect(mockAttendeeRepository.save).toHaveBeenCalled();
    });

    it('should use existing attendee without updating', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender
Juan Pérez,juan@example.com,Colombia,CC,12345678,M`;

      const mockFile = {
        buffer: Buffer.from(csvContent),
        originalname: 'test.csv',
        mimetype: 'text/csv',
      } as Express.Multer.File;

      // Mock existing attendee
      mockAttendeeRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'juan@example.com',
      });

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockAttendeeRepository.save).not.toHaveBeenCalled();
      expect(mockAttendeeRepository.update).not.toHaveBeenCalled();
    });

    it('should create new attendee when not exists', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender
Juan Pérez Nuevo,juan.nuevo@example.com,Colombia,CC,87654321,M`;

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from(csvContent),
      } as Express.Multer.File;

      // Mock no existing attendee
      mockCertificateRepository.find.mockResolvedValue([]);
      mockAttendeeRepository.findOne.mockResolvedValue(null);
      mockAttendeeRepository.create.mockReturnValue({
        id: 2,
        email: 'juan.nuevo@example.com',
      });
      mockAttendeeRepository.save.mockResolvedValue({
        id: 2,
        email: 'juan.nuevo@example.com',
      });

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockAttendeeRepository.create).toHaveBeenCalled();
      expect(mockAttendeeRepository.save).toHaveBeenCalled();
    });

    it('should create certificate association when certificate_id is provided', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender,certificateId
Juan Pérez,juan@example.com,Colombia,CC,12345678,M,1`;

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from(csvContent),
      } as Express.Multer.File;

      // Mock repositories
      mockCertificateRepository.find.mockResolvedValue([{ id: 1 }]);
      mockAttendeeRepository.findOne.mockResolvedValue(null);

      const mockAttendee = {
        id: 1,
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        country: 'Colombia',
        documentType: 'CC',
        documentNumber: '12345678',
        gender: 'M',
      };

      mockAttendeeRepository.create.mockReturnValue(mockAttendee);
      mockAttendeeRepository.save.mockResolvedValue(mockAttendee);
      mockGeneratedCertificateRepository.findOne.mockResolvedValue(null);
      mockGeneratedCertificateRepository.create.mockReturnValue({
        certificateId: 1,
        attendeeId: 1,
        s3Url: '',
        generatedAt: new Date(),
        isSent: false,
      });
      mockGeneratedCertificateRepository.save.mockResolvedValue(undefined);

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(1);
      expect(result.certificatesAssociated).toBe(1);
      expect(mockGeneratedCertificateRepository.create).toHaveBeenCalledWith({
        certificateId: 1,
        attendeeId: 1,
        s3Url: '',
        generatedAt: expect.any(Date) as Date,
        isSent: false,
      });
    });

    it('should handle validation errors correctly', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender
,invalid-email,Colombia,CC,12345678,M`;

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from(csvContent),
      } as Express.Multer.File;

      mockCertificateRepository.find.mockResolvedValue([]);

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
      expect(result.errorDetails[0].row).toBe(2);
    });

    it('should handle invalid certificate_id', async () => {
      const csvContent = `fullName,email,country,documentType,documentNumber,gender,certificateId
Juan Pérez,juan@example.com,Colombia,CC,12345678,M,999`;

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from(csvContent),
      } as Express.Multer.File;

      // Mock only certificate ID 1 exists, not 999
      mockCertificateRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.processFile(mockFile);

      expect(result.totalRecords).toBe(1);
      expect(result.created).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorDetails[0].errors).toContain(
        'Certificate ID 999 no existe',
      );
    });
  });

  describe('normalizeColumnName', () => {
    it('should normalize column names correctly', () => {
      // Access private method through service instance
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const normalizeColumnName = (service as any).normalizeColumnName as (
        column: string,
      ) => string;

      expect(normalizeColumnName('Nombre Completo')).toBe('fullName');
      expect(normalizeColumnName('FULL_NAME')).toBe('fullName');
      expect(normalizeColumnName('email')).toBe('email');
      expect(normalizeColumnName('País')).toBe('country');
      expect(normalizeColumnName('certificate_id')).toBe('certificateId');
      expect(normalizeColumnName('unknown_column')).toBe('unknown_column');
    });
  });
});
