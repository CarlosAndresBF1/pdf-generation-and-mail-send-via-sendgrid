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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Generated Certificates')
@Controller('generated-certificates')
export class GeneratedCertificatesController {
  constructor(
    private readonly generatedCertificatesService: GeneratedCertificatesService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Generate certificates',
    description:
      'Generates PDF certificates for specified attendees and optionally schedules email sending',
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
    summary: 'Schedule email sending',
    description: 'Schedules email sending for specific generated certificates',
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

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Get all generated certificates',
    description: 'Retrieves all generated certificates with their details',
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
    summary: 'Get generated certificate by ID',
    description: 'Retrieves a specific generated certificate with its details',
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Delete generated certificate',
    description: 'Deletes a generated certificate and its PDF from S3',
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
    summary: 'Download certificate PDF',
    description:
      'Downloads a certificate PDF. Regenerates the PDF in real-time. No authentication required.',
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
