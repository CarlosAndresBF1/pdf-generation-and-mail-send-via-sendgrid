import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { BulkUploadJob } from './entities/bulk-upload-job.entity';
import { GeneratedCertificate } from '../generated-certificates/entities/generated-certificate.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { JobsService } from './services/jobs.service';
import { JobSchedulerService } from './services/job-scheduler.service';
import { BulkUploadJobsService } from './services/bulk-upload-jobs.service';
import { JobsController } from './controllers/jobs.controller';
import { FileProcessingService } from '../attendees/services/file-processing.service';
import { EmailService } from '../shared/services/email.service';
import { S3Service } from '../shared/services/s3.service';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      BulkUploadJob,
      GeneratedCertificate,
      Attendee,
      Certificate,
    ]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobSchedulerService,
    BulkUploadJobsService,
    FileProcessingService,
    EmailService,
    S3Service,
    PdfGeneratorService,
  ],
  exports: [JobsService, JobSchedulerService, BulkUploadJobsService],
})
export class JobsModule {}
