import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { S3Service } from '../../shared/services/s3.service';
import { UploadDesignImageResponseDto } from '../dto/upload-design-image.dto';

@Injectable()
export class DesignImageService {
  // Formatos de imagen permitidos
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ];

  // Tamaño máximo: 10MB
  private readonly maxFileSize = 10 * 1024 * 1024;

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sube una imagen de diseño a S3 en la carpeta certificates/design_images
   */
  async uploadDesignImage(
    file: Express.Multer.File,
  ): Promise<UploadDesignImageResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato de archivo no soportado. Formatos permitidos: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Generar key para S3
    const key = this.generateDesignImageKey(file);

    try {
      // Subir a S3 y obtener URL del CDN
      const s3Url = await this.s3Service.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );

      // Construir URL del CDN
      const cdnDomain = this.configService.get<string>('AWS_CDN_DOMAIN');
      const cdnUrl = s3Url.replace(/^https:\/\/[^/]+\//, `${cdnDomain}/`);

      return {
        url: cdnUrl,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Elimina una imagen de diseño de S3
   */
  async deleteDesignImage(key: string): Promise<void> {
    try {
      await this.s3Service.deleteFile(key);
    } catch (error) {
      throw new BadRequestException(
        `Error al eliminar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Genera la clave S3 para una imagen de diseño
   */
  private generateDesignImageKey(file: Express.Multer.File): string {
    const uuid = uuidv4().substring(0, 8); // Solo primeros 8 caracteres

    // Obtener extensión del archivo
    const extension = this.getFileExtension(file.originalname);

    // Usar nombre genérico + UUID
    return `certificates/design_images/design_${uuid}${extension}`;
  }

  /**
   * Sanitiza un nombre de archivo removiendo caracteres especiales
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
  }

  /**
   * Obtiene la extensión de un archivo
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }
}
