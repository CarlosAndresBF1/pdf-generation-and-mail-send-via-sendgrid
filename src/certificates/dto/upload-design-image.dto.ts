import { ApiProperty } from '@nestjs/swagger';

export class UploadDesignImageResponseDto {
  @ApiProperty({
    description: 'URL completa de la imagen subida (CDN)',
    example:
      'https://cdn.creadoresdelcambionestle.com/certificates/design_images/design_12345678.jpg',
  })
  url: string;
}
