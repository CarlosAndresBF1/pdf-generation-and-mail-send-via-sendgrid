import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendee } from '../entities/attendee.entity';
import { CreateAttendeeDto } from '../dto/create-attendee.dto';
import { UpdateAttendeeDto } from '../dto/update-attendee.dto';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {}

  async create(createAttendeeDto: CreateAttendeeDto): Promise<Attendee> {
    const attendee = this.attendeeRepository.create(createAttendeeDto);
    return await this.attendeeRepository.save(attendee);
  }

  async findAll(): Promise<Attendee[]> {
    return await this.attendeeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Attendee> {
    const attendee = await this.attendeeRepository.findOne({
      where: { id },
    });

    if (!attendee) {
      throw new NotFoundException(`Attendee with ID ${id} not found`);
    }

    return attendee;
  }

  async update(
    id: number,
    updateAttendeeDto: UpdateAttendeeDto,
  ): Promise<Attendee> {
    const attendee = await this.findOne(id);

    Object.assign(attendee, updateAttendeeDto);

    return await this.attendeeRepository.save(attendee);
  }

  async remove(id: number): Promise<void> {
    const attendee = await this.findOne(id);
    await this.attendeeRepository.remove(attendee);
  }

  async findByEmail(email: string): Promise<Attendee | null> {
    return await this.attendeeRepository.findOne({
      where: { email },
    });
  }

  async findByDocument(
    documentType: string,
    documentNumber: string,
  ): Promise<Attendee | null> {
    return await this.attendeeRepository.findOne({
      where: { documentType, documentNumber },
    });
  }

  async bulkCreate(
    createAttendeesDto: CreateAttendeeDto[],
  ): Promise<Attendee[]> {
    const attendees = this.attendeeRepository.create(createAttendeesDto);
    return await this.attendeeRepository.save(attendees);
  }

  async findByIds(ids: number[]): Promise<Attendee[]> {
    return await this.attendeeRepository.findByIds(ids);
  }
}
