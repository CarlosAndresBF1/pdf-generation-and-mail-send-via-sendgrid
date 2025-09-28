import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BulkUploadJob,
  BulkUploadJobStatus,
} from '../entities/bulk-upload-job.entity';
import { FileProcessingService } from '../../attendees/services/file-processing.service';
import { BulkUploadResponseDto } from '../../attendees/dto/bulk-upload-attendee.dto';

@Injectable()
export class BulkUploadJobsService {
  constructor(
    @InjectRepository(BulkUploadJob)
    private readonly bulkUploadJobRepository: Repository<BulkUploadJob>,
    private readonly fileProcessingService: FileProcessingService,
  ) {}

  async createJob(
    filename: string,
    userId: number,
    file: Express.Multer.File,
  ): Promise<BulkUploadJob> {
    const job = this.bulkUploadJobRepository.create({
      filename,
      userId,
      status: BulkUploadJobStatus.PENDING,
    });

    const savedJob = await this.bulkUploadJobRepository.save(job);

    // Procesar el archivo en segundo plano
    this.processFileAsync(savedJob.id, file).catch((error) => {
      console.error(`Error processing bulk upload job ${savedJob.id}:`, error);
    });

    return savedJob;
  }

  async findOne(id: number): Promise<BulkUploadJob> {
    const job = await this.bulkUploadJobRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Bulk upload job with ID ${id} not found`);
    }

    return job;
  }

  async findByUser(userId: number): Promise<BulkUploadJob[]> {
    return this.bulkUploadJobRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findCompleted(): Promise<BulkUploadJob[]> {
    return this.bulkUploadJobRepository.find({
      where: [
        { status: BulkUploadJobStatus.COMPLETED },
        { status: BulkUploadJobStatus.FAILED },
      ],
      order: { completedAt: 'DESC' },
    });
  }

  private async processFileAsync(
    jobId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      // Actualizar estado a procesando
      await this.bulkUploadJobRepository.update(jobId, {
        status: BulkUploadJobStatus.PROCESSING,
        startedAt: new Date(),
      });

      // Procesar el archivo
      const result: BulkUploadResponseDto =
        await this.fileProcessingService.processFile(file);

      // Actualizar con los resultados
      await this.bulkUploadJobRepository.update(jobId, {
        status: BulkUploadJobStatus.COMPLETED,
        completedAt: new Date(),
        totalRecords: result.totalRecords,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        certificatesAssociated: result.certificatesAssociated,
        errorDetails: JSON.stringify(result.errorDetails),
      });
    } catch (error) {
      // Actualizar con error
      await this.bulkUploadJobRepository.update(jobId, {
        status: BulkUploadJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
