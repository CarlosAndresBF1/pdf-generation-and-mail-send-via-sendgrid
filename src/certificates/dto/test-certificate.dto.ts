import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class TestCertificateDto {
  @ApiProperty({
    description: 'ID de la configuración del certificado',
    example: 1,
  })
  @IsNumber({}, { message: 'El ID del certificado debe ser un número' })
  @IsNotEmpty({ message: 'El ID del certificado es requerido' })
  certificateId: number;

  @ApiProperty({
    description: 'Nombre completo del asistente',
    example: 'Carlos Andres Beltran Franco',
  })
  @IsString({ message: 'El nombre completo debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MinLength(2, {
    message: 'El nombre completo debe tener al menos 2 caracteres',
  })
  fullName: string;

  @ApiProperty({
    description: 'Número de documento del asistente',
    example: '12345678',
  })
  @IsString({ message: 'El número de documento debe ser un texto' })
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  documentNumber: string;

  @ApiProperty({
    description: 'Correo electrónico del asistente',
    example: 'dev@inmov.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}

export class TestCertificateResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación del envío',
    example: 'Certificado de prueba enviado exitosamente a dev@inmov.com',
  })
  message: string;

  @ApiProperty({
    description: 'Email al que se envió el certificado',
    example: 'dev@inmov.com',
  })
  email: string;

  @ApiProperty({
    description: 'ID del certificado utilizado',
    example: 1,
  })
  certificateId: number;

  @ApiProperty({
    description: 'Fecha y hora del envío',
    example: '2025-09-25T21:00:00.000Z',
  })
  sentAt: Date;
}
