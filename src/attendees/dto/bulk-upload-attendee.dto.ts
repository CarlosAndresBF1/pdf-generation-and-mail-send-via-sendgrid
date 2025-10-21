import {
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkUploadAttendeeDto {
  @ApiProperty({
    description: 'Nombre completo del asistente',
    example: 'Juan Carlos Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Primer nombre del asistente (opcional)',
    example: 'Juan Carlos',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del asistente (opcional)',
    example: 'Pérez García',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'País del asistente',
    example: 'Colombia',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Tipo de documento',
    example: 'CC',
  })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({
    description: 'Número de documento',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({
    description: 'Género del asistente',
    enum: ['M', 'F', 'Masculino', 'Femenino', 'Male', 'Female', 'Otro'],
    example: 'M',
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    description: 'Correo electrónico del asistente',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Enlace personalizado 1 (opcional)',
    example: 'https://example.com/resource1',
  })
  @IsOptional()
  @IsString()
  link1?: string;

  @ApiPropertyOptional({
    description: 'Enlace personalizado 2 (opcional)',
    example: 'https://example.com/resource2',
  })
  @IsOptional()
  @IsString()
  link2?: string;

  @ApiPropertyOptional({
    description: 'Campo personalizado 1 (opcional)',
    example: 'Custom value 1',
  })
  @IsOptional()
  @IsString()
  custom1?: string;

  @ApiPropertyOptional({
    description: 'Campo personalizado 2 (opcional)',
    example: 'Custom value 2',
  })
  @IsOptional()
  @IsString()
  custom2?: string;

  @ApiPropertyOptional({
    description: 'ID del certificado a asociar con el asistente (opcional)',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : undefined))
  @IsNumber()
  @IsPositive()
  certificateId?: number;
}

export class BulkUploadResponseDto {
  @ApiProperty({
    description: 'Total de registros procesados en el archivo',
    example: 100,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Número de asistentes creados exitosamente',
    example: 85,
  })
  created: number;

  @ApiProperty({
    description: 'Número de asistentes actualizados',
    example: 10,
  })
  updated: number;

  @ApiProperty({
    description: 'Número de registros con errores',
    example: 5,
  })
  errors: number;

  @ApiProperty({
    description: 'Lista de errores encontrados durante el procesamiento',
    example: [
      {
        row: 15,
        errors: ['Email inválido', 'País requerido'],
      },
    ],
  })
  errorDetails: Array<{
    row: number;
    data?: any;
    errors: string[];
  }>;

  @ApiProperty({
    description: 'Número de certificados asociados automáticamente',
    example: 75,
  })
  certificatesAssociated: number;
}
