import { Test, TestingModule } from '@nestjs/testing';
import {
  PdfGeneratorService,
  CertificateData,
} from '../../src/shared/services/pdf-generator.service';
import * as fs from 'fs/promises';

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGeneratorService],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate PDF buffer from certificate data', async () => {
    const certificateData: CertificateData = {
      fullName: 'John Doe',
      certificateName: 'Test Certificate',
      eventName: 'Test Event',
      baseDesignUrl: 'https://example.com/background.jpg',
      country: 'Colombia',
      documentType: 'CC',
      documentNumber: '12345678',
    };

    const pdfBuffer = await service.generateCertificatePdf(certificateData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check if PDF starts with PDF header
    const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  }, 30000); // Increased timeout for PDF generation
});
