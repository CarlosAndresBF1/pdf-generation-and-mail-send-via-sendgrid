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
    example: 'Certificado de Participación VI Summit LATAM 18/09/2025',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Event name',
    example: 'VI Summit LATAM 2025',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventName: string;

  @ApiProperty({
    description: 'Base design image URL in S3',
    example:
      'https://cdn.creadoresdelcambionestle.com/certificates/design_images/design_cfb1e937.jpg',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  baseDesignUrl: string;

  @ApiProperty({
    description: 'PDF template reference',
    example: 'summit-2025-template-17',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pdfTemplate: string;

  @ApiProperty({
    description: 'SendGrid template ID for email',
    example: 'd-6297a8496d6744dbac334effa077a2ae',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sendgridTemplateId: string;

  @ApiProperty({
    description: 'Event link for email',
    example: 'https://6summit2025.com/',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  eventLink: string;

  @ApiProperty({
    description: 'Sender from name for certificate emails',
    example: 'Summit 2025 Team',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  senderFromName?: string;

  @ApiProperty({
    description: 'Custom sender email for certificate emails',
    example: 'admin@6summit2025.com',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  senderEmail?: string;

  @ApiProperty({
    description: 'Email subject for certificate emails',
    example:
      '📢Revive lo mejor del VI Summit LATAM. Disponible hasta el 19 de octubre',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  emailSubject?: string;

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
