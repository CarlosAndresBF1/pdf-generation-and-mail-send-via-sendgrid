import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { S3Service } from '../../shared/services/s3.service';
import {
  UploadDesignImageDto,
  UploadDesignImageResponseDto,
} from '../dto/upload-design-image.dto';

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
    uploadData: UploadDesignImageDto,
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
    const key = this.generateDesignImageKey(file, uploadData);

    try {
      // Subir a S3
      const url = await this.s3Service.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
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
   * Lista las imágenes de diseño disponibles (simulado - requeriría implementar listObjects en S3Service)
   */
  listDesignImages(_client?: string): Promise<string[]> {
    // Esta funcionalidad requeriría implementar listObjects en S3Service
    // Por ahora retornamos un array vacío como placeholder
    return Promise.resolve([]);
  }

  /**
   * Valida si una URL corresponde a una imagen de diseño válida
   */
  validateDesignImageUrl(url: string): boolean {
    if (!url) return false;

    // Verificar que la URL tenga el formato correcto
    const cdnUrl = this.configService.get<string>('AWS_CDN_URL') || '';
    if (!url.startsWith(cdnUrl)) return false;

    // Verificar que esté en la carpeta correcta
    const key = this.s3Service.extractKeyFromUrl(url);
    return key.startsWith('certificates/design_images/');
  }

  /**
   * Genera la clave S3 para una imagen de diseño
   */
  private generateDesignImageKey(
    file: Express.Multer.File,
    uploadData: UploadDesignImageDto,
  ): string {
    const year = new Date().getFullYear();
    const uuid = uuidv4().substring(0, 8); // Solo primeros 8 caracteres

    // Obtener extensión del archivo
    const extension = this.getFileExtension(file.originalname);

    // Sanitizar nombre del cliente si se proporciona
    const clientPart = uploadData.client
      ? `${this.sanitizeFilename(uploadData.client)}_${year}`
      : `general_${year}`;

    // Sanitizar nombre del archivo
    const namePart = this.sanitizeFilename(uploadData.name);

    return `certificates/design_images/${clientPart}/${namePart}_${uuid}${extension}`;
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

  /**
   * Extrae información de una URL de imagen de diseño
   */
  extractImageInfo(
    url: string,
  ): { client: string; year: string; filename: string } | null {
    if (!this.validateDesignImageUrl(url)) {
      return null;
    }

    const key = this.s3Service.extractKeyFromUrl(url);
    const parts = key.split('/');

    if (parts.length < 4) {
      return null;
    }

    // certificates/design_images/client_year/filename
    const clientYear = parts[2];
    const filename = parts[3];

    const clientYearParts = clientYear.split('_');
    const year = clientYearParts[clientYearParts.length - 1];
    const client = clientYearParts.slice(0, -1).join('_');

    return {
      client,
      year,
      filename,
    };
  }
}
