import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailException } from '../exceptions/email.exception';
import sgMail from '@sendgrid/mail';

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
  constructor(private readonly configService: ConfigService) {
    // Initialize SendGrid dynamically
    try {
      const apiKey = this.configService.get<string>('MAIL_API_KEY');
      if (apiKey) {
        sgMail.setApiKey(apiKey);
      }
    } catch (error) {
      console.error('Error initializing SendGrid:', error);
      throw new EmailException('Failed to initialize SendGrid service');
    }
  }

  private getFromEmail(customEmail?: string): string {
    if (!customEmail) {
      throw new EmailException(
        'Custom sender email is required. MAIL_FROM_ADDRESS fallback is not allowed.',
      );
    }
    return customEmail;
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
    const msg = {
      to: emailData.to,
      from: this.getFromObject(customFromEmail, customFromName),
      templateId: emailData.templateId,
      subject: emailData.subject,
      dynamicTemplateData: emailData.dynamicTemplateData,
      attachments: emailData.attachments,
    };

    try {
      await sgMail.send(msg);
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
