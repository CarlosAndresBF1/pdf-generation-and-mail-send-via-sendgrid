import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from './excel.service';
import * as ExcelJS from 'exceljs';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkbook', () => {
    it('should create a workbook with default configuration', () => {
      const workbook = service.createWorkbook();

      expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
      expect(workbook.creator).toBe('Sistema de Certificados');
      expect(workbook.lastModifiedBy).toBe('Sistema de Certificados');
      expect(workbook.created).toBeInstanceOf(Date);
      expect(workbook.modified).toBeInstanceOf(Date);
    });

    it('should create a workbook with custom configuration', () => {
      const config = {
        creator: 'Test Creator',
        lastModifiedBy: 'Test User',
        title: 'Test Title',
        subject: 'Test Subject',
        description: 'Test Description',
      };

      const workbook = service.createWorkbook(config);

      expect(workbook.creator).toBe(config.creator);
      expect(workbook.lastModifiedBy).toBe(config.lastModifiedBy);
      expect(workbook.title).toBe(config.title);
      expect(workbook.subject).toBe(config.subject);
      expect(workbook.description).toBe(config.description);
    });
  });

  describe('createWorksheet', () => {
    it('should create a worksheet without columns', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test Sheet');

      expect(worksheet.name).toBe('Test Sheet');
      expect(worksheet.name).toBe('Test Sheet');
    });

    it('should create a worksheet with columns', () => {
      const workbook = service.createWorkbook();
      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
      ];

      const worksheet = service.createWorksheet(
        workbook,
        'Test Sheet',
        columns,
      );

      expect(worksheet.name).toBe('Test Sheet');
      expect(worksheet.columns).toHaveLength(2);
      expect(worksheet.getColumn(1).header).toBe('ID');
      expect(worksheet.getColumn(2).header).toBe('Name');
    });
  });

  describe('applyCellStyle', () => {
    it('should apply font style to cell', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');
      const cell = worksheet.getCell('A1');

      const style = {
        font: { bold: true, color: { argb: 'FF000000' } },
      };

      service.applyCellStyle(cell, style);

      expect(cell.font?.bold).toBe(true);
      expect(cell.font?.color).toEqual({ argb: 'FF000000' });
    });

    it('should apply fill style to cell', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');
      const cell = worksheet.getCell('A1');

      const style = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FF4472C4' },
        },
      };

      service.applyCellStyle(cell, style);

      expect(cell.fill).toEqual(style.fill);
    });

    it('should apply alignment style to cell', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');
      const cell = worksheet.getCell('A1');

      const style = {
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
      };

      service.applyCellStyle(cell, style);

      expect(cell.alignment).toEqual(style.alignment);
    });
  });

  describe('style getters', () => {
    it('should return title style', () => {
      const titleStyle = service.getTitleStyle();

      expect(titleStyle.font?.size).toBe(16);
      expect(titleStyle.font?.bold).toBe(true);
      expect(titleStyle.alignment?.horizontal).toBe('center');
    });

    it('should return subtitle style', () => {
      const subtitleStyle = service.getSubtitleStyle();

      expect(subtitleStyle.font?.size).toBe(12);
      expect(subtitleStyle.font?.bold).toBe(true);
      expect(subtitleStyle.alignment?.horizontal).toBe('left');
    });

    it('should return header style', () => {
      const headerStyle = service.getHeaderStyle();

      expect(headerStyle.font?.bold).toBe(true);
      expect(headerStyle.font?.color).toEqual({ argb: 'FFFFFFFF' });
      expect(headerStyle.fill?.type).toBe('pattern');
      expect(headerStyle.alignment?.horizontal).toBe('center');
      expect(headerStyle.border).toBeDefined();
    });

    it('should return data style', () => {
      const dataStyle = service.getDataStyle();

      expect(dataStyle.alignment?.vertical).toBe('middle');
      expect(dataStyle.border).toBeDefined();
    });
  });

  describe('addTitleRow', () => {
    it('should add title row with default columns', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');

      const row = service.addTitleRow(worksheet, 'Test Title');

      expect(row.getCell(1).value).toBe('Test Title');
      expect(worksheet.getCell('A1:J1').isMerged).toBeTruthy();
    });

    it('should add title row with custom column range', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');

      const row = service.addTitleRow(worksheet, 'Test Title', 1, 5);

      expect(row.getCell(1).value).toBe('Test Title');
    });
  });

  describe('utility methods', () => {
    it('should format date for Excel', () => {
      const date = new Date('2025-09-26T12:30:00');
      const formatted = service.formatDateForExcel(date);

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY format
      expect(formatted).toContain('12:30:00');
    });

    it('should format boolean for Excel', () => {
      expect(service.formatBooleanForExcel(true)).toBe('Sí');
      expect(service.formatBooleanForExcel(false)).toBe('No');
    });
  });

  describe('workbookToBuffer', () => {
    it('should convert workbook to buffer', async () => {
      const workbook = service.createWorkbook();
      service.createWorksheet(workbook, 'Test');

      const buffer = await service.workbookToBuffer(workbook);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('applyBordersToRange', () => {
    it('should apply borders to cell range', () => {
      const workbook = service.createWorkbook();
      const worksheet = service.createWorksheet(workbook, 'Test');

      // Add some content first
      worksheet.getCell('A1').value = 'Test1';
      worksheet.getCell('B1').value = 'Test2';
      worksheet.getCell('A2').value = 'Test3';
      worksheet.getCell('B2').value = 'Test4';

      service.applyBordersToRange(worksheet, 1, 1, 2, 2);

      const cellA1 = worksheet.getCell('A1');
      const cellB2 = worksheet.getCell('B2');

      expect(cellA1.border?.top?.style).toBe('thin');
      expect(cellA1.border?.left?.style).toBe('thin');
      expect(cellB2.border?.bottom?.style).toBe('thin');
      expect(cellB2.border?.right?.style).toBe('thin');
    });
  });
});
