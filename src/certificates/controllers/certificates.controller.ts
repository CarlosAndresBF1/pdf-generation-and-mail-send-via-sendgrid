import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CertificatesService } from '../services/certificates.service';
import { DesignImageService } from '../services/design-image.service';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';
import { UploadDesignImageResponseDto } from '../dto/upload-design-image.dto';
import {
  TestCertificateDto,
  TestCertificateResponseDto,
} from '../dto/test-certificate.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly designImageService: DesignImageService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new certificate template configuration',
    description:
      'Creates a new certificate template configuration with all necessary settings for event certificates including client information, template design, email configuration, SendGrid template association, and custom sender settings. This configuration will be used to generate personalized certificates for attendees.',
  })
  @ApiResponse({
    status: 201,
    description: 'Certificate configuration created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all certificate template configurations',
    description:
      'Retrieves all certificate template configurations in the system including both active and inactive templates. Shows complete configuration details such as client information, design URLs, email settings, SendGrid template IDs, and custom sender configurations. Essential for administrative management of certificate templates.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of certificate configurations retrieved successfully',
  })
  findAll() {
    return this.certificatesService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'List only active certificate templates',
    description:
      'Retrieves only certificate template configurations that are currently active and available for use in certificate generation. Filters out disabled or archived templates. Ideal for dropdown lists and certificate selection interfaces where only usable templates should be displayed.',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of active certificate configurations retrieved successfully',
  })
  findActive() {
    return this.certificatesService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get detailed certificate template configuration',
    description:
      'Retrieves complete details for a specific certificate template configuration including all settings, design information, email configuration, SendGrid integration details, and custom sender settings. Returns 404 if the template does not exist.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update certificate configuration',
    description: 'Updates an existing certificate configuration',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, updateCertificateDto);
  }

  @Put(':id/toggle-active')
  @ApiOperation({
    summary: 'Toggle certificate template active status',
    description:
      'Switches a certificate template between active and inactive states. Active templates are available for certificate generation while inactive templates are hidden from selection lists. This allows for template lifecycle management without permanent deletion.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration status toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.toggleActive(id);
  }

  @Post('upload-design')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload background design image for certificates',
    description:
      'Uploads design images to S3 storage for use as certificate backgrounds. Supports JPEG, PNG, WebP, and SVG formats up to 10MB. Images are automatically organized in S3 with client and year folder structure. Returns the CDN URL for immediate use in certificate templates. Validates image format and size before upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload design image',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, SVG)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadDesignImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or validation errors',
  })
  async uploadDesignImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadDesignImageResponseDto> {
    return this.designImageService.uploadDesignImage(file);
  }

  @Post('test-certificate')
  @ApiOperation({
    summary: 'Generate and send test certificate for template validation',
    description:
      'Creates a temporary certificate using the specified template and sends it via email for testing and validation purposes. Does not store any data in the database or create permanent records. Perfect for testing certificate designs, email templates, and SendGrid configurations before production use. Uses custom sender email and subject from the certificate template.',
  })
  @ApiResponse({
    status: 201,
    description: 'Test certificate sent successfully',
    type: TestCertificateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  async sendTestCertificate(
    @Body() testCertificateDto: TestCertificateDto,
  ): Promise<TestCertificateResponseDto> {
    return this.certificatesService.generateAndSendTestCertificate(
      testCertificateDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete certificate template configuration permanently',
    description:
      'Permanently removes a certificate template configuration from the system. This operation cannot be undone and will affect any existing generated certificates that reference this template. Use with extreme caution as it impacts system functionality and historical data integrity.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.remove(id);
  }
}
