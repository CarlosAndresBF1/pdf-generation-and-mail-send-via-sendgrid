import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({
    description: 'Client or company name',
    example: 'Nestlé Colombia',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  client: string;

  @ApiProperty({
    description: 'Certificate name',
    example: 'Certificado de Participación Summit 2025',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Event name',
    example: 'Summit Creadores del Cambio 2025',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventName: string;

  @ApiProperty({
    description: 'Base design image URL in S3',
    example: 'https://cdn.creadoresdelcambionestle.com/designs/summit-2025-bg.jpg',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  baseDesignUrl: string;

  @ApiProperty({
    description: 'PDF template reference',
    example: 'summit-2025-template',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pdfTemplate: string;

  @ApiProperty({
    description: 'SendGrid template ID for email',
    example: 'd-abc123def456ghi789',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sendgridTemplateId: string;

  @ApiProperty({
    description: 'Event link for email',
    example: 'https://summit.creadoresdelcambio.com',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  eventLink: string;

  @ApiProperty({
    description: 'Whether the certificate is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}