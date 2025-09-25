import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAppUsageDto {
  @ApiProperty({
    example: 30,
    description: 'Duración del uso en segundos desde el último ping',
  })
  @IsNumber()
  durationSeconds: number;

  @ApiProperty({
    example: '2025-07-08T14:30:00Z',
    description: 'Marca de tiempo del uso actual',
    required: false,
  })
  @IsOptional()
  @IsString()
  timestamp?: string;
}
