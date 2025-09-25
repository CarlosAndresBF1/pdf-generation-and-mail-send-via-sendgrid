import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from '../entities/attendee.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';
import { AttendeesService } from '../services/attendees.service';
import { FileProcessingService } from '../services/file-processing.service';
import { AttendeesController } from '../controllers/attendees.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendee, Certificate, GeneratedCertificate]),
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService, FileProcessingService],
  exports: [AttendeesService, FileProcessingService],
})
export class AttendeesModule {}
