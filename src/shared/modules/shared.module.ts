import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '../services/s3.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { EmailService } from '../services/email.service';

@Module({
  imports: [ConfigModule],
  providers: [S3Service, PdfGeneratorService, EmailService],
  exports: [S3Service, PdfGeneratorService, EmailService],
})
export class SharedModule {}
