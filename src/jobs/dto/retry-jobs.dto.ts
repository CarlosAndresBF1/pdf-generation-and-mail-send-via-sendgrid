import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class RetryJobsDto {
  @ApiProperty({
    description: 'Array of job IDs to retry',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  jobIds: number[];
}
