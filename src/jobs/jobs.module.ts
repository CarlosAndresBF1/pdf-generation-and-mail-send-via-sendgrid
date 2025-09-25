import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { GeneratedCertificate } from '../generated-certificates/entities/generated-certificate.entity';
import { JobsService } from './services/jobs.service';
import { JobSchedulerService } from './services/job-scheduler.service';
import { JobsController } from './controllers/jobs.controller';
import { EmailService } from '../shared/services/email.service';
import { S3Service } from '../shared/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, GeneratedCertificate])],
  controllers: [JobsController],
  providers: [JobsService, JobSchedulerService, EmailService, S3Service],
  exports: [JobsService, JobSchedulerService],
})
export class JobsModule {}
