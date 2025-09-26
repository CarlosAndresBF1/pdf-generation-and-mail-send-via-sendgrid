import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExcelWorkbookConfig {
  creator?: string;
  lastModifiedBy?: string;
  title?: string;
  subject?: string;
  description?: string;
}

export interface ExcelCellStyle {
  font?: Partial<ExcelJS.Font>;
  fill?: Partial<ExcelJS.Fill>;
  border?: Partial<ExcelJS.Borders>;
  alignment?: Partial<ExcelJS.Alignment>;
  numFmt?: string;
}

export interface ExcelColumnConfig {
  header: string;
  key: string;
  width?: number;
  style?: ExcelCellStyle;
}

@Injectable()
export class ExcelService {
  /**
   * Crea un nuevo workbook de Excel con configuración básica
   */
  createWorkbook(config?: ExcelWorkbookConfig): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();

    // Configurar metadatos
    workbook.creator = config?.creator || 'Sistema de Certificados';
    workbook.lastModifiedBy =
      config?.lastModifiedBy || 'Sistema de Certificados';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (config?.title) workbook.title = config.title;
    if (config?.subject) workbook.subject = config.subject;
    if (config?.description) workbook.description = config.description;

    return workbook;
  }

  /**
   * Crea una nueva hoja de trabajo con configuración básica
   */
  createWorksheet(
    workbook: ExcelJS.Workbook,
    name: string,
    columns?: ExcelColumnConfig[],
  ): ExcelJS.Worksheet {
    const worksheet = workbook.addWorksheet(name);

    if (columns) {
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 15,
      }));

      // Aplicar estilos a los headers
      const headerRow = worksheet.getRow(1);
      columns.forEach((col, index) => {
        if (col.style) {
          this.applyCellStyle(headerRow.getCell(index + 1), col.style);
        }
      });
    }

    return worksheet;
  }

  /**
   * Aplica estilos a una celda
   */
  applyCellStyle(cell: ExcelJS.Cell, style: ExcelCellStyle): void {
    if (style.font) {
      cell.font = { ...cell.font, ...style.font };
    }
    if (style.fill) {
      cell.fill = style.fill as ExcelJS.Fill;
    }
    if (style.border) {
      cell.border = style.border as ExcelJS.Borders;
    }
    if (style.alignment) {
      cell.alignment = style.alignment;
    }
    if (style.numFmt) {
      cell.numFmt = style.numFmt;
    }
  }

  /**
   * Estilo para títulos principales
   */
  getTitleStyle(): ExcelCellStyle {
    return {
      font: {
        size: 16,
        bold: true,
        color: { argb: 'FF000000' },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle',
      },
    };
  }

  /**
   * Estilo para subtítulos
   */
  getSubtitleStyle(): ExcelCellStyle {
    return {
      font: {
        size: 12,
        bold: true,
        color: { argb: 'FF333333' },
      },
      alignment: {
        horizontal: 'left',
        vertical: 'middle',
      },
    };
  }

  /**
   * Estilo para headers de tabla
   */
  getHeaderStyle(): ExcelCellStyle {
    return {
      font: {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle',
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  }

  /**
   * Estilo para celdas de datos
   */
  getDataStyle(): ExcelCellStyle {
    return {
      alignment: {
        vertical: 'middle',
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  }

  /**
   * Aplica bordes a un rango de celdas
   */
  applyBordersToRange(
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  }

  /**
   * Añade un título centrado que ocupa varias columnas
   */
  addTitleRow(
    worksheet: ExcelJS.Worksheet,
    title: string,
    startCol: number = 1,
    endCol: number = 10,
  ): ExcelJS.Row {
    const row = worksheet.addRow([title]);
    const cell = row.getCell(1);

    // Mergear celdas
    worksheet.mergeCells(row.number, startCol, row.number, endCol);

    // Aplicar estilo
    this.applyCellStyle(cell, this.getTitleStyle());

    return row;
  }

  /**
   * Convierte el workbook a Buffer para descarga
   */
  async workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /**
   * Formatea una fecha para Excel
   */
  formatDateForExcel(date: Date): string {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Convierte booleano a texto legible en español
   */
  formatBooleanForExcel(value: boolean): string {
    return value ? 'Sí' : 'No';
  }
}
