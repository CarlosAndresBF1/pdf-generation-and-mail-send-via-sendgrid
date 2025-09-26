import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CertificateData {
  fullName: string;
  certificateName: string;
  eventName: string;
  baseDesignUrl: string;
  country?: string;
  documentType?: string;
  documentNumber?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly templatesPath = path.join(
    process.cwd(),
    'src',
    'certificates',
    'templates',
  );

  async generateCertificatePdf(
    certificateData: CertificateData,
    templateName = 'default',
  ): Promise<Buffer> {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);

    // Read template file fresh every time (no caching)
    let htmlContent: string;
    try {
      htmlContent = await fs.readFile(templatePath, 'utf-8');
    } catch {
      // If template doesn't exist, use default template
      htmlContent = this.getDefaultTemplate();
    }

    // Replace placeholders with actual data
    const processedHtml = this.replacePlaceholders(
      htmlContent,
      certificateData,
    );

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(processedHtml, { waitUntil: 'networkidle0' });

      // Get the dimensions of the image to set PDF size accordingly
      const imageDimensions = await page.evaluate(() => {
        const img = document.querySelector(
          '.background-image',
        ) as HTMLImageElement;
        if (img) {
          return {
            width: img.naturalWidth,
            height: img.naturalHeight,
          };
        }
        return { width: 1200, height: 800 }; // fallback dimensions
      });

      const pdfBuffer = await page.pdf({
        width: `${imageDimensions.width}px`,
        height: `${imageDimensions.height}px`,
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private replacePlaceholders(html: string, data: CertificateData): string {
    // Generate current date for certificate
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      html
        // Template variables (summit-2025-template-17.html format)
        .replace(/\{\{PARTICIPANT_NAME\}\}/g, data.fullName || '')
        .replace(/\{\{CERTIFICATE_DATE\}\}/g, currentDate)
        .replace(/\{\{CERTIFICATE_NAME\}\}/g, data.certificateName || '')
        .replace(/\{\{BACKGROUND_IMAGE\}\}/g, data.baseDesignUrl || '')
        .replace(/\{\{EVENT_NAME\}\}/g, data.eventName || '')
        // Legacy variables (for backward compatibility)
        .replace(/\{\{fullName\}\}/g, data.fullName || '')
        .replace(/\{\{certificateName\}\}/g, data.certificateName || '')
        .replace(/\{\{eventName\}\}/g, data.eventName || '')
        .replace(/\{\{baseDesignUrl\}\}/g, data.baseDesignUrl || '')
        .replace(/\{\{country\}\}/g, data.country || '')
        .replace(/\{\{documentType\}\}/g, data.documentType || '')
        .replace(/\{\{documentNumber\}\}/g, data.documentNumber || '')
    );
  }

  private getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            background-image: url('{{baseDesignUrl}}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            width: 297mm;
            height: 210mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: #333;
        }
        
        .certificate-content {
            max-width: 80%;
            z-index: 2;
        }
        
        .certificate-title {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 30px;
            color: #2c3e50;
        }
        
        .participant-name {
            font-size: 36px;
            font-weight: 600;
            margin: 20px 0;
            color: #e74c3c;
        }
        
        .event-name {
            font-size: 24px;
            font-weight: 400;
            margin: 20px 0;
            color: #34495e;
        }
        
        .certificate-text {
            font-size: 18px;
            line-height: 1.6;
            margin: 20px 0;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="certificate-content">
        <h1 class="certificate-title">CERTIFICADO</h1>
        <div class="certificate-text">Se otorga el presente certificado a:</div>
        <h2 class="participant-name">{{fullName}}</h2>
        <div class="certificate-text">Por su participación en:</div>
        <h3 class="event-name">{{eventName}}</h3>
        <div class="certificate-text">Certificado: {{certificateName}}</div>
    </div>
</body>
</html>
    `;
  }
}
