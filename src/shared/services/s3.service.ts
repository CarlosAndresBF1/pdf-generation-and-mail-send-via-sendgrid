import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
    this.cdnUrl = this.configService.get<string>('AWS_CDN_DOMAIN') || '';
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType = 'application/octet-stream',
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    // Return CDN URL
    return `${this.cdnUrl}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error('File not found in S3');
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    const stream = response.Body as NodeJS.ReadableStream;

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  generateCertificateKey(
    client: string,
    year: number,
    certificateId: number,
    certificateName: string,
    attendeeName: string,
  ): string {
    const sanitizedClient = client.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedCertName = certificateName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedAttendeeName = attendeeName.replace(/[^a-zA-Z0-9]/g, '_');

    return `certificates/${sanitizedClient}_${year}/${certificateId}_${sanitizedCertName}/${sanitizedAttendeeName}_certificate.pdf`;
  }

  extractKeyFromUrl(url: string): string {
    // Extract key from CDN URL
    return url.replace(`${this.cdnUrl}/`, '');
  }
}
