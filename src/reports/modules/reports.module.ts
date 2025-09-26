import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { ExcelService } from '../../shared/services/excel.service';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedCertificate, Attendee, Certificate]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ExcelService],
  exports: [ReportsService, ExcelService],
})
export class ReportsModule {}
