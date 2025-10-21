import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GeneratedCertificatesService } from '../services/generated-certificates.service';
import { GenerateCertificatesDto } from '../dto/generate-certificates.dto';
import { SendEmailsDto } from '../dto/send-emails.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Generated Certificates')
@Controller('generated-certificates')
export class GeneratedCertificatesController {
  constructor(
    private readonly generatedCertificatesService: GeneratedCertificatesService,
  ) {}

  /*
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Generate PDF certificates for attendees',
    description:
      'Creates PDF certificates for the specified list of attendees using a certificate template. The system generates individual PDFs with personalized data, uploads them to S3 storage, and stores the certificate records in the database. Optionally creates email jobs for automatic delivery if sendEmails is true. Prevents duplicate certificate generation for the same attendee-certificate combination.',
  })
  @ApiResponse({
    status: 201,
    description: 'Certificates generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration or attendees not found',
  })
  generate(@Body() generateCertificatesDto: GenerateCertificatesDto) {
    return this.generatedCertificatesService.generateCertificates(
      generateCertificatesDto,
    );
  }

  @Post(':id/send-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Schedule email delivery for a single certificate',
    description:
      'Creates an email job for delivering a specific generated certificate to the attendee. The system adds the certificate to the email queue for asynchronous processing. Only creates a job if one does not already exist for this certificate to prevent duplicate email delivery. The email will include the PDF certificate as an attachment and use the custom sender configuration from the certificate template.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Generated certificate ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Email scheduled successfully',
  })
  scheduleEmail(@Param('id', ParseIntPipe) id: number) {
    return this.generatedCertificatesService.sendCertificateEmails([id]);
  }

  @Post('send-emails')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Schedule email delivery for multiple certificates',
    description:
      'Creates email jobs for multiple generated certificates in a single operation. The system validates each certificate ID, checks for existing jobs to prevent duplicates, and creates new jobs only for certificates that do not already have email jobs. Returns detailed statistics about how many jobs were created versus skipped. This is ideal for bulk email operations after generating multiple certificates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email jobs scheduled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            jobsCreated: { type: 'number', example: 5 },
            jobsSkipped: { type: 'number', example: 2 },
            totalRequested: { type: 'number', example: 7 },
          },
        },
        message: {
          type: 'string',
          example: 'Email jobs scheduled successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  scheduleMultipleEmails(@Body() sendEmailsDto: SendEmailsDto) {
    return this.generatedCertificatesService.sendCertificateEmails(
      sendEmailsDto.certificateIds,
    );
  }

  @Post('process-pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Create email jobs for certificates without jobs',
    description:
      'Creates email jobs for all generated certificates that do not have associated email jobs. This endpoint processes the certificates synchronously and creates the necessary jobs in the database. The created jobs will then be processed by the background job scheduler. Returns statistics about how many jobs were created vs how many certificates already had jobs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs created successfully for pending certificates',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalCertificates: { type: 'number', example: 10 },
            jobsCreated: { type: 'number', example: 8 },
            alreadyProcessed: { type: 'number', example: 2 },
          },
        },
        message: {
          type: 'string',
          example:
            'Processed pending certificates: 8 jobs created, 2 already had jobs',
        },
      },
    },
  })
  processPendingCertificates() {
    return this.generatedCertificatesService.processPendingCertificates();
  }

  @Post('process-pending/force')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Force immediate processing of pending certificates (EMERGENCY)',
    description:
      'Forces immediate synchronous processing of pending certificates. WARNING: This endpoint may timeout with large datasets. Use only in emergency situations or when you are certain there are few pending certificates. For normal operations, use the standard process-pending endpoint which schedules background processing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending certificates processed immediately',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalCertificates: { type: 'number', example: 10 },
            jobsCreated: { type: 'number', example: 8 },
            alreadyProcessed: { type: 'number', example: 2 },
          },
        },
        message: {
          type: 'string',
          example:
            'Processed pending certificates: 8 jobs created, 2 already had jobs',
        },
      },
    },
  })
  @ApiResponse({
    status: 504,
    description: 'Request timeout - too many pending certificates',
  })
  forceProcessPendingCertificates() {
    return this.generatedCertificatesService.processPendingCertificates();
  }
*/
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'List all generated certificates in the system',
    description:
      'Retrieves a comprehensive list of all generated certificates with complete details including certificate configuration, attendee information, S3 URLs, generation timestamps, and email delivery status. Results are ordered by generation date (newest first) and include full relational data for certificates and attendees. Useful for administrative overview and system monitoring.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of generated certificates retrieved successfully',
  })
  findAll() {
    return this.generatedCertificatesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Get detailed information for a specific certificate',
    description:
      'Retrieves complete details for a single generated certificate including all associated data such as attendee information, certificate template configuration, S3 storage URL, generation timestamp, and email delivery status. Returns 404 if the certificate does not exist. Includes full relational data for comprehensive certificate inspection.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Generated certificate ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Generated certificate retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Generated certificate not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.generatedCertificatesService.findOne(id);
  }

  /*
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Delete a generated certificate permanently',
    description:
      'Permanently removes a generated certificate from the system including its database record and associated PDF file from S3 storage. This operation cannot be undone. The certificate will no longer be accessible for download and any associated email jobs may fail. Use with caution as this affects data integrity and user access to their certificates.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Generated certificate ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Generated certificate deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Generated certificate not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.generatedCertificatesService.remove(id);
  }
  */
}

// Public controller for certificate downloads (no authentication required)
@ApiTags('Public Certificate Downloads')
@Controller('certificate')
export class PublicCertificateController {
  constructor(
    private readonly generatedCertificatesService: GeneratedCertificatesService,
  ) {}

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download certificate PDF file (public access)',
    description:
      'Generates and downloads a certificate PDF file in real-time using the original certificate template and attendee data. This endpoint does not require authentication and is designed for public access via email links. The PDF is regenerated dynamically to ensure it always reflects the current template design. Returns the PDF as a downloadable attachment with appropriate headers for browser compatibility.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Generated certificate ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file downloaded successfully',
    headers: {
      'Content-Type': {
        description: 'application/pdf',
      },
      'Content-Disposition': {
        description: 'attachment; filename="certificate.pdf"',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate not found',
  })
  async downloadCertificate(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      // Get certificate details
      const generatedCert = await this.generatedCertificatesService.findOne(id);

      // Regenerate PDF in real-time
      const pdfBuffer =
        await this.generatedCertificatesService.regenerateCertificatePdf(id);

      // Set response headers
      const filename = `${generatedCert.attendee?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'certificate'}_certificate.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          statusCode: 404,
          message: 'Certificate not found',
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          message: 'Internal server error',
        });
      }
    }
  }
}
