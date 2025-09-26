import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../entities/job.entity';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';
import { EmailService } from '../../shared/services/email.service';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { S3Service } from '../../shared/services/s3.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(GeneratedCertificate)
    private readonly generatedCertificateRepository: Repository<GeneratedCertificate>,
    private readonly emailService: EmailService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Método unificado para generar PDFs de certificados
   * Utiliza los mismos parámetros tanto para tests como para jobs
   */
  private async generateCertificatePdfBuffer(
    generatedCertificate: GeneratedCertificate,
  ): Promise<Buffer> {
    const { certificate, attendee } = generatedCertificate;

    // Crear datos para el PDF con la misma estructura que usa el test
    const certificateData = {
      fullName: attendee.fullName,
      certificateName: certificate.name,
      eventName: certificate.eventName,
      baseDesignUrl: certificate.baseDesignUrl,
      country: attendee.country,
      documentType: attendee.documentType,
      documentNumber: attendee.documentNumber,
    };

    // Generar PDF usando el mismo servicio que el test
    return await this.pdfGeneratorService.generateCertificatePdf(
      certificateData,
      certificate.pdfTemplate,
    );
  }

  async processPendingJobs(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pendingJobs = await this.jobRepository.find({
      where: { status: JobStatus.PENDING },
      relations: [
        'generatedCertificate',
        'generatedCertificate.certificate',
        'generatedCertificate.attendee',
      ],
      take: 10, // Process max 10 jobs at a time
    });

    let successful = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      try {
        await this.processJob(job);
        successful++;
      } catch (error) {
        failed++;
        console.error(`Job ${job.id} processing failed:`, error);
      }
    }

    return {
      processed: pendingJobs.length,
      successful,
      failed,
    };
  }

  private async processJob(job: Job): Promise<void> {
    try {
      // Update job status to processing
      job.attemptedAt = new Date();
      await this.jobRepository.save(job);

      const { generatedCertificate } = job;
      const { certificate, attendee } = generatedCertificate;

      // Generar PDF usando el método unificado
      const pdfBuffer =
        await this.generateCertificatePdfBuffer(generatedCertificate);

      // Subir PDF a S3 usando la misma lógica que el proceso inicial
      const s3Key = this.s3Service.generateCertificateKey(
        certificate.client,
        new Date().getFullYear(),
        certificate.id,
        certificate.name,
        attendee.fullName,
      );

      const s3Url = await this.s3Service.uploadFile(
        s3Key,
        pdfBuffer,
        'application/pdf',
      );

      // Actualizar la URL de S3 en el certificado generado
      generatedCertificate.s3Url = s3Url;

      // Prepare email data
      const downloadLink = `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/certificate/${generatedCertificate.id}/download`;

      // Send email with custom sender from certificate
      await this.emailService.sendCertificateEmail(
        attendee.email,
        attendee.fullName,
        certificate.name,
        certificate.eventName,
        certificate.eventLink,
        downloadLink,
        certificate.sendgridTemplateId,
        pdfBuffer,
        `${attendee.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_certificate.pdf`,
        certificate.senderEmail, // Custom sender email from certificate
        certificate.emailSubject, // Custom subject from certificate
        certificate.senderFromName, // Custom sender name from certificate
      );

      // Update job status
      job.status = JobStatus.SENT;
      generatedCertificate.isSent = true;

      // Save both job and generated certificate
      await Promise.all([
        this.jobRepository.save(job),
        this.generatedCertificateRepository.save(generatedCertificate),
      ]);
      console.log(
        `Email sent successfully for certificate ${generatedCertificate.id}`,
      );
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);

      // Update job with error
      job.status = JobStatus.ERROR;
      job.errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await this.jobRepository.save(job);
    }
  }

  async getJobStats(): Promise<{
    pending: number;
    sent: number;
    error: number;
    total: number;
    successRate: number;
  }> {
    const [pending, sent, error, total] = await Promise.all([
      this.jobRepository.count({ where: { status: JobStatus.PENDING } }),
      this.jobRepository.count({ where: { status: JobStatus.SENT } }),
      this.jobRepository.count({ where: { status: JobStatus.ERROR } }),
      this.jobRepository.count(),
    ]);

    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return { pending, sent, error, total, successRate };
  }

  async findAll(): Promise<Job[]> {
    return await this.jobRepository.find({
      relations: [
        'generatedCertificate',
        'generatedCertificate.certificate',
        'generatedCertificate.attendee',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingJobs(): Promise<Job[]> {
    return await this.jobRepository.find({
      where: { status: JobStatus.PENDING },
      relations: [
        'generatedCertificate',
        'generatedCertificate.certificate',
        'generatedCertificate.attendee',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: [
        'generatedCertificate',
        'generatedCertificate.certificate',
        'generatedCertificate.attendee',
      ],
    });

    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    return job;
  }

  async retryJob(id: number): Promise<{ message: string }> {
    const job = await this.findOne(id);

    // Reset job status to pending
    job.status = JobStatus.PENDING;
    job.errorMessage = undefined;
    job.attemptedAt = undefined;

    await this.jobRepository.save(job);

    return {
      message: `Job ${id} has been reset to pending status for retry`,
    };
  }

  async retryFailedJobs(): Promise<void> {
    await this.jobRepository.update(
      { status: JobStatus.ERROR },
      {
        status: JobStatus.PENDING,
        errorMessage: undefined,
        attemptedAt: undefined,
      },
    );
  }
}
