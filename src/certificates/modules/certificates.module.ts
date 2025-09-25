import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from '../services/certificates.service';
import { DesignImageService } from '../services/design-image.service';
import { CertificatesController } from '../controllers/certificates.controller';
import { Certificate } from '../entities/certificate.entity';
import { SharedModule } from '../../shared/modules/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate]), SharedModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, DesignImageService],
  exports: [CertificatesService, DesignImageService],
})
export class CertificatesModule {}
