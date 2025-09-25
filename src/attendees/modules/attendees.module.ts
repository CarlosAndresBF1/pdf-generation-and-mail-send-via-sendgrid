import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from '../entities/attendee.entity';
import { AttendeesService } from '../services/attendees.service';
import { AttendeesController } from '../controllers/attendees.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attendee])],
  controllers: [AttendeesController],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {}
