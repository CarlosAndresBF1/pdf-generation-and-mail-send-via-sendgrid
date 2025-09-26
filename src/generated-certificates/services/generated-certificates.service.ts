import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedCertificate } from '../entities/generated-certificate.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Job, JobStatus } from '../../jobs/entities/job.entity';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { S3Service } from '../../shared/services/s3.service';
import { EmailService } from '../../shared/services/email.service';
import { GenerateCertificatesDto } from '../dto/generate-certificates.dto';

@Injectable()
export class GeneratedCertificatesService {
  constructor(
    @InjectRepository(GeneratedCertificate)
    private readonly generatedCertificateRepository: Repository<GeneratedCertificate>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
  ) {}

  async findAll(): Promise<GeneratedCertificate[]> {
    return await this.generatedCertificateRepository.find({
      relations: ['certificate', 'attendee'],
      order: { generatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<GeneratedCertificate> {
    const generatedCert = await this.generatedCertificateRepository.findOne({
      where: { id },
      relations: ['certificate', 'attendee'],
    });

    if (!generatedCert) {
      throw new NotFoundException('Generated certificate not found');
    }

    return generatedCert;
  }

  async remove(id: number): Promise<void> {
    const generatedCert = await this.findOne(id);
    await this.generatedCertificateRepository.remove(generatedCert);
  }

  async generateCertificates(
    dto: GenerateCertificatesDto,
  ): Promise<GeneratedCertificate[]> {
    const certificate = await this.certificateRepository.findOne({
      where: { id: dto.certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate configuration not found');
    }

    const attendees = await this.attendeeRepository.findByIds(dto.attendeeIds);

    if (attendees.length !== dto.attendeeIds.length) {
      throw new NotFoundException('Some attendees not found');
    }

    const results: GeneratedCertificate[] = [];

    for (const attendee of attendees) {
      try {
        // Check if certificate already exists
        const existing = await this.generatedCertificateRepository.findOne({
          where: {
            certificateId: certificate.id,
            attendeeId: attendee.id,
          },
        });

        if (existing) {
          results.push(existing);
          continue;
        }

        // Generate PDF
        const certificateData = {
          fullName: attendee.fullName,
          certificateName: certificate.name,
          eventName: certificate.eventName,
          baseDesignUrl: certificate.baseDesignUrl,
          country: attendee.country || '',
          documentType: attendee.documentType || '',
          documentNumber: attendee.documentNumber || '',
        };

        const pdfBuffer = await this.pdfGeneratorService.generateCertificatePdf(
          certificateData,
          certificate.pdfTemplate,
        );

        // Upload to S3
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

        // Save to database
        const generatedCertificate = this.generatedCertificateRepository.create(
          {
            certificateId: certificate.id,
            attendeeId: attendee.id,
            s3Url,
            generatedAt: new Date(),
            isSent: false,
          },
        );

        const saved =
          await this.generatedCertificateRepository.save(generatedCertificate);

        // Create job for email sending if requested
        if (dto.sendEmails) {
          await this.createEmailJob(saved.id);
        }

        results.push(saved);
      } catch (error) {
        console.error('Error generating certificate:', error);
      }
    }

    return results;
  }

  async sendCertificateEmails(ids: number[]): Promise<{
    success: boolean;
    data: {
      jobsCreated: number;
      jobsSkipped: number;
      totalRequested: number;
    };
    message: string;
  }> {
    let jobsCreated = 0;
    let jobsSkipped = 0;

    for (const id of ids) {
      // Check if certificate exists
      const certificate = await this.generatedCertificateRepository.findOne({
        where: { id },
      });

      if (!certificate) {
        jobsSkipped++;
        continue;
      }

      // Check if job already exists for this certificate
      const existingJob = await this.jobRepository.findOne({
        where: { generatedCertificateId: id },
      });

      if (existingJob) {
        jobsSkipped++;
        continue;
      }

      // Create new job
      await this.createEmailJob(id);
      jobsCreated++;
    }

    return {
      success: true,
      data: {
        jobsCreated,
        jobsSkipped,
        totalRequested: ids.length,
      },
      message: `Email jobs processed: ${jobsCreated} created, ${jobsSkipped} skipped`,
    };
  }

  private async createEmailJob(generatedCertificateId: number): Promise<Job> {
    const job = this.jobRepository.create({
      generatedCertificateId,
      status: JobStatus.PENDING,
    });

    return await this.jobRepository.save(job);
  }

  async regenerateCertificatePdf(id: number): Promise<Buffer> {
    const generatedCert = await this.generatedCertificateRepository.findOne({
      where: { id },
      relations: ['certificate', 'attendee'],
    });

    if (!generatedCert) {
      throw new NotFoundException('Generated certificate not found');
    }

    const certificateData = {
      fullName: generatedCert.attendee.fullName,
      certificateName: generatedCert.certificate.name,
      eventName: generatedCert.certificate.eventName,
      baseDesignUrl: generatedCert.certificate.baseDesignUrl,
      country: generatedCert.attendee.country || '',
      documentType: generatedCert.attendee.documentType || '',
      documentNumber: generatedCert.attendee.documentNumber || '',
    };

    return await this.pdfGeneratorService.generateCertificatePdf(
      certificateData,
    );
  }

  async processPendingCertificates(): Promise<{
    success: boolean;
    data: {
      totalCertificates: number;
      jobsCreated: number;
      alreadyProcessed: number;
    };
    message: string;
  }> {
    // Get all generated certificates that don't have an associated job
    const certificatesWithoutJobs = await this.generatedCertificateRepository
      .createQueryBuilder('gc')
      .leftJoin('jobs', 'j', 'j.generated_certificate_id = gc.id')
      .where('j.id IS NULL')
      .getMany();

    let jobsCreated = 0;
    let alreadyProcessed = 0;

    // Create jobs for certificates without jobs
    for (const certificate of certificatesWithoutJobs) {
      // Double-check that no job exists (race condition protection)
      const existingJob = await this.jobRepository.findOne({
        where: { generatedCertificateId: certificate.id },
      });

      if (existingJob) {
        alreadyProcessed++;
        continue;
      }

      // Create new job
      await this.createEmailJob(certificate.id);
      jobsCreated++;
    }

    return {
      success: true,
      data: {
        totalCertificates: certificatesWithoutJobs.length,
        jobsCreated,
        alreadyProcessed,
      },
      message: `Processed pending certificates: ${jobsCreated} jobs created, ${alreadyProcessed} already had jobs`,
    };
  }

  /**
   * Procesa certificados pendientes en lotes para evitar timeouts
   * Usado por el job cron para procesar miles de registros
   */
  async processPendingCertificatesBatch(batchSize: number = 50): Promise<{
    success: boolean;
    data: {
      totalCertificates: number;
      jobsCreated: number;
      alreadyProcessed: number;
    };
    message: string;
  }> {
    // Get a limited batch of certificates that don't have an associated job
    const certificatesWithoutJobs = await this.generatedCertificateRepository
      .createQueryBuilder('gc')
      .leftJoin('jobs', 'j', 'j.generated_certificate_id = gc.id')
      .where('j.id IS NULL')
      .limit(batchSize)
      .getMany();

    let jobsCreated = 0;
    let alreadyProcessed = 0;

    // Create jobs for certificates without jobs
    for (const certificate of certificatesWithoutJobs) {
      try {
        // Double-check that no job exists (race condition protection)
        const existingJob = await this.jobRepository.findOne({
          where: { generatedCertificateId: certificate.id },
        });

        if (existingJob) {
          alreadyProcessed++;
          continue;
        }

        // Create new job
        await this.createEmailJob(certificate.id);
        jobsCreated++;
      } catch (error) {
        console.error(
          `Error creating job for certificate ${certificate.id}:`,
          error,
        );
        // Continue processing other certificates even if one fails
      }
    }

    return {
      success: true,
      data: {
        totalCertificates: certificatesWithoutJobs.length,
        jobsCreated,
        alreadyProcessed,
      },
      message: `Processed batch: ${jobsCreated} jobs created, ${alreadyProcessed} already had jobs`,
    };
  }
}
