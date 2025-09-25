import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from '../services/certificates.service';
import { CertificatesController } from '../controllers/certificates.controller';
import { Certificate } from '../entities/certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
