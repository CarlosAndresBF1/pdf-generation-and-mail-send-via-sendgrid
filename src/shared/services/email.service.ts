import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface EmailData {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  attachments?: Array<{
    content: string; // base64 encoded
    filename: string;
    type: string;
    disposition: string;
  }>;
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  private getFromEmail(): string {
    return (
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@example.com'
    );
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    const msg = {
      to: emailData.to,
      from: this.getFromEmail(),
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData,
      attachments: emailData.attachments,
    };

    await sgMail.send(msg);
  }

  async sendCertificateEmail(
    recipientEmail: string,
    recipientName: string,
    certificateName: string,
    eventName: string,
    eventLink: string,
    downloadLink: string,
    templateId: string,
    pdfBuffer: Buffer,
    pdfFilename: string,
  ): Promise<void> {
    const emailData: EmailData = {
      to: recipientEmail,
      templateId,
      dynamicTemplateData: {
        recipient_name: recipientName,
        certificate_name: certificateName,
        event_name: eventName,
        event_link: eventLink,
        download_link: downloadLink,
      },
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    await this.sendEmail(emailData);
  }
}
