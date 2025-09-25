import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDesignImageDto {
  @ApiProperty({
    description: 'Nombre descriptivo para la imagen de diseño',
    example: 'Summit 2025 - Diseño Principal',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción adicional de la imagen',
    example: 'Diseño base para certificados del Summit 2025 con logos corporativos',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cliente al que pertenece el diseño',
    example: 'Nestlé',
  })
  @IsOptional()
  @IsString()
  client?: string;
}

export class UploadDesignImageResponseDto {
  @ApiProperty({
    description: 'URL completa de la imagen subida (CDN)',
    example: 'https://cdn.example.com/certificates/design_images/nestle_2025/summit-design-main.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Clave S3 de la imagen (para referencia interna)',
    example: 'certificates/design_images/nestle_2025/summit-design-main.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Nombre del archivo original',
    example: 'summit-design-main.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Timestamp de cuando se subió la imagen',
    example: '2025-09-25T10:30:00.000Z',
  })
  uploadedAt: Date;
}