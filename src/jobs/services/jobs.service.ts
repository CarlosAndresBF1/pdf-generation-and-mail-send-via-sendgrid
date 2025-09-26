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
      take: 200,
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

      let pdfBuffer: Buffer;
      let s3Url: string;

      try {
        // Generar PDF usando el método unificado
        pdfBuffer =
          await this.generateCertificatePdfBuffer(generatedCertificate);

        // Subir PDF a S3 usando la misma lógica que el proceso inicial
        const s3Key = this.s3Service.generateCertificateKey(
          certificate.client,
          new Date().getFullYear(),
          certificate.id,
          certificate.name,
          attendee.fullName,
        );

        s3Url = await this.s3Service.uploadFile(
          s3Key,
          pdfBuffer,
          'application/pdf',
        );

        // Actualizar la URL de S3 en el certificado generado
        generatedCertificate.s3Url = s3Url;
      } catch (pdfError) {
        console.error(
          `❌ PDF generation failed for certificate ${generatedCertificate.id}:`,
          pdfError,
        );

        // Mark job as error specifically for PDF generation failure
        job.status = JobStatus.ERROR;
        job.errorMessage = `PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`;

        await this.jobRepository.save(job);
        return; // Exit early - do not attempt to send email
      }

      try {
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

        // Update job status only if email was sent successfully
        job.status = JobStatus.SENT;
        generatedCertificate.isSent = true;

        // Save both job and generated certificate
        await Promise.all([
          this.jobRepository.save(job),
          this.generatedCertificateRepository.save(generatedCertificate),
        ]);
      } catch (emailError) {
        console.error(
          `❌ Email sending failed for certificate ${generatedCertificate.id}:`,
          emailError,
        );

        // Mark job as error specifically for email sending failure
        // Note: PDF was generated successfully, so S3 URL is preserved
        job.status = JobStatus.ERROR;
        job.errorMessage = `Email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown email error'}`;

        await this.jobRepository.save(job);
        return;
      }
    } catch (error) {
      console.error(`❌ Unexpected error processing job ${job.id}:`, error);

      // Update job with general error
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

  /**
   * Audita los jobs marcados como SENT vs archivos reales en S3
   * Identifica correos que se enviaron sin adjunto PDF
   */
  async auditJobsVsS3(): Promise<{
    totalSentJobs: number;
    jobsWithValidPdfs: number;
    jobsWithMissingPdfs: number;
    missingPdfJobs: Array<{
      jobId: number;
      certificateId: number;
      attendeeName: string;
      attendeeEmail: string;
      s3Url: string;
      s3Key: string;
      attemptedAt: Date;
    }>;
  }> {
    // Get all jobs marked as SENT
    const sentJobs = await this.jobRepository.find({
      where: { status: JobStatus.SENT },
      relations: ['generatedCertificate', 'generatedCertificate.attendee'],
    });

    let jobsWithValidPdfs = 0;
    const missingPdfJobs: Array<{
      jobId: number;
      certificateId: number;
      attendeeName: string;
      attendeeEmail: string;
      s3Url: string;
      s3Key: string;
      attemptedAt: Date;
    }> = [];

    // Check each SENT job to see if its PDF exists in S3
    for (const job of sentJobs) {
      const { generatedCertificate } = job;
      if (!generatedCertificate || !generatedCertificate.s3Url) {
        console.log(`⚠️  Job ${job.id} has no S3 URL`);
        continue;
      }

      const s3Key = this.s3Service.extractKeyFromUrl(
        generatedCertificate.s3Url,
      );

      try {
        const fileExists = await this.s3Service.fileExists(s3Key);

        if (fileExists) {
          jobsWithValidPdfs++;
        } else {
          console.log(
            `❌ Missing PDF for job ${job.id}: ${generatedCertificate.attendee.fullName}`,
          );
          missingPdfJobs.push({
            jobId: job.id,
            certificateId: generatedCertificate.certificateId,
            attendeeName: generatedCertificate.attendee.fullName,
            attendeeEmail: generatedCertificate.attendee.email,
            s3Url: generatedCertificate.s3Url,
            s3Key,
            attemptedAt: job.attemptedAt || new Date(),
          });
        }
      } catch (error) {
        console.error(`Error checking S3 file for job ${job.id}:`, error);
        missingPdfJobs.push({
          jobId: job.id,
          certificateId: generatedCertificate.certificateId,
          attendeeName: generatedCertificate.attendee.fullName,
          attendeeEmail: generatedCertificate.attendee.email,
          s3Url: generatedCertificate.s3Url,
          s3Key,
          attemptedAt: job.attemptedAt || new Date(),
        });
      }
    }

    return {
      totalSentJobs: sentJobs.length,
      jobsWithValidPdfs,
      jobsWithMissingPdfs: missingPdfJobs.length,
      missingPdfJobs,
    };
  }

  /**
   * Reprocesa jobs que se enviaron sin PDF adjunto
   * Marca los jobs como PENDING para que se procesen nuevamente
   */
  async retryJobsWithMissingPdfs(jobIds: number[]): Promise<{
    success: boolean;
    retriedJobs: number;
    skippedJobs: number;
    message: string;
  }> {
    let retriedJobs = 0;
    let skippedJobs = 0;

    for (const jobId of jobIds) {
      try {
        const job = await this.jobRepository.findOne({
          where: { id: jobId, status: JobStatus.SENT },
          relations: ['generatedCertificate'],
        });

        if (!job) {
          console.log(`⚠️  Job ${jobId} not found or not SENT`);
          skippedJobs++;
          continue;
        }

        // Reset job to PENDING status
        job.status = JobStatus.PENDING;
        job.errorMessage = undefined;
        job.attemptedAt = undefined;

        // Mark the generated certificate as not sent
        if (job.generatedCertificate) {
          job.generatedCertificate.isSent = false;
          await this.generatedCertificateRepository.save(
            job.generatedCertificate,
          );
        }

        await this.jobRepository.save(job);
        retriedJobs++;
      } catch (error) {
        console.error(`❌ Error retrying job ${jobId}:`, error);
        skippedJobs++;
      }
    }

    const message = `Retry completed: ${retriedJobs} jobs reset to PENDING, ${skippedJobs} skipped`;
    console.log(`${message}`);

    return {
      success: true,
      retriedJobs,
      skippedJobs,
      message,
    };
  }
}
