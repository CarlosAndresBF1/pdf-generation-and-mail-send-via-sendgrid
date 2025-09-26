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
  subject?: string;
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
    // Initialize SendGrid dynamically
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.sgMail = require('@sendgrid/mail');
      // Use MAIL_API_KEY which contains the SendGrid API Key
      const apiKey = this.configService.get<string>('MAIL_API_KEY');
      if (apiKey) {
        this.sgMail.setApiKey(apiKey);
      }
    } catch (error) {
      console.error('Error initializing SendGrid:', error);
      throw new EmailException('Failed to initialize SendGrid service');
    }
  }

  private getFromEmail(customEmail?: string): string {
    return (
      customEmail ||
      this.configService.get<string>('MAIL_FROM_ADDRESS') ||
      'noreply@example.com'
    );
  }

  private getFromObject(
    customEmail?: string,
    customName?: string,
  ): string | { email: string; name: string } {
    const email = this.getFromEmail(customEmail);

    if (customName) {
      return {
        email,
        name: customName,
      };
    }

    return email;
  }

  async sendEmail(
    emailData: EmailData,
    customFromEmail?: string,
    customFromName?: string,
  ): Promise<void> {
    if (!this.sgMail) {
      throw new EmailException('SendGrid service not initialized properly');
    }

    const msg = {
      to: emailData.to,
      from: this.getFromObject(customFromEmail, customFromName),
      templateId: emailData.templateId,
      subject: emailData.subject,
      dynamicTemplateData: emailData.dynamicTemplateData,
      attachments: emailData.attachments,
    };

    // Log para debugging
    console.log('SendGrid message payload:', {
      to: msg.to,
      from: msg.from,
      templateId: msg.templateId,
      subject: msg.subject,
      dynamicTemplateData: msg.dynamicTemplateData,
      attachmentsCount: msg.attachments?.length || 0,
    });

    try {
      await this.sgMail.send(msg);
    } catch (error) {
      console.error('SendGrid error details:', error);
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
    customSubject?: string,
    customFromName?: string,
  ): Promise<void> {
    const emailData: EmailData = {
      to: recipientEmail,
      templateId,
      subject: customSubject,
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

    await this.sendEmail(emailData, customFromEmail, customFromName);
  }
}
