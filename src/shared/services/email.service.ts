import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailException } from '../exceptions/email.exception';

interface SendGridError {
  response?: {
    body?: {
      errors?: Array<{
        message: string;
        field?: string;
      }>;
    };
  };
}

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
  private sgMail: any;

  constructor(private readonly configService: ConfigService) {
    // Initialize SendGrid synchronously
    this.sgMail = require('@sendgrid/mail');
    // Use MAIL_API_KEY which contains the SendGrid API Key
    const apiKey = this.configService.get<string>('MAIL_API_KEY');
    if (apiKey) {
      this.sgMail.setApiKey(apiKey);
    }
  }

  private getFromEmail(customEmail?: string): string {
    return (
      customEmail ||
      this.configService.get<string>('MAIL_FROM_ADDRESS') ||
      'noreply@example.com'
    );
  }

  async sendEmail(
    emailData: EmailData,
    customFromEmail?: string,
  ): Promise<void> {
    if (!this.sgMail) {
      throw new EmailException('SendGrid not initialized properly');
    }

    const msg = {
      to: emailData.to,
      from: this.getFromEmail(customFromEmail),
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData,
      attachments: emailData.attachments,
    };

    try {
      await this.sgMail.send(msg);
    } catch (error) {
      throw new EmailException(
        'Error enviando el email',
        error as SendGridError,
      );
    }
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
    customFromEmail?: string,
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

    await this.sendEmail(emailData, customFromEmail);
  }
}
