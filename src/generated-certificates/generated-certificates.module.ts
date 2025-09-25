import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedCertificate } from './entities/generated-certificate.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Job } from '../jobs/entities/job.entity';
import { GeneratedCertificatesService } from './services/generated-certificates.service';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';
import { S3Service } from '../shared/services/s3.service';
import { EmailService } from '../shared/services/email.service';
import { JobsService } from '../jobs/services/jobs.service';
import {
  GeneratedCertificatesController,
  PublicCertificateController,
} from './controllers/generated-certificates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneratedCertificate,
      Certificate,
      Attendee,
      Job,
    ]),
  ],
  controllers: [GeneratedCertificatesController, PublicCertificateController],
  providers: [
    GeneratedCertificatesService,
    PdfGeneratorService,
    S3Service,
    EmailService,
    JobsService,
  ],
  exports: [GeneratedCertificatesService, PdfGeneratorService, S3Service],
})
export class GeneratedCertificatesModule {}
