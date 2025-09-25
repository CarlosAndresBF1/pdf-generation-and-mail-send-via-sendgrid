import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../entities/certificate.entity';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  async create(
    createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    const certificate = this.certificateRepository.create(createCertificateDto);
    return await this.certificateRepository.save(certificate);
  }

  async findAll(): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Certificate> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    return certificate;
  }

  async findByClient(client: string): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      where: { client },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateCertificateDto: UpdateCertificateDto,
  ): Promise<Certificate> {
    await this.findOne(id); // Verify exists
    await this.certificateRepository.update(id, updateCertificateDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const certificate = await this.findOne(id);
    await this.certificateRepository.remove(certificate);
  }

  async toggleActive(id: number): Promise<Certificate> {
    const certificate = await this.findOne(id);
    certificate.isActive = !certificate.isActive;
    return await this.certificateRepository.save(certificate);
  }
}
