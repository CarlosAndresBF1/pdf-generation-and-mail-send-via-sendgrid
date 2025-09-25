import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class GenerateCertificatesDto {
  @ApiProperty({
    description: 'Certificate configuration ID',
    example: 1,
  })
  @IsNumber()
  certificateId: number;

  @ApiProperty({
    description: 'Array of attendee IDs to generate certificates for',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  attendeeIds: number[];

  @ApiProperty({
    description: 'Whether to send emails immediately after generation',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmails?: boolean = false;
}
