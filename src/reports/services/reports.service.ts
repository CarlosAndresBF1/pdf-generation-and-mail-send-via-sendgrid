import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedCertificate } from '../../generated-certificates/entities/generated-certificate.entity';
import { ExcelService } from '../../shared/services/excel.service';

export interface CertificateStats {
  totalGenerated: number;
  totalSent: number;
  totalPending: number;
  totalByCountry: Record<string, number>;
  successRate: number;
  lastGenerated?: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(GeneratedCertificate)
    private generatedCertificateRepository: Repository<GeneratedCertificate>,
    private excelService: ExcelService,
  ) {}

  /**
   * Genera un reporte en Excel de certificados generados por certificate ID
   */
  async generateCertificateReport(certificateId: number): Promise<Buffer> {
    // Obtener todos los certificados generados para el certificate ID
    const generatedCertificates =
      await this.generatedCertificateRepository.find({
        where: { certificateId },
        relations: ['certificate', 'attendee'],
        order: { createdAt: 'DESC' },
      });

    if (generatedCertificates.length === 0) {
      throw new Error('No se encontraron certificados generados para este ID');
    }

    // Obtener información del certificado
    const certificateInfo = generatedCertificates[0].certificate;

    // Crear workbook con configuración
    const workbook = this.excelService.createWorkbook({
      title: `Reporte Certificados - ${certificateInfo.name}`,
      subject: `Análisis de certificados generados para ${certificateInfo.client}`,
      description: `Reporte detallado de certificados generados para el evento ${certificateInfo.eventName}`,
    });

    // Crear hoja de trabajo
    const worksheet = this.excelService.createWorksheet(
      workbook,
      'Reporte de Certificados',
    );

    // Agregar título principal
    this.excelService.addTitleRow(
      worksheet,
      'REPORTE DE CERTIFICADOS GENERADOS',
      1,
      8,
    );

    // Información del certificado
    worksheet.addRow([]);
    const subtitleRow = worksheet.addRow(['Información del Certificado:']);
    this.excelService.applyCellStyle(
      subtitleRow.getCell(1),
      this.excelService.getSubtitleStyle(),
    );

    worksheet.addRow(['Cliente:', certificateInfo.client]);
    worksheet.addRow(['Nombre:', certificateInfo.name]);
    worksheet.addRow(['Evento:', certificateInfo.eventName]);
    worksheet.addRow([
      'Fecha de reporte:',
      this.excelService.formatDateForExcel(new Date()),
    ]);
    worksheet.addRow([]);

    // Estadísticas generales
    const stats = await this.getCertificateStats(certificateId);
    const statsRow = worksheet.addRow(['Estadísticas Generales:']);
    this.excelService.applyCellStyle(
      statsRow.getCell(1),
      this.excelService.getSubtitleStyle(),
    );

    worksheet.addRow([
      'Total de certificados generados:',
      stats.totalGenerated,
    ]);
    worksheet.addRow(['Certificados enviados por correo:', stats.totalSent]);
    worksheet.addRow(['Certificados pendientes de envío:', stats.totalPending]);
    worksheet.addRow(['Tasa de éxito de envío:', `${stats.successRate}%`]);
    if (stats.lastGenerated) {
      worksheet.addRow([
        'Último certificado generado:',
        this.excelService.formatDateForExcel(stats.lastGenerated),
      ]);
    }
    worksheet.addRow([]);

    // Distribución por países
    const countryRow = worksheet.addRow(['Distribución por Países:']);
    this.excelService.applyCellStyle(
      countryRow.getCell(1),
      this.excelService.getSubtitleStyle(),
    );

    Object.entries(stats.totalByCountry).forEach(([country, count]) => {
      worksheet.addRow([country, count]);
    });
    worksheet.addRow([]);

    // Configurar headers de la tabla de datos
    const headersRow = worksheet.addRow([
      'ID',
      'Nombre Completo',
      'Email',
      'País',
      'Documento',
      'URL del PDF',
      'Enviado',
      'Fecha de Generación',
    ]);

    // Aplicar estilo a los headers
    headersRow.eachCell((cell) => {
      this.excelService.applyCellStyle(
        cell,
        this.excelService.getHeaderStyle(),
      );
    });

    // Agregar datos de certificados
    generatedCertificates.forEach((cert) => {
      const dataRow = worksheet.addRow([
        cert.id,
        cert.attendee.fullName,
        cert.attendee.email,
        cert.attendee.country || 'No especificado',
        cert.attendee.documentNumber || 'No especificado',
        cert.s3Url || 'Sin URL',
        this.excelService.formatBooleanForExcel(cert.isSent),
        this.excelService.formatDateForExcel(cert.createdAt),
      ]);

      // Aplicar estilo a las celdas de datos
      dataRow.eachCell((cell) => {
        this.excelService.applyCellStyle(
          cell,
          this.excelService.getDataStyle(),
        );
      });
    });

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 8 }, // ID
      { width: 25 }, // Nombre
      { width: 30 }, // Email
      { width: 15 }, // País
      { width: 15 }, // Documento
      { width: 50 }, // URL
      { width: 10 }, // Enviado
      { width: 20 }, // Fecha
    ];

    // Aplicar bordes a la tabla de datos
    const startRow = headersRow.number;
    const endRow = worksheet.rowCount;
    this.excelService.applyBordersToRange(worksheet, startRow, 1, endRow, 8);

    // Convertir a buffer
    return this.excelService.workbookToBuffer(workbook);
  }

  /**
   * Obtiene estadísticas de certificados generados
   */
  async getCertificateStats(certificateId: number): Promise<CertificateStats> {
    const generatedCertificates =
      await this.generatedCertificateRepository.find({
        where: { certificateId },
        relations: ['attendee'],
      });

    if (generatedCertificates.length === 0) {
      throw new Error('No se encontraron certificados generados para este ID');
    }

    const totalGenerated = generatedCertificates.length;
    const totalSent = generatedCertificates.filter(
      (cert) => cert.isSent,
    ).length;
    const totalPending = totalGenerated - totalSent;
    const successRate =
      totalGenerated > 0 ? Math.round((totalSent / totalGenerated) * 100) : 0;

    // Contar por países
    const totalByCountry: Record<string, number> = {};
    generatedCertificates.forEach((cert) => {
      const country = cert.attendee.country || 'No especificado';
      totalByCountry[country] = (totalByCountry[country] || 0) + 1;
    });

    // Obtener fecha del último certificado generado
    const lastGenerated = generatedCertificates.reduce(
      (latest, cert) => {
        return !latest || cert.createdAt > latest ? cert.createdAt : latest;
      },
      null as Date | null,
    );

    return {
      totalGenerated,
      totalSent,
      totalPending,
      totalByCountry,
      successRate,
      lastGenerated: lastGenerated || undefined,
    };
  }
}
