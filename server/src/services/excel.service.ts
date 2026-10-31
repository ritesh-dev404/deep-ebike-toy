import ExcelJS from 'exceljs';
import { Response } from 'express';

export class ExcelService {
  /**
   * Generates and downloads an Excel workbook from columns and rows
   */
  static async exportToStream(
    res: Response,
    sheetName: string,
    columns: { header: string; key: string; width: number }[],
    data: any[],
    filename: string
  ) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DEEP E-BIKE & TOY POS System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = columns;

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Navy blue brand color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add rows
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Striping & border formatting
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
        row.height = 22;
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
