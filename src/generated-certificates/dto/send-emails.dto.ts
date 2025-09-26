import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class SendEmailsDto {
  @ApiProperty({
    description: 'Array of generated certificate IDs to send emails for',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one certificate ID is required' })
  @IsNumber({}, { each: true, message: 'Each ID must be a number' })
  certificateIds: number[];
}
