import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

import { Attendee } from '../entities/attendee.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';
import {
  BulkUploadAttendeeDto,
  BulkUploadResponseDto,
} from '../dto/bulk-upload-attendee.dto';

interface ParsedFileData {
  data: any[];
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

@Injectable()
export class FileProcessingService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(GeneratedCertificate)
    private readonly generatedCertificateRepository: Repository<GeneratedCertificate>,
  ) {}

  /**
   * Procesa un archivo CSV o Excel y retorna los attendees procesados
   */
  async processFile(
    file: Express.Multer.File,
    updateExisting = false,
  ): Promise<BulkUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Verificar tipo de archivo
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      throw new BadRequestException(
        'Formato de archivo no soportado. Use CSV, XLS o XLSX',
      );
    }

    let parsedData: ParsedFileData;

    try {
      if (fileExtension === 'csv') {
        parsedData = await this.parseCSV(file);
      } else {
        parsedData = this.parseExcel(file);
      }
    } catch (error) {
      throw new BadRequestException(
        `Error al parsear el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }

    // Procesar los datos
    return await this.processAttendeeData(parsedData, updateExisting);
  }

  /**
   * Parsea un archivo CSV
   */
  private async parseCSV(file: Express.Multer.File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const fileContent = file.buffer.toString('utf8');

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => this.normalizeColumnName(header),
        complete: (results) => {
          resolve({
            data: results.data,
            errors: results.errors.map((error, index) => ({
              row: index + 2, // +2 porque empieza en 1 y hay header
              errors: [error.message || 'Error de parseo'],
            })),
          });
        },
        error: (error: { message?: string }) => {
          reject(new Error(error.message || 'Error al parsear CSV'));
        },
      });
    });
  }

  /**
   * Parsea un archivo Excel
   */
  private parseExcel(file: Express.Multer.File): ParsedFileData {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON con headers
      const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      });

      if (jsonData.length < 2) {
        throw new Error(
          'El archivo debe contener al menos una fila de datos además del header',
        );
      }

      // Primera fila son los headers
      const headers = (jsonData[0] as string[]).map((header: string) =>
        this.normalizeColumnName(header),
      );

      // Convertir datos a objetos
      const data = jsonData.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          const value = row[index];
          obj[header] =
            typeof value === 'string' || typeof value === 'number'
              ? String(value)
              : '';
        });
        return obj;
      });

      return {
        data,
        errors: [],
      };
    } catch (error) {
      throw new Error(
        `Error al procesar archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Normaliza los nombres de columnas para que coincidan con los campos del DTO
   */
  private normalizeColumnName(column: string): string {
    const normalized = column.toLowerCase().trim();
    
    const columnMap: Record<string, string> = {
      'nombre completo': 'fullName',
      nombre_completo: 'fullName',
      full_name: 'fullName',
      fullname: 'fullName',
      nombre: 'firstName',
      'primer nombre': 'firstName',
      primer_nombre: 'firstName',
      first_name: 'firstName',
      firstname: 'firstName',
      apellido: 'lastName',
      apellidos: 'lastName',
      last_name: 'lastName',
      lastname: 'lastName',
      país: 'country',
      pais: 'country',
      'tipo documento': 'documentType',
      tipo_documento: 'documentType',
      document_type: 'documentType',
      documenttype: 'documentType',
      'numero documento': 'documentNumber',
      numero_documento: 'documentNumber',
      document_number: 'documentNumber',
      documentnumber: 'documentNumber',
      'número documento': 'documentNumber',
      número_documento: 'documentNumber',
      genero: 'gender',
      género: 'gender',
      sexo: 'gender',
      correo: 'email',
      email: 'email',
      'correo electronico': 'email',
      correo_electronico: 'email',
      certificate_id: 'certificateId',
      certificateid: 'certificateId',
      'id certificado': 'certificateId',
      id_certificado: 'certificateId',
    };

    return columnMap[normalized] || column;
  }

  /**
   * Procesa los datos de attendees y los guarda en la base de datos
   */
  private async processAttendeeData(
    parsedData: ParsedFileData,
    updateExisting: boolean,
  ): Promise<BulkUploadResponseDto> {
    const response: BulkUploadResponseDto = {
      totalRecords: parsedData.data.length,
      created: 0,
      updated: 0,
      errors: parsedData.errors.length,
      errorDetails: [...parsedData.errors],
      certificatesAssociated: 0,
    };

    // Obtener certificados existentes para validación
    const certificates = await this.certificateRepository.find({
      select: ['id'],
    });
    const validCertificateIds = new Set(certificates.map((cert) => cert.id));

    for (let i = 0; i < parsedData.data.length; i++) {
      const rowData = parsedData.data[i] as Record<string, unknown>;
      const rowNumber = i + 2; // +2 porque empieza en 1 y hay header

      try {
        // Convertir a DTO y validar
        const attendeeDto = plainToClass(BulkUploadAttendeeDto, rowData);
        const validationErrors = await validate(attendeeDto);

        if (validationErrors.length > 0) {
          const errors = validationErrors.flatMap((error) =>
            Object.values(error.constraints || {}),
          );
          response.errorDetails.push({
            row: rowNumber,
            data: rowData,
            errors,
          });
          response.errors++;
          continue;
        }

        // Validar certificate_id si está presente
        if (
          attendeeDto.certificateId &&
          !validCertificateIds.has(attendeeDto.certificateId)
        ) {
          response.errorDetails.push({
            row: rowNumber,
            data: rowData,
            errors: [`Certificate ID ${attendeeDto.certificateId} no existe`],
          });
          response.errors++;
          continue;
        }

        // Buscar attendee existente por email o documento
        const existingAttendee = await this.attendeeRepository.findOne({
          where: [
            { email: attendeeDto.email },
            { documentNumber: attendeeDto.documentNumber },
          ],
        });

        let attendeeId: number;

        if (existingAttendee) {
          if (updateExisting) {
            // Actualizar attendee existente
            await this.attendeeRepository.update(existingAttendee.id, {
              fullName: attendeeDto.fullName,
              firstName: attendeeDto.firstName,
              lastName: attendeeDto.lastName,
              country: attendeeDto.country,
              documentType: attendeeDto.documentType,
              documentNumber: attendeeDto.documentNumber,
              gender: attendeeDto.gender,
              email: attendeeDto.email,
            });
            attendeeId = existingAttendee.id;
            response.updated++;
          } else {
            // Marcar como duplicado
            response.errorDetails.push({
              row: rowNumber,
              data: rowData,
              errors: ['Attendee ya existe (email o documento duplicado)'],
            });
            response.errors++;
            continue;
          }
        } else {
          // Crear nuevo attendee
          const newAttendee = this.attendeeRepository.create({
            fullName: attendeeDto.fullName,
            firstName: attendeeDto.firstName,
            lastName: attendeeDto.lastName,
            country: attendeeDto.country,
            documentType: attendeeDto.documentType,
            documentNumber: attendeeDto.documentNumber,
            gender: attendeeDto.gender,
            email: attendeeDto.email,
          });

          const savedAttendee = await this.attendeeRepository.save(newAttendee);
          attendeeId = savedAttendee.id;
          response.created++;
        }

        // Crear asociación automática con certificado si está presente
        if (attendeeDto.certificateId) {
          // Verificar si ya existe una asociación
          const existingCertificate =
            await this.generatedCertificateRepository.findOne({
              where: {
                certificateId: attendeeDto.certificateId,
                attendeeId: attendeeId,
              },
            });

          if (!existingCertificate) {
            // Crear nueva asociación de certificado
            const generatedCertificate =
              this.generatedCertificateRepository.create({
                certificateId: attendeeDto.certificateId,
                attendeeId: attendeeId,
                s3Url: '', // Se generará cuando se procese el certificado
                generatedAt: new Date(),
                isSent: false,
              });

            await this.generatedCertificateRepository.save(
              generatedCertificate,
            );
            response.certificatesAssociated++;
          }
        }
      } catch (error) {
        response.errorDetails.push({
          row: rowNumber,
          data: rowData,
          errors: [
            `Error al procesar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          ],
        });
        response.errors++;
      }
    }

    return response;
  }
}
