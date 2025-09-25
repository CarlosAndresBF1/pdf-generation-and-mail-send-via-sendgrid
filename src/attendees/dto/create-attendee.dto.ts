import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateAttendeeDto {
  @ApiProperty({
    description: 'Full name of the attendee',
    example: 'Juan Carlos Pérez García',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({
    description: 'First name (optional)',
    example: 'Juan Carlos',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'Last name (optional)',
    example: 'Pérez García',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Country of residence',
    example: 'Colombia',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;

  @ApiProperty({
    description: 'Document type',
    example: 'Cédula de Ciudadanía',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType: string;

  @ApiProperty({
    description: 'Document number',
    example: '12345678',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentNumber: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Masculino',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  gender: string;

  @ApiProperty({
    description: 'Email address',
    example: 'juan.perez@company.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
