import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../entities/certificate.entity';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';
import {
  TestCertificateDto,
  TestCertificateResponseDto,
} from '../dto/test-certificate.dto';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    const certificate = this.certificateRepository.create(createCertificateDto);
    return await this.certificateRepository.save(certificate);
  }

  async findAll(): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Certificate> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    return certificate;
  }

  async findByClient(client: string): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      where: { client },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateCertificateDto: UpdateCertificateDto,
  ): Promise<Certificate> {
    await this.findOne(id); // Verify exists
    await this.certificateRepository.update(id, updateCertificateDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const certificate = await this.findOne(id);
    await this.certificateRepository.remove(certificate);
  }

  async toggleActive(id: number): Promise<Certificate> {
    const certificate = await this.findOne(id);
    certificate.isActive = !certificate.isActive;
    return await this.certificateRepository.save(certificate);
  }

  async generateAndSendTestCertificate(
    testCertificateDto: TestCertificateDto,
  ): Promise<TestCertificateResponseDto> {
    const { certificateId, fullName, documentNumber, email } =
      testCertificateDto;

    // Verificar que existe la configuración del certificado
    const certificate = await this.findOne(certificateId);

    // Crear datos para el PDF (sin almacenar en BD)
    const certificateData = {
      fullName,
      certificateName: certificate.name,
      eventName: certificate.eventName,
      baseDesignUrl: certificate.baseDesignUrl,
      country: 'Test',
      documentType: 'Test',
      documentNumber,
    };

    // Generar PDF usando el servicio de PDF generator directamente
    const pdfBuffer =
      await this.pdfGeneratorService.generateCertificatePdf(certificateData);

    // Generar nombre del archivo PDF
    const pdfFilename = `${certificate.client}_${fullName.replace(/\s+/g, '_')}_certificate.pdf`;

    // Enviar email con el PDF como adjunto
    await this.emailService.sendCertificateEmail(
      email,
      fullName,
      certificate.name,
      certificate.eventName,
      certificate.eventLink,
      '#', // Download link placeholder para certificado de prueba
      certificate.sendgridTemplateId,
      pdfBuffer,
      pdfFilename,
    );

    return {
      message: `Certificado de prueba enviado exitosamente a ${email}`,
      email,
      certificateId,
      sentAt: new Date(),
    };
  }
}
