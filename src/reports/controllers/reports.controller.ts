import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('certificates/:id/excel')
  @ApiOperation({
    summary: 'Generar reporte Excel de certificados generados',
    description:
      'Genera un archivo Excel con todos los certificados generados para un certificate_id específico, incluyendo datos del asistente, URL del certificado y estado de envío.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename="reporte-certificados-{id}.xlsx"',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron certificados generados para este ID',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async generateCertificateExcelReport(
    @Param('id', ParseIntPipe) certificateId: number,
    @Res() res: Response,
  ) {
    try {
      // Generar el buffer del archivo Excel
      const excelBuffer =
        await this.reportsService.generateCertificateReport(certificateId);

      // Configurar headers para descarga del archivo
      const filename = `reporte-certificados-${certificateId}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar el archivo
      res.send(excelBuffer);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      if (
        errorMessage === 'No se encontraron certificados generados para este ID'
      ) {
        throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error generando el reporte Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('certificates/:id/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de certificados generados',
    description:
      'Obtiene estadísticas resumidas de los certificados generados para un certificate_id específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        certificate: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            client: { type: 'string' },
            name: { type: 'string' },
            eventName: { type: 'string' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            sent: { type: 'number' },
            notSent: { type: 'number' },
            withUrl: { type: 'number' },
            withoutUrl: { type: 'number' },
          },
        },
        countries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              country: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron certificados generados para este ID',
  })
  async getCertificateStats(@Param('id', ParseIntPipe) certificateId: number) {
    try {
      const stats =
        await this.reportsService.getCertificateStats(certificateId);
      return stats;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      if (
        errorMessage === 'No se encontraron certificados generados para este ID'
      ) {
        throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error obteniendo estadísticas del certificado',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
