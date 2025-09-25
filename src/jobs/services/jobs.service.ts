import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../entities/job.entity';
import { EmailService } from '../../shared/services/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

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

      // For now, we'll generate a fresh PDF instead of downloading from S3
      // In production, you might want to download from S3 or cache the buffer
      const pdfBuffer = Buffer.from('PDF content would be here'); // Placeholder

      // Prepare email data
      const downloadLink = `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/certificate/${generatedCertificate.id}/download`;

      // Send email
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
      );

      // Update job status
      job.status = JobStatus.SENT;
      generatedCertificate.isSent = true;

      await this.jobRepository.save(job);
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

  async retryJob(id: number): Promise<Job> {
    const job = await this.findOne(id);

    // Reset job status to pending
    job.status = JobStatus.PENDING;
    job.errorMessage = undefined;
    job.attemptedAt = undefined;

    return await this.jobRepository.save(job);
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
